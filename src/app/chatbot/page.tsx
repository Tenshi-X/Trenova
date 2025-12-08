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
              "flex gap-4 p-4 rounded-xl max-w-[80%]",
              msg.role === 'assistant' 
                ? "bg-white/5 border border-white/10 self-start mr-auto" 
                : "bg-neon/10 border border-neon/20 self-end ml-auto"
            )}
          >
            <div className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'assistant' ? "bg-neon text-black" : "bg-white/20 text-white"
            )}>
              {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className="space-y-1">
                <p className="text-xs text-gray-400 font-mono mb-1">
                    {msg.role === 'assistant' ? 'TRENOVA AI' : 'YOU'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                    {msg.content}
                </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 w-fit">
             <div className="w-8 h-8 rounded-full bg-neon text-black flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles size={18} />
             </div>
             <div className="flex items-center gap-1 h-8">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about market trends..."
          className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-white focus:outline-none focus:border-neon/50 focus:ring-1 focus:ring-neon/50 transition-all placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="absolute right-2 top-2 p-2 rounded-lg bg-neon text-black hover:bg-neon-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
