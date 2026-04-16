'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatAssistant({ ideaId }: { ideaId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/ideas/${ideaId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I couldn\'t generate a response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-36 sm:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[60vh]">
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
            <span className="text-amber-400">🤖</span>
            <span className="text-sm font-semibold text-white">Research Assistant</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-500">Ask me anything about your research!</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {['What are the biggest risks?', 'How can I reduce startup costs?', 'Who are my main competitors?'].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-xs px-3 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-amber-400 hover:border-amber-500/30"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-amber-500 text-black rounded-br-md'
                    : 'bg-neutral-800 text-neutral-200 rounded-bl-md'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-neutral-800">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your research..."
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
              <Button type="submit" disabled={!input.trim() || loading} className="bg-amber-500 hover:bg-amber-600 text-black rounded-xl px-3">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
