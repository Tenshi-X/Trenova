'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { askChatbot } from '@/lib/api';
import clsx from 'clsx';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function ChatbotPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am Trenova AI. Ask me about current market trends, specific token analysis, or trading signals.',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Call Edge Function
    const response = await askChatbot(input);
    
    let botContent = '';
    
    if (response) {
       // Format the JSON response into a readable message
       const uptrend = response.uptrend?.length ? `📈 **Uptrend**: ${response.uptrend.join(', ')}` : '';
       const downtrend = response.downtrend?.length ? `📉 **Downtrend**: ${response.downtrend.join(', ')}` : '';
       const analysis = response.analysis ? `\n💡 **Analysis**: ${response.analysis}` : '';
       
       botContent = [uptrend, downtrend, analysis].filter(Boolean).join('\n');
    } else {
       botContent = "I'm sorry, I couldn't invoke the analysis engine at this moment.";
    }

    const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botContent,
        timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-4 p-5 rounded-2xl max-w-[85%] shadow-sm",
              msg.role === 'assistant' 
                ? "bg-white border border-slate-100 self-start mr-auto text-slate-800" 
                : "bg-neon-dark self-end ml-auto text-white shadow-md"
            )}
          >
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
              msg.role === 'assistant' 
                ? "bg-neon-light text-neon-dark border-neon/10" 
                : "bg-white/10 text-white border-white/10"
            )} style={{alignSelf: 'start'}}>
              {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
                <p className={clsx("text-xs font-bold tracking-wide mb-1 uppercase opacity-70", msg.role === 'assistant' ? "text-slate-500" : "text-emerald-100")}>
                    {msg.role === 'assistant' ? 'Trenova AI' : 'You'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className={clsx("text-sm leading-7 whitespace-pre-wrap break-words", msg.role === 'assistant' ? "text-slate-700" : "text-emerald-50")}>
                    {msg.content}
                </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-100 w-fit shadow-sm">
             <div className="w-10 h-10 rounded-full bg-neon-light text-neon-dark border border-neon/10 flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles size={20} />
             </div>
             <div className="flex items-center gap-1.5 h-10">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 relative z-10">
        <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about market trends, signals, or predictions..."
              className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-6 pr-16 text-foreground shadow-lg focus:outline-none focus:border-neon focus:ring-4 focus:ring-neon-light/20 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-3 top-3 p-2.5 rounded-xl bg-neon text-white hover:bg-neon-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
            >
              <Send size={20} />
            </button>
        </div>
      </form>
    </div>
  );
}
