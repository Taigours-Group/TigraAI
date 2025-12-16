import React, { useState } from 'react';

export const IconMenu: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);

export const IconSend: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
);

export const IconPlus: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

export const IconBot: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" fill="none" className={`${className} ? 'anim-active' : ''}`}>
        <defs>
          <linearGradient id="tigra_grad_main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" /> {/* cyan-400 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
          </linearGradient>
           <linearGradient id="tigra_grad_glow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" /> 
            <stop offset="100%" stopColor="#22d3ee" /> 
          </linearGradient>
        </defs>
        
        {/* Central Diamond/Core */}
        <path className="tigra-core" d="M100 20 L130 60 L100 110 L70 60 Z" fill="url(#tigra_grad_main)" />
        
        {/* Inner Wings/Calyx */}
        <path className="tigra-wing-inner" d="M100 110 L145 75 L160 50 L135 90 L100 130 L65 90 L40 50 L55 75 Z" fill="url(#tigra_grad_main)" opacity="0.9"/>
        
        {/* Outer Tech Wings */}
        <path className="tigra-outer-wing-r" d="M160 50 L190 40 L170 80 L140 100 Z" fill="url(#tigra_grad_main)" opacity="0.7" />
        <path className="tigra-outer-wing-l" d="M40 50 L10 40 L30 80 L60 100 Z" fill="url(#tigra_grad_main)" opacity="0.7" />
        
        {/* Bottom Base */}
        <path d="M100 130 L120 140 L100 150 L80 140 Z" fill="url(#tigra_grad_main)" />
        
        {/* Circuit Connections (Dots and Lines) */}
        <circle cx="10" cy="40" r="3" fill="#22d3ee" />
        <circle cx="190" cy="40" r="3" fill="#22d3ee" />
        <circle cx="100" cy="150" r="3" fill="#3b82f6" />
        
        <path d="M10 40 L30 50" stroke="#22d3ee" strokeWidth="1.5" />
        <path d="M190 40 L170 50" stroke="#22d3ee" strokeWidth="1.5" />
        
        <path d="M30 110 L60 130 L80 140" stroke="#3b82f6" strokeWidth="1" opacity="0.5" fill="none" />
        <path d="M170 110 L140 130 L120 140" stroke="#3b82f6" strokeWidth="1" opacity="0.5" fill="none" />
        <circle cx="30" cy="110" r="2" fill="#22d3ee" />
        <circle cx="170" cy="110" r="2" fill="#22d3ee" />
      </svg>
);

export const IconUser: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export const IconTrash: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

export const IconSparkles: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>
);

export const IconCopy: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);

export const IconCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);

export const IconSettings: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export const IconX: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export const IconDatabase: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
);

export const IconInfo: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

export const IconActivity: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

export const IconLogout: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

export const IconMic: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
);

export const TigraLogo: React.FC<{ className?: string; animated?: boolean }> = ({ className, animated }) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" fill="none" className={`${className} ${animated ? 'anim-active' : ''}`}>
        <defs>
          <linearGradient id="tigra_grad_main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" /> {/* cyan-400 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
          </linearGradient>
           <linearGradient id="tigra_grad_glow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" /> 
            <stop offset="100%" stopColor="#22d3ee" /> 
          </linearGradient>
        </defs>
        
        {/* Central Diamond/Core */}
        <path className="tigra-core" d="M100 20 L130 60 L100 110 L70 60 Z" fill="url(#tigra_grad_main)" />
        
        {/* Inner Wings/Calyx */}
        <path className="tigra-wing-inner" d="M100 110 L145 75 L160 50 L135 90 L100 130 L65 90 L40 50 L55 75 Z" fill="url(#tigra_grad_main)" opacity="0.9"/>
        
        {/* Outer Tech Wings */}
        <path className="tigra-outer-wing-r" d="M160 50 L190 40 L170 80 L140 100 Z" fill="url(#tigra_grad_main)" opacity="0.7" />
        <path className="tigra-outer-wing-l" d="M40 50 L10 40 L30 80 L60 100 Z" fill="url(#tigra_grad_main)" opacity="0.7" />
        
        {/* Bottom Base */}
        <path d="M100 130 L120 140 L100 150 L80 140 Z" fill="url(#tigra_grad_main)" />
        
        {/* Circuit Connections (Dots and Lines) */}
        <circle cx="10" cy="40" r="3" fill="#22d3ee" />
        <circle cx="190" cy="40" r="3" fill="#22d3ee" />
        <circle cx="100" cy="150" r="3" fill="#3b82f6" />
        
        <path d="M10 40 L30 50" stroke="#22d3ee" strokeWidth="1.5" />
        <path d="M190 40 L170 50" stroke="#22d3ee" strokeWidth="1.5" />
        
        <path d="M30 110 L60 130 L80 140" stroke="#3b82f6" strokeWidth="1" opacity="0.5" fill="none" />
        <path d="M170 110 L140 130 L120 140" stroke="#3b82f6" strokeWidth="1" opacity="0.5" fill="none" />
        <circle cx="30" cy="110" r="2" fill="#22d3ee" />
        <circle cx="170" cy="110" r="2" fill="#22d3ee" />
      </svg>
    );
