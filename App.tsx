import React, { useState, useEffect, useRef } from 'react';
import { GenerateContentResponse } from "@google/genai";
import { createChatSession, sendMessageStream } from './services/geminiService';
import { storageService } from './services/storageService';
import { Message, UserContext, AppState, ChatSession, UserProfile, UserPreferences } from './types';
import ChatBubble from './components/ChatBubble';
import SettingsModal from './components/SettingsModal';
import AuthForms from './components/AuthForms';
import { IconMenu, IconPlus, IconSend, IconTrash, IconBot, TigraLogo, IconSettings, IconMic } from './components/Icons';

// Default guest profile
const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  name: 'Guest User',
  email: 'guest@local',
  isLoggedIn: false,
  joinedAt: Date.now()
};

const GUEST_LIMIT = 5;

export default function App() {
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true); // Track DB load
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Auth & Prefs State
  const [userProfile, setUserProfile] = useState<UserProfile>(GUEST_PROFILE);
  
  // Guest Mode State
  const [isGuestMode, setIsGuestMode] = useState(() => sessionStorage.getItem('tigra_is_guest') === 'true');
  const [guestMessageCount, setGuestMessageCount] = useState(() => {
     return parseInt(localStorage.getItem('tigra_guest_count') || '0', 10);
  });
  const [loginScreenMessage, setLoginScreenMessage] = useState<string | null>(null);

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  
  // --- Refs ---
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInstanceRef = useRef<any>(null); // Holds the Gemini Chat object
  const recognitionRef = useRef<any>(null); // Holds Speech Recognition instance

  // --- Helpers ---
  const startNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Session',
      messages: [],
      createdAt: Date.now(),
    };
    // Add to top of list
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setAppState(AppState.IDLE);
    chatInstanceRef.current = null;
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // --- Effects ---

  // 1. Initial Data Load (Database Connection & Session Check)
  useEffect(() => {
    const initData = async () => {
       try {
           const currentEmail = storageService.getCurrentSessionUser();
           if (currentEmail) {
               const profile = await storageService.getUserData(currentEmail);
               if (profile) {
                   setUserProfile({ ...profile, isLoggedIn: true });
                   
                   // Load Async Data
                   const [history, prefs] = await Promise.all([
                       storageService.loadChatHistory(currentEmail),
                       storageService.loadPreferences(currentEmail)
                   ]);
                   
                   const cleanHistory = history.filter(s => s.messages.length > 0);
                   setSessions(cleanHistory);
                   setUserPreferences(prefs);
                   setUserProfile(prev => ({ ...prev, preferences: prefs }));
               }
           }
       } catch (e) {
           console.error("Initialization error", e);
       } finally {
           setIsAuthInitializing(false);
           // Initialize default session for UI
           startNewSession();
       }
    };

    initData();
  }, []);

  // 2. Loading Screen Logic
  useEffect(() => {
    // Only dismiss loading screen when both window is loaded AND auth/db is initialized
    if (!isAuthInitializing) {
        // Minimum branded delay
        const timer = setTimeout(() => {
           setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [isAuthInitializing]);

  // 3. Save History (Debounced or on change)
  useEffect(() => {
    if (userProfile.isLoggedIn && !isAuthInitializing) {
      const sessionsToSave = sessions.filter(s => s.messages.length > 0);
      storageService.saveChatHistory(userProfile.email, sessionsToSave);
    }
  }, [sessions, userProfile, isAuthInitializing]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, appState]);

  const getUserContext = (): UserContext => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  };

  // Auth Handler
  const handleUpdateProfile = async (profile: UserProfile | null) => {
      if (profile) {
          // Login
          setUserProfile({ ...profile, isLoggedIn: true });
          storageService.setCurrentSessionUser(profile.email);
          
          // Load data async
          const [history, prefs] = await Promise.all([
              storageService.loadChatHistory(profile.email),
              storageService.loadPreferences(profile.email)
          ]);
          
          setSessions(history.filter(s => s.messages.length > 0));
          setUserPreferences(prefs);
          setUserProfile(prev => ({ ...prev, preferences: prefs }));
          
          setIsSettingsOpen(false);
          setIsGuestMode(false); 
          setLoginScreenMessage(null);
          sessionStorage.removeItem('tigra_is_guest');
          startNewSession();
      } else {
          // Logout
          storageService.clearCurrentSession();
          setUserProfile(GUEST_PROFILE);
          setSessions([]);
          setMessages([]);
          setUserPreferences({});
          setIsGuestMode(false);
          sessionStorage.removeItem('tigra_is_guest');
          startNewSession();
      }
  };

  const handleGuestLogin = () => {
      if (guestMessageCount >= GUEST_LIMIT) {
          setLoginScreenMessage("You have reached the free guest limit. Please sign up to continue.");
          return;
      }
      setIsGuestMode(true);
      setLoginScreenMessage(null);
      sessionStorage.setItem('tigra_is_guest', 'true');
      startNewSession();
  };
  
  const handleUpdatePreferences = (prefs: UserPreferences) => {
      setUserPreferences(prefs);
      setUserProfile(prev => ({ ...prev, preferences: prefs }));
      
      if (userProfile.isLoggedIn) {
          storageService.savePreferences(userProfile.email, prefs);
      }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
       startNewSession();
    }
  };

  const clearAllHistory = () => {
      setSessions([]);
      setMessages([]);
      if (userProfile.isLoggedIn) {
          storageService.saveChatHistory(userProfile.email, []);
      }
      startNewSession();
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    chatInstanceRef.current = null;
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const updateCurrentSession = (updatedMessages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        let title = s.title;
        if (s.messages.length === 0 && updatedMessages.length > 0) {
          const firstMsg = updatedMessages.find(m => m.role === 'user');
          if (firstMsg) {
             title = firstMsg.content.slice(0, 30) + (firstMsg.content.length > 30 ? '...' : '');
          }
        }
        return { ...s, messages: updatedMessages, title };
      }
      return s;
    }));
  };

  const handleVoiceInput = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      setTimeout(() => {
          if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
              textareaRef.current.focus();
          }
      }, 50);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim() || appState !== AppState.IDLE) return;

    if (!userProfile.isLoggedIn) {
        if (guestMessageCount >= GUEST_LIMIT) {
            setIsGuestMode(false);
            sessionStorage.removeItem('tigra_is_guest');
            setLoginScreenMessage("You've reached the 5-message guest limit. Please sign in or create an account to continue using Tigra.");
            return;
        }
        const newCount = guestMessageCount + 1;
        setGuestMessageCount(newCount);
        localStorage.setItem('tigra_guest_count', newCount.toString());
    }

    const userText = input.trim();
    setInput('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    updateCurrentSession(updatedMessages);
    setAppState(AppState.GENERATING);

    try {
      const chat = await createChatSession(messages, getUserContext(), userProfile);
      chatInstanceRef.current = chat;

      const streamResult = await sendMessageStream(chat, userText);

      const botMsgId = (Date.now() + 1).toString();
      let botContent = '';
      
      for await (const chunk of streamResult) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          botContent += text;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last.id === botMsgId) {
              return [...prev.slice(0, -1), { ...last, content: botContent }];
            } else {
              return [...prev, { id: botMsgId, role: 'model', content: botContent, timestamp: Date.now() }];
            }
          });
        }
      }

      setMessages(currentMsgs => {
         updateCurrentSession(currentMsgs);
         return currentMsgs;
      });

    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: "I apologize, but I encountered an issue processing your request. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
      updateCurrentSession([...updatedMessages, errorMsg]);
    } finally {
      setAppState(AppState.IDLE);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // --- RENDER: LOADING SCREEN ---
  // Ensure we show loading until auth is checked
  if (isLoading || isAuthInitializing) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in">
         <div className="relative w-24 h-24 md:w-32 md:h-32 mb-8">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
            <TigraLogo animated={true} className="w-full h-full relative z-10" />
         </div>
         <div className="flex flex-col items-center gap-3">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">TIGRA AI</h1>
            <div className="flex items-center gap-1.5">
               <span className="text-xs font-mono text-cyan-500">INITIALIZING DATABASE</span>
               <span className="flex gap-1">
                 <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                 <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                 <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
               </span>
            </div>
         </div>
      </div>
    );
  }

  // --- RENDER: AUTH GATING ---
  if (!userProfile.isLoggedIn && !isGuestMode) {
     return (
       <div className="flex min-h-[100dvh] w-full bg-black items-center justify-center p-4 relative overflow-hidden font-sans">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]"></div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          </div>
          
          <div className="z-10 w-full max-w-md flex flex-col items-center">
             <div className="mb-10 flex flex-col items-center animate-fade-in-up">
                 <div className="w-20 h-20 md:w-24 md:h-24 mb-6 relative group">
                     <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse group-hover:bg-cyan-400/30 transition-colors duration-500"></div>
                     <TigraLogo animated={true} className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
                 </div>
                 <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-500 mb-2 tracking-tight">Tigra AI</h1>
                 <p className="text-zinc-500 text-center font-light tracking-wide text-sm md:text-base">Your sophisticated digital companion.</p>
             </div>
             
             <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl animate-fade-in-up ring-1 ring-white/5" style={{animationDelay: '0.1s'}}>
                 {loginScreenMessage && (
                     <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm text-center font-medium">
                         {loginScreenMessage}
                     </div>
                 )}
                 <AuthForms 
                    onLoginSuccess={handleUpdateProfile} 
                    onGuestLogin={handleGuestLogin}
                 />
             </div>
             
             <p className="mt-8 text-[10px] text-zinc-600 text-center max-w-xs leading-relaxed opacity-60">
                By continuing, you acknowledge that Tigra is an AI developed by TGO. 
                <br />
                Your data is stored securely in IndexedDB on your device.
             </p>
          </div>
       </div>
     );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-black text-zinc-100 font-sans selection:bg-cyan-500/30">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onClearHistory={clearAllHistory}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        userPreferences={userPreferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-30 w-72 h-full bg-black border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/40 to-transparent"></div>
                <TigraLogo className="w-5 h-5" />
             </div>
             <div>
               <h1 className="font-bold text-lg tracking-tight text-white leading-none mb-0.5">Tigra AI</h1>
               <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">TGO Group</p>
             </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500 hover:text-white transition-colors p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button 
            onClick={startNewSession}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-cyan-950/30 active:bg-white/5 text-zinc-200 rounded-xl transition-all border border-white/5 group hover:border-cyan-500/20 active:scale-[0.98]"
          >
            <div className="p-1 rounded-md bg-transparent group-hover:scale-110 transition-transform">
               <IconPlus className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400" />
            </div>
            <span className="font-medium text-sm group-hover:text-cyan-100">New Conversation</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          <div className="px-2 py-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Recent</div>
          {sessions.filter(s => s.messages.length > 0).map(session => (
            <div 
              key={session.id}
              onClick={() => loadSession(session)}
              className={`
                group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all border border-transparent
                ${currentSessionId === session.id 
                  ? 'bg-zinc-900 border-cyan-900/30 text-cyan-50' 
                  : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'}
              `}
            >
              <span className="text-sm truncate max-w-[180px] font-medium">{session.title}</span>
              <button 
                onClick={(e) => deleteSession(e, session.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-all"
              >
                <IconTrash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* User / Settings */}
        <div className="p-4 border-t border-white/5 bg-black space-y-2">
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5 group text-left active:scale-[0.98]"
           >
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                 <IconSettings className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-medium text-zinc-200 group-hover:text-cyan-50 transition-colors">Settings</span>
                 <span className="text-[10px] text-zinc-500">Preferences & Data</span>
              </div>
           </button>
           
           <div className="flex items-center gap-3 px-3 py-2 rounded-xl opacity-60 select-none">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs font-bold">
                 <span className="text-cyan-400">{userProfile.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex flex-col overflow-hidden">
                 <span className="text-sm font-medium text-zinc-200 truncate">{userProfile.name}</span>
                 <span className="text-[10px] text-zinc-500">{isGuestMode ? 'Guest Mode' : 'Free Tier'}</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative w-full h-full bg-[#050505]">
        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b border-white/5 flex items-center justify-between px-4 bg-black/80 backdrop-blur-xl z-10 sticky top-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 p-1">
            <IconMenu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-zinc-200 text-sm tracking-wide">TIGRA</span>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-fade-in-up" style={{animationDelay: '0.1s', animationFillMode: 'forwards'}}>
               
               {/* Center Logo & Name */}
               <div className="flex flex-col items-center justify-center mb-10">
                   <div className="w-32 h-32 md:w-40 md:h-40 mb-8 relative group">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-[50px] rounded-full group-hover:bg-cyan-400/30 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-blue-600/10 blur-[30px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700"></div>
                        <TigraLogo animated={true} className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] relative z-10 transition-transform duration-500 group-hover:scale-105" />
                   </div>
                   <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-400 mb-4 tracking-tight">
                       Tigra AI
                   </h1>
                   <p className="text-zinc-500 text-lg md:text-xl font-light max-w-lg text-center leading-relaxed px-4">
                       Highly sophisticated intelligence by <span className="text-cyan-600 font-normal">TGO</span>.
                   </p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-2xl px-4">
                  {[
                    "Analyze this code snippet",
                    "Help me plan my week",
                    "Explain black holes simply",
                    "I need some motivation"
                  ].map((suggestion, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setInput(suggestion); if(textareaRef.current) textareaRef.current.focus(); }}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all text-left group active:scale-[0.99]"
                    >
                      <span className="text-sm text-zinc-400 group-hover:text-cyan-100 transition-colors">{suggestion}</span>
                    </button>
                  ))}
               </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto pb-4">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {appState === AppState.GENERATING && (
                <div className="flex justify-start mb-6 animate-pulse px-4">
                   <div className="flex gap-4">
                     <div className="w-9 h-9 rounded-full bg-black border border-cyan-900/50 flex items-center justify-center">
                        <IconBot className="w-5 h-5 text-cyan-400" />
                     </div>
                     <div className="flex items-center gap-1.5 pt-2">
                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full typing-dot"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full typing-dot"></div>
                     </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-black/80 backdrop-blur-xl border-t border-white/5 sticky bottom-0 z-20">
          <div className="max-w-3xl mx-auto relative group">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message Tigra..."
              rows={1}
              className="w-full bg-[#0a0a0a] text-zinc-200 placeholder-zinc-600 rounded-2xl pl-5 pr-24 py-4 border border-white/10 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 outline-none resize-none overflow-hidden max-h-48 transition-all shadow-xl"
            />
            
             <button
              onClick={handleVoiceInput}
              className={`absolute right-14 bottom-3 p-2 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
              title="Speech to Text"
            >
              <IconMic className="w-4 h-4" />
            </button>

            <button
              onClick={handleSend}
              disabled={!input.trim() || appState !== AppState.IDLE}
              className="absolute right-3 bottom-3 p-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center"
            >
              <IconSend className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-3 hidden md:block">
             <p className="text-[10px] text-zinc-700">
               {isGuestMode 
                 ? `Guest Mode: ${guestMessageCount}/${GUEST_LIMIT} messages used. Sign up for unlimited access.`
                 : "Tigra AI by TGO. Accuracy is a priority, but errors may occur."}
             </p>
          </div>
        </div>

      </main>
    </div>
  );
}