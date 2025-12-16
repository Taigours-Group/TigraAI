import React, { useState, useEffect } from 'react';
import { IconX, IconTrash, IconDatabase, IconInfo, TigraLogo, IconUser, IconActivity, IconLogout, IconSettings, IconCheck } from './Icons';
import { UserProfile, UserPreferences } from '../types';
import AuthForms from './AuthForms';
import { storageService } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile | null) => void;
  userPreferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
}

type Tab = 'account' | 'personalization' | 'storage' | 'limits' | 'about';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onClearHistory, 
  userProfile, 
  onUpdateProfile,
  userPreferences,
  onUpdatePreferences
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [storageStats, setStorageStats] = useState({ used: 0, total: 0, percent: 0 });
  const [isCloud, setIsCloud] = useState(false);
  const [isDefaultCloud, setIsDefaultCloud] = useState(false);
  
  // Cloud Config State
  const [cloudUrl, setCloudUrl] = useState('');
  const [cloudKey, setCloudKey] = useState('');
  const [showCloudInput, setShowCloudInput] = useState(false);
  
  // Local state for editing preferences
  const [editPrefs, setEditPrefs] = useState<UserPreferences>(userPreferences);
  const [prefSaveMsg, setPrefSaveMsg] = useState('');

  useEffect(() => {
    setEditPrefs(userPreferences);
  }, [userPreferences]);

  useEffect(() => {
    if (isOpen) {
      setIsCloud(storageService.isCloudEnabled());
      setIsDefaultCloud(storageService.isDefaultCloud());
      storageService.getStorageEstimate().then(estimate => {
        setStorageStats({
          used: estimate.usage,
          total: estimate.quota,
          percent: estimate.quota > 0 ? (estimate.usage / estimate.quota) * 100 : 0
        });
      });
      
      // Check for existing cloud config to populate fields
      const stored = localStorage.getItem('tigra_cloud_config');
      if (stored) {
          const { url, key } = JSON.parse(stored);
          setCloudUrl(url);
          setCloudKey(key);
      }
    }
  }, [isOpen]);

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to log out?')) {
        onUpdateProfile(null);
    }
  };

  const savePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences(editPrefs);
    setPrefSaveMsg('Saved');
    setTimeout(() => setPrefSaveMsg(''), 2000);
  };
  
  const handleConnectCloud = (e: React.FormEvent) => {
      e.preventDefault();
      if (!cloudUrl || !cloudKey) return;
      if (window.confirm("Switching databases requires a reload. Continue?")) {
          storageService.setCloudConfig(cloudUrl, cloudKey);
      }
  };
  
  const handleDisconnectCloud = () => {
      if (window.confirm("Switching databases requires a reload. Continue?")) {
          storageService.disconnectCloud();
      }
  };

  const handleDevExport = async () => {
    console.log("--- TIGRA DATA EXPORT ---");
    const data = await storageService.exportAllData();
    console.log(data);
    alert("Data dumped to Console (F12).");
  };

  const handleDevNuke = async () => {
    if (window.confirm("⚠️ DANGER: Factory Reset? This wipes local data.")) {
      await storageService.deleteDatabase();
      window.location.reload();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  const NavButton = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:w-full ${
        activeTab === tab 
          ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.05)]' 
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in md:p-4" onClick={onClose}>
      <div 
        className="w-full h-full md:max-w-4xl md:h-[650px] flex flex-col md:flex-row bg-[#0a0a0a] md:border border-white/10 md:rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-[#0e0e0e] border-b md:border-b-0 md:border-r border-white/5 flex flex-col flex-shrink-0">
          <div className="p-4 md:p-6 flex items-center justify-between md:justify-start gap-2 border-b md:border-b-0 border-white/5">
             <div className="flex items-center gap-2">
                <TigraLogo className="w-6 h-6" />
                <span className="font-bold text-zinc-100 tracking-tight">Settings</span>
             </div>
             <button onClick={onClose} className="md:hidden text-zinc-500 p-1">
                <IconX className="w-6 h-6" />
             </button>
          </div>
          
          <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-4 gap-1 no-scrollbar">
            <NavButton tab="account" icon={IconUser} label="Account" />
            <NavButton tab="personalization" icon={IconSettings} label="Personalization" />
            <NavButton tab="storage" icon={IconDatabase} label="Data & Cloud" />
            <NavButton tab="limits" icon={IconActivity} label="Usage Limits" />
            <NavButton tab="about" icon={IconInfo} label="About Tigra" />
          </div>

          <div className="hidden md:block mt-auto p-4 border-t border-white/5">
             <div className="px-2 text-[10px] text-zinc-600">
               Tigra AI v1.5.0 <br /> {isCloud ? '☁️ Cloud Active' : '💾 Local Mode'}
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
          <div className="hidden md:flex justify-end p-4">
             <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                <IconX className="w-5 h-5" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            
            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="space-y-6 max-w-lg mx-auto md:mx-0">
                <h2 className="text-2xl font-bold text-white mb-2">User Account</h2>
                
                {userProfile.isLoggedIn ? (
                  <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-6 rounded-2xl animate-fade-in">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
                           {userProfile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                           <h3 className="text-xl font-bold text-white truncate">{userProfile.name}</h3>
                           <p className="text-sm text-zinc-400 truncate">{userProfile.email}</p>
                           <div className="flex gap-2 mt-2">
                             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-900/30 text-cyan-400 border border-cyan-500/20">
                               FREE TIER
                             </span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="mb-6 p-3 bg-black/40 rounded-lg border border-white/5 text-[10px] md:text-xs text-zinc-500 font-mono break-all flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${isCloud ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                         {isCloud ? 'Synced to Cloud (Supabase)' : 'Stored Locally (IndexedDB)'}
                     </div>

                     <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/10 text-sm font-medium flex items-center gap-2">
                        <IconLogout className="w-4 h-4" /> Sign Out
                     </button>
                  </div>
                ) : (
                  <AuthForms onLoginSuccess={onUpdateProfile} />
                )}
              </div>
            )}

            {/* PERSONALIZATION TAB */}
            {activeTab === 'personalization' && (
               <div className="space-y-6 max-w-lg mx-auto md:mx-0">
                 <div>
                    <h2 className="text-2xl font-bold text-white">Personalization</h2>
                    <p className="text-sm text-zinc-500 mt-1">Stored in {isCloud ? 'Cloud' : 'Local DB'} to tailor responses.</p>
                 </div>

                 {!userProfile.isLoggedIn ? (
                   <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">Sign in to save settings.</div>
                 ) : (
                   <form onSubmit={savePreferences} className="space-y-4">
                      {/* ... (Existing Input Fields) ... */}
                      <div><label className="text-xs text-zinc-400">Country</label><input type="text" value={editPrefs.country || ''} onChange={e => setEditPrefs({...editPrefs, country: e.target.value})} className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white outline-none"/></div>
                      <div><label className="text-xs text-zinc-400">Occupation</label><input type="text" value={editPrefs.occupation || ''} onChange={e => setEditPrefs({...editPrefs, occupation: e.target.value})} className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white outline-none"/></div>
                      <div><label className="text-xs text-zinc-400">Interests</label><textarea rows={3} value={editPrefs.interests || ''} onChange={e => setEditPrefs({...editPrefs, interests: e.target.value})} className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-sm text-white outline-none"/></div>
                      <div className="flex justify-between pt-2">
                         <span className="text-emerald-400 text-xs">{prefSaveMsg}</span>
                         <button type="submit" className="px-6 py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-cyan-50">Save</button>
                      </div>
                   </form>
                 )}
               </div>
            )}

            {/* STORAGE & CLOUD TAB */}
            {activeTab === 'storage' && (
               <div className="space-y-8 max-w-lg mx-auto md:mx-0">
                 <div>
                     <h2 className="text-2xl font-bold text-white mb-2">Data & Cloud</h2>
                     <p className="text-sm text-zinc-500">Manage where your data lives.</p>
                 </div>
                 
                 {/* Connection Status */}
                 <div className={`p-6 rounded-2xl border ${isCloud ? 'bg-green-950/10 border-green-500/20' : 'bg-[#0f0f0f] border-white/5'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCloud ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            <IconDatabase className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{isCloud ? 'Cloud Connected' : 'Local Storage Only'}</h3>
                            <p className="text-xs text-zinc-500">
                                {isDefaultCloud 
                                  ? 'Connected to Official TGO Network (Supabase).' 
                                  : isCloud ? 'Connected to custom Supabase instance.' : 'Data is saved on this device only.'}
                            </p>
                        </div>
                    </div>
                    
                    {isCloud ? (
                         <div className="space-y-3">
                            {!isDefaultCloud && (
                              <div className="text-xs bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-zinc-400 truncate">
                                  {cloudUrl}
                              </div>
                            )}
                            <button onClick={handleDisconnectCloud} className="text-xs text-zinc-400 hover:text-white underline">
                                {isDefaultCloud ? 'Override Default Connection' : 'Disconnect Custom Database'}
                            </button>
                            
                            {/* If trying to override default */}
                             {isDefaultCloud && (
                                 <div className="mt-2 pt-2 border-t border-white/5">
                                      <button onClick={() => setShowCloudInput(!showCloudInput)} className="text-xs text-cyan-500 hover:text-cyan-400">
                                         Configure Custom Database
                                      </button>
                                 </div>
                             )}
                         </div>
                    ) : (
                         <div className="space-y-4">
                             <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-200">
                                 You are disconnected from the TGO Cloud. Data is local only.
                             </div>
                             <button onClick={handleDisconnectCloud} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
                                 Reconnect to Default
                             </button>
                         </div>
                    )}
                    
                    {/* Custom Connection Form */}
                    {(showCloudInput || (!isCloud && !isDefaultCloud)) && (
                         <form onSubmit={handleConnectCloud} className="space-y-3 animate-fade-in mt-4 border-t border-white/5 pt-4">
                             <p className="text-xs text-zinc-400 font-bold">Custom Database Connection</p>
                             <input required placeholder="Supabase Project URL" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500/50" />
                             <input required type="password" placeholder="Supabase Anon Key" value={cloudKey} onChange={e => setCloudKey(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500/50" />
                             <div className="flex gap-2">
                                 <button type="submit" className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold">Connect Custom</button>
                             </div>
                         </form>
                    )}
                 </div>

                 {/* Developer Tools */}
                 <div className="pt-4 border-t border-white/5 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Developer Zone</h3>
                    <div className="grid grid-cols-2 gap-3">
                         <button onClick={handleDevExport} className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-lg text-left group">
                             <div className="text-xs font-bold text-zinc-300 group-hover:text-cyan-400 transition-colors">Export Data</div>
                             <div className="text-[10px] text-zinc-600">Dump JSON to Console</div>
                         </button>
                         {!isCloud && (
                             <button onClick={handleDevNuke} className="p-3 bg-red-950/10 border border-red-900/30 hover:bg-red-900/20 rounded-lg text-left">
                                 <div className="text-xs font-bold text-red-400">Factory Reset</div>
                                 <div className="text-[10px] text-red-500/50">Wipe Local DB</div>
                             </button>
                         )}
                    </div>
                 </div>

               </div>
            )}
            
            {/* LIMITS TAB (Static) */}
            {activeTab === 'limits' && (
                <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-white/5 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-zinc-300">Messages</span><span className="text-xs text-zinc-500">Unlimited</span></div>
                        <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-white/5"><div className="h-full bg-emerald-500 w-full opacity-50"></div></div>
                    </div>
                </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
                <div className="flex flex-col items-center p-8 rounded-2xl bg-gradient-to-b from-[#0f0f0f] to-black border border-white/5 text-center">
                    <TigraLogo className="w-20 h-20 mb-4" />
                    <h3 className="text-2xl font-bold text-white">Tigra AI</h3>
                    <p className="text-zinc-500 text-xs mt-2">v1.5.0 • Powered by TGO</p>
                </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;