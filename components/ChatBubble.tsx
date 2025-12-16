import React, { useState } from 'react';
import { Message } from '../types';
import { IconBot, IconUser, IconCopy, IconCheck } from './Icons';

interface ChatBubbleProps {
  message: Message;
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-lg group/code">
      <div className="flex items-center justify-between px-4 py-2 bg-[#151515] border-b border-white/5">
        <span className="text-xs font-mono text-zinc-400 lowercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-cyan-400 transition-colors"
        >
          {copied ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <code className="text-sm font-mono text-zinc-300 whitespace-pre font-light">
          {code}
        </code>
      </div>
    </div>
  );
};

// Component to handle Bold and Italic formatting
const FormatText: React.FC<{ text: string }> = ({ text }) => {
  // Split by bold (**text**)
  const boldParts = text.split(/\*\*(.*?)\*\*/g);

  return (
    <>
      {boldParts.map((part, i) => {
        // Odd indices are bold (captured groups)
        if (i % 2 === 1) {
          return <strong key={i} className="font-bold text-white">{part}</strong>;
        }

        // For non-bold parts, check for italics (*text*)
        const italicParts = part.split(/\*(?!\s)([^*]+)\*/g);
        
        return (
          <span key={i}>
            {italicParts.map((subPart, j) => {
              // Odd indices are italic
              if (j % 2 === 1) {
                return <em key={j} className="italic text-zinc-300">{subPart}</em>;
              }
              return subPart;
            })}
          </span>
        );
      })}
    </>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isModel = message.role === 'model';

  // Helper to parse content for code blocks and formatting
  const renderContent = (content: string) => {
    // Split by code blocks
    const parts = content.split(/```(\w+)?\n([\s\S]*?)```/g);
    
    // If no code blocks, return formatted text directly
    if (parts.length === 1) {
      return (
        <div className="whitespace-pre-wrap leading-7">
           <FormatText text={content} />
        </div>
      );
    }

    const elements: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Text part
        if (parts[i].trim()) {
           elements.push(
             <div key={i} className="whitespace-pre-wrap mb-3 last:mb-0 leading-7">
               <FormatText text={parts[i]} />
             </div>
           );
        }
      } else if (i % 3 === 1) {
        // Language part (skip, used in next iteration)
      } else {
        // Code part
        const language = parts[i - 1] || 'text';
        const code = parts[i];
        elements.push(<CodeBlock key={i} language={language} code={code.trim()} />);
      }
    }
    return elements;
  };

  return (
    <div className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'} mb-6 group animate-fade-in`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-4 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border shadow-sm ${
          isModel 
            ? 'bg-[#0a0a0a] border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
        }`}>
          {isModel ? <IconBot className="w-5 h-5" /> : <IconUser className="w-5 h-5" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col min-w-0 ${isModel ? 'items-start' : 'items-end'} w-full`}>
            <div className={`flex items-baseline gap-2 mb-1.5 px-1 ${isModel ? '' : 'flex-row-reverse'}`}>
                <span className={`text-[11px] font-bold tracking-wider ${isModel ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500' : 'text-zinc-500'}`}>
                    {isModel ? 'TIGRA' : 'YOU'}
                </span>
            </div>
            
            <div className={`relative px-5 py-3.5 rounded-2xl text-[15px] shadow-sm transition-colors w-full ${
              isModel 
                ? 'bg-transparent text-zinc-100 border border-transparent pl-0 pt-0' 
                : 'bg-[#121212] text-zinc-100 border border-zinc-800 rounded-tr-none'
            }`}>
              {renderContent(message.content)}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ChatBubble;