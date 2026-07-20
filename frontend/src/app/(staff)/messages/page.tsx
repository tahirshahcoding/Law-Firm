'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch, API_BASE } from '@/lib/api';
import { MessageSquare, User, Send, CheckCheck, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeClient, setActiveClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/messages/conversations/`);
      const data = await res.json();
      const results = Array.isArray(data) ? data : (data.results || []);
      setConversations(results);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchMessages = async (clientId: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/messages/?client_id=${clientId}`);
      const data = await res.json();
      const results = Array.isArray(data) ? data : (data.results || []);
      setMessages(results);
      // Mark as read
      await apiFetch(`${API_BASE}/messages/mark_read/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId })
      });
      
      // Update local unread count
      setConversations(prev => prev.map(c => 
        c.client_id === clientId ? { ...c, unread_count: 0 } : c
      ));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (activeClient) {
        fetchMessages(activeClient.client_id);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeClient]);

  useEffect(() => {
    if (activeClient) {
      fetchMessages(activeClient.client_id);
    }
  }, [activeClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeClient) return;

    setSending(true);
    try {
      const res = await apiFetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: activeClient.client_id,
          content: newMessage
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || JSON.stringify(errorData) || res.statusText);
      }
      setNewMessage('');
      fetchMessages(activeClient.client_id);
      fetchConversations();
    } catch (error: any) {
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Sidebar - Client List */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No active conversations.</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.client_id}
                onClick={() => setActiveClient(conv)}
                className={`w-full p-4 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                  activeClient?.client_id === conv.client_id ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User size={20} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{conv.client_name}</h3>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{conv.latest_message}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative">
        {activeClient ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white z-10 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{activeClient.client_name}</h2>
                <p className="text-xs text-slate-500">Client Portal Conversation</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {messages.map((msg, i) => {
                const isStaff = msg.sender_type === 'Staff';
                return (
                  <div key={msg.id || i} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      isStaff 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isStaff ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isStaff && (msg.is_read ? <CheckCheck size={14} className="text-cyan-300" /> : <Check size={14} className="text-blue-300/80" />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to the client..."
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {sending ? 'Sending...' : <><Send size={16} /> Send</>}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={64} className="opacity-20 mb-4" />
            <p className="font-medium">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
