'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, MessageSquare, TrendingUp } from 'lucide-react';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, subject, message } = formData;
    const body = `Name: ${name}\n\nMessage:\n${message}`;
    window.location.href = `mailto:trenova151@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-neon selection:text-white pb-20">
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 mb-10">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
              <ArrowLeft size={20} />
            </div>
            <span className="font-semibold text-slate-600 group-hover:text-foreground transition-colors">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/app-logo.png" alt="Trenova Logo" className="w-8 h-8 rounded-lg shadow-md object-contain bg-white" />
            <span className="font-bold tracking-tight text-foreground">TRENOVA</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 max-w-2xl">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/10 text-neon-dark text-xs font-bold uppercase tracking-wider mb-6">
              <MessageSquare size={14} />
              We Value Your Input
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Help Us Improve Trenova
            </h1>
            <p className="text-slate-500 text-lg">
              Have a suggestion, found a bug, or just want to share your thoughts? Send us an email directly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-bold text-slate-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon transition-all"
                placeholder="Feature Request / Bug Report"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon transition-all resize-none"
                placeholder="Tell us what you think..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-neon text-white rounded-xl font-bold text-lg shadow-xl shadow-neon/30 hover:shadow-neon/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Send Feedback
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              This will open your default email client to send your feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
