import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, HelpCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const ChatBot: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchHistory();
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/chatbot/history');
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) setInput('');

    // Append user message optimistically
    const tempUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    setLoading(true);
    try {
      const res = await api.post('/chatbot/message', { message: text });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to send message', err);
      // Append an error message
      const errMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I couldn\'t process that message. Make sure the backend server is running.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Clear all chat history?')) {
      try {
        await api.delete('/chatbot/history');
        setMessages([]);
      } catch (err) {
        console.error('Failed to clear chat history', err);
      }
    }
  };

  // Predefined quick action prompts
  const quickActions = [
    { label: '🚀 Recommend Jobs', prompt: 'What recommended jobs do I have based on my resume?' },
    { label: '📝 Resume Tips', prompt: 'Give me tips to improve my resume for better job matching' },
    { label: '🔍 Skill Gap Analysis', prompt: 'What skills am I missing for my top matched job?' },
    { label: '🏢 Company Jobs', prompt: 'Find jobs at Google or Microsoft' },
    { label: '📚 Course Suggestions', prompt: 'Suggest courses to improve my skills for better job opportunities' },
    { label: '💼 Search Positions', prompt: 'Find React Developer or Python Engineer positions' },
    { label: '🎯 Interview Prep', prompt: 'How should I prepare for a technical interview?' },
    { label: '🗺️ Career Roadmap', prompt: 'What career roadmap should I follow as a software developer?' },
  ];


  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-tr from-brand-600 to-violet-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-brand-500/20 cursor-pointer focus:outline-none relative group border border-brand-400/20"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-dark-900 border border-dark-800 text-dark-100 text-xs px-3 py-1.5 rounded-lg shadow-xl transition-all whitespace-nowrap">
            Chat with Career AI 💬
          </span>
        )}
      </motion.button>

      {/* Expandable Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-20 right-0 w-[420px] h-[550px] max-w-[calc(100vw-2rem)] bg-dark-950/95 border border-dark-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden glass-panel-glow"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-brand-500/10">
                  🤖
                </div>
                <div>
                  <h4 className="text-sm font-bold text-dark-50 flex items-center gap-1">
                    Career Assistant
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </h4>
                  <p className="text-[10px] text-dark-400">Powered by Jobify Semantic Search</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    title="Clear history"
                    className="p-1.5 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-dark-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-dark-950/20">
              {loadingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-brand-400" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 bg-dark-800 border border-dark-700 rounded-xl flex items-center justify-center text-brand-400">
                    <HelpCircle size={24} />
                  </div>
                  <div className="space-y-1 max-w-[280px]">
                    <h5 className="text-sm font-bold text-dark-200">Ask Career Assistant</h5>
                    <p className="text-xs text-dark-400">
                      Query available jobs, extract your skill gaps, check matching courses, or get tips.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white rounded-tr-none'
                          : 'bg-dark-900 border border-dark-800 text-dark-100 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-dark-900 border border-dark-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Hints */}
            {messages.length === 0 && !loadingHistory && (
              <div className="px-5 py-2.5 border-t border-dark-800 bg-dark-950 flex flex-wrap gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(action.prompt)}
                    className="text-[10px] font-semibold bg-dark-900 hover:bg-dark-800 text-dark-200 border border-dark-800 rounded-full px-3 py-1.5 transition-all cursor-pointer"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-4 border-t border-dark-800 bg-dark-900/40 flex gap-2 items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask something... (e.g. 'resume tips')"
                className="flex-1 bg-dark-950 border border-dark-700 focus:border-brand-500 rounded-xl px-4 py-2 text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ChatBot;
