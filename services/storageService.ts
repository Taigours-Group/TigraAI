import { ChatSession, UserProfile, UserPreferences } from "../types";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- CONFIGURATION ---
const DB_NAME = 'TigraDB';
const DB_VERSION = 1;

// Object Store Names (IndexedDB)
const STORE_USERS = 'users';
const STORE_CHATS = 'chats';
const STORE_PREFS = 'prefs';

// Cloud Config Key
const CLOUD_CONFIG_KEY = 'tigra_cloud_config';

// TGO Cloud Defaults (Provided by Developer)
const DEFAULT_SB_URL = "https://fkmqhrohoijkropikpul.supabase.co";
const DEFAULT_SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbXFocm9ob2lqa3JvcGlrcHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODEzODYsImV4cCI6MjA4MTQ1NzM4Nn0.gpnmMQnETw1jS6FkoeBko22T7UMSi7vgQTObeaezF7g";

// --- INDEXED DB HELPERS (LOCAL) ---

const openLocalDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_USERS)) db.createObjectStore(STORE_USERS, { keyPath: 'email' });
      if (!db.objectStoreNames.contains(STORE_CHATS)) db.createObjectStore(STORE_CHATS, { keyPath: 'email' });
      if (!db.objectStoreNames.contains(STORE_PREFS)) db.createObjectStore(STORE_PREFS, { keyPath: 'email' });
    };
  });
};

const performLocalTx = <T>(
  storeName: string, 
  mode: IDBTransactionMode, 
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> => {
  return openLocalDB().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let request: IDBRequest<T> | void;
      try { request = callback(store); } catch (e) { reject(e); return; }
      transaction.oncomplete = () => resolve(request ? request.result : undefined as T);
      transaction.onerror = () => reject(transaction.error);
    });
  });
};

// --- SUPABASE HELPERS (CLOUD) ---

let supabaseInstance: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;
  
  // 1. Check for manual override in local storage
  const configStr = localStorage.getItem(CLOUD_CONFIG_KEY);
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      if (config.url && config.key) {
        supabaseInstance = createClient(config.url, config.key);
        return supabaseInstance;
      }
    } catch (e) { console.error("Invalid Cloud Config"); }
  }

  // 2. Use Hardcoded Defaults (TGO Cloud)
  if (DEFAULT_SB_URL && DEFAULT_SB_KEY) {
      try {
          supabaseInstance = createClient(DEFAULT_SB_URL, DEFAULT_SB_KEY);
          // Log schema help for dev
          console.log("%c[Tigra Cloud] Connected to default Supabase instance.", "color: #22d3ee; font-weight: bold;");
          return supabaseInstance;
      } catch (e) { console.error("Failed to connect to default cloud", e); }
  }

  return null;
};

// --- HYBRID SERVICE ---

export const storageService = {
  
  isCloudEnabled: (): boolean => {
    return !!getSupabase();
  },

  isDefaultCloud: (): boolean => {
    return !localStorage.getItem(CLOUD_CONFIG_KEY) && !!DEFAULT_SB_URL;
  },

  // Configuration
  setCloudConfig: (url: string, key: string) => {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify({ url, key }));
    supabaseInstance = null; // Reset instance
    window.location.reload(); // Reload to initialize cloud
  },
  
  disconnectCloud: () => {
    localStorage.removeItem(CLOUD_CONFIG_KEY);
    supabaseInstance = null;
    window.location.reload();
  },

  // 1. User Existence
  userExists: async (email: string): Promise<boolean> => {
    const sb = getSupabase();
    if (sb) {
      // Check 'users' table in Supabase
      const { data, error } = await sb.from('users').select('email').eq('email', email).maybeSingle();
      if (error && error.code !== 'PGRST116') {
         console.warn("Cloud Check Error:", JSON.stringify(error, null, 2));
      }
      return !!data;
    }
    // Local Fallback
    try {
      const user = await performLocalTx(STORE_USERS, 'readonly', (store) => store.get(email));
      return !!user;
    } catch { return false; }
  },

  // 2. Register
  registerUser: async (profile: Omit<UserProfile, 'isLoggedIn'>, password: string): Promise<boolean> => {
    const sb = getSupabase();
    if (sb) {
      // FIX: Sanitize payload: Supabase SQL table does not have 'id' or 'preferences' columns.
      // SQL Schema expected: email, name, password, age, gender, country, phone, joinedAt
      const { id, preferences, ...userData } = profile;

      const { error: err1 } = await sb.from('users').insert([{ ...userData, password }]); 
      if (err1) { 
          console.error("Cloud Register Error:", JSON.stringify(err1, null, 2)); 
          
          if (err1.code === '42P01') {
             alert("Database Error: Table 'users' does not exist. Please run the SQL setup script in Supabase.");
          } else if (err1.code === '42703') {
             alert(`Schema Mismatch: The app sent a field that doesn't exist in the database. ${err1.message}`);
          }
          
          return false; 
      }
      
      // Init other tables
      const { error: err2 } = await sb.from('chats').insert([{ email: profile.email, sessions: [] }]);
      if (err2) console.error("Cloud Chat Init Error:", JSON.stringify(err2));

      const { error: err3 } = await sb.from('prefs').insert([{ email: profile.email, data: {} }]);
      if (err3) console.error("Cloud Prefs Init Error:", JSON.stringify(err3));

      return true;
    }
    
    // Local Fallback
    const exists = await storageService.userExists(profile.email);
    if (exists) return false;
    try {
      await performLocalTx(STORE_USERS, 'readwrite', (store) => store.put({ ...profile, password }));
      await performLocalTx(STORE_CHATS, 'readwrite', (store) => store.put({ email: profile.email, sessions: [] }));
      await performLocalTx(STORE_PREFS, 'readwrite', (store) => store.put({ email: profile.email, data: {} }));
      return true;
    } catch { return false; }
  },

  // 3. Login
  loginUser: async (email: string, password: string): Promise<UserProfile | null> => {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('users').select('*').eq('email', email).maybeSingle();
      if (error) {
        console.error("Cloud Login Error:", JSON.stringify(error, null, 2));
        return null;
      }
      if (data && data.password === password) {
         const { password: _, ...profile } = data;
         // FIX: Generate a fake ID for frontend compatibility (since SQL doesn't store one)
         return { ...profile, id: 'cloud_' + email, isLoggedIn: true } as UserProfile;
      }
      return null;
    }

    // Local Fallback
    try {
      const record = await performLocalTx<any>(STORE_USERS, 'readonly', (store) => store.get(email));
      if (record && record.password === password) {
        const { password: _, ...profile } = record;
        return { ...profile, isLoggedIn: true };
      }
      return null;
    } catch { return null; }
  },

  // 4. Get Data
  getUserData: async (email: string): Promise<UserProfile | null> => {
    const sb = getSupabase();
    if (sb) {
       const { data, error } = await sb.from('users').select('*').eq('email', email).maybeSingle();
       if (error) {
           console.error("Cloud GetUser Error:", JSON.stringify(error));
           return null;
       }
       if (data) {
         const { password: _, ...profile } = data;
         // FIX: Generate a fake ID for frontend compatibility
         return { ...profile, id: 'cloud_' + email, isLoggedIn: true } as UserProfile;
       }
       return null;
    }

    try {
      const record = await performLocalTx<any>(STORE_USERS, 'readonly', (store) => store.get(email));
      if (record) {
        const { password: _, ...profile } = record;
        return profile;
      }
      return null;
    } catch { return null; }
  },

  // 5. Chat History
  saveChatHistory: async (email: string, sessions: ChatSession[]) => {
    const sb = getSupabase();
    if (sb) {
       // Upsert
       const { error } = await sb.from('chats').upsert({ email, sessions }, { onConflict: 'email' });
       if (error) console.error("Cloud Save Chats Error:", JSON.stringify(error, null, 2));
       return;
    }
    
    try {
      await performLocalTx(STORE_CHATS, 'readwrite', (store) => store.put({ email, sessions }));
    } catch (e) { console.error(e); }
  },

  loadChatHistory: async (email: string): Promise<ChatSession[]> => {
    const sb = getSupabase();
    if (sb) {
       const { data, error } = await sb.from('chats').select('sessions').eq('email', email).maybeSingle();
       if (error && error.code !== 'PGRST116') console.error("Cloud Load Chats Error:", JSON.stringify(error));
       return data ? data.sessions : [];
    }

    try {
      const record = await performLocalTx<{email: string, sessions: ChatSession[]}>(
        STORE_CHATS, 'readonly', (store) => store.get(email)
      );
      return record ? record.sessions : [];
    } catch { return []; }
  },

  // 6. Preferences
  savePreferences: async (email: string, prefs: UserPreferences) => {
    const sb = getSupabase();
    if (sb) {
       await sb.from('prefs').upsert({ email, data: prefs }, { onConflict: 'email' });
       return;
    }

    try {
      await performLocalTx(STORE_PREFS, 'readwrite', (store) => store.put({ email, data: prefs }));
    } catch (e) { console.error(e); }
  },

  loadPreferences: async (email: string): Promise<UserPreferences> => {
    const sb = getSupabase();
    if (sb) {
       const { data, error } = await sb.from('prefs').select('data').eq('email', email).maybeSingle();
       if (error && error.code !== 'PGRST116') console.error("Cloud Load Prefs Error:", JSON.stringify(error));
       return data ? data.data : {};
    }

    try {
      const record = await performLocalTx<{email: string, data: UserPreferences}>(
        STORE_PREFS, 'readonly', (store) => store.get(email)
      );
      return record ? record.data : {};
    } catch { return {}; }
  },

  // Session (Browser specific)
  setCurrentSessionUser: (email: string) => localStorage.setItem('tigra_current_user', email),
  getCurrentSessionUser: (): string | null => localStorage.getItem('tigra_current_user'),
  clearCurrentSession: () => localStorage.removeItem('tigra_current_user'),
  
  // Storage Stats (Local Only)
  getStorageEstimate: async (): Promise<{ usage: number, quota: number }> => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return { usage: estimate.usage || 0, quota: estimate.quota || 0 };
    }
    return { usage: 0, quota: 0 };
  },

  // Utils
  exportAllData: async (): Promise<any> => {
     const sb = getSupabase();
     if (sb) {
        console.log("Fetching cloud data...");
        // Cloud Dump (Requires correct RLS or Service Role, might be limited by Anon key policies)
        // This is a best-effort dump for the tables we know about
        const [users, chats, prefs] = await Promise.all([
          sb.from('users').select('*'),
          sb.from('chats').select('*'),
          sb.from('prefs').select('*')
        ]);
        return { source: 'Supabase Cloud', users: users.data, chats: chats.data, prefs: prefs.data };
     } else {
        // Local Dump
        const getAll = (storeName: string) => performLocalTx(storeName, 'readonly', (store) => store.getAll());
        const [users, chats, prefs] = await Promise.all([
            getAll(STORE_USERS), getAll(STORE_CHATS), getAll(STORE_PREFS)
        ]);
        return { source: 'IndexedDB (Local)', users, chats, prefs };
     }
  },

  deleteDatabase: async (): Promise<void> => {
     localStorage.clear();
     sessionStorage.clear();
     return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve(); // proceed anyway
     });
  }
};