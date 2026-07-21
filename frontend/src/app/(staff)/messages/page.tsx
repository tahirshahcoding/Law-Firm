'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch, API_BASE } from '@/lib/api';
import { MessageSquare, Send, CheckCheck, Check, Search, MoreVertical, CornerUpLeft, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

// Helper: get up to 2 uppercase initials from a name
const initials = (name: string) =>
  name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??';

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeClient, setActiveClient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/messages/conversations/`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : (data.results || []));
      setLoading(false);
    } catch {
      toast.error('Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchMessages = async (clientId: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/messages/?client_id=${clientId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : (data.results || []));
      await apiFetch(`${API_BASE}/messages/mark_read/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      });
      setConversations(prev =>
        prev.map(c => (c.client_id === clientId ? { ...c, unread_count: 0 } : c))
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
      if (activeClient) fetchMessages(activeClient.client_id);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeClient]);

  useEffect(() => {
    if (activeClient) fetchMessages(activeClient.client_id);
  }, [activeClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeClient) return;
    
    const messageContent = newMessage;
    const replyToId = replyingTo?.id || null;
    const replyDetails = replyingTo ? { id: replyingTo.id, content: replyingTo.content, sender_type: replyingTo.sender_type } : null;
    
    // OPTIMISTIC UI
    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      content: messageContent,
      sender_type: 'Staff',
      created_at: new Date().toISOString(),
      is_read: false,
      is_optimistic: true,
      reply_to_details: replyDetails
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setReplyingTo(null);
    
    try {
      const res = await apiFetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: activeClient.client_id, content: messageContent, reply_to: replyToId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.detail || res.statusText);
      }
      
      const finalMsg = await res.json();
      setMessages(prev => prev.map(m => m.id === tempId ? finalMsg : m));
      // fetchMessages(activeClient.client_id); // Optional, since we have optimistic UI
      fetchConversations(); // update latest message snippet in sidebar
    } catch (error: any) {
      toast.error('Failed to send: ' + error.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // Derived
  const filteredConversations = conversations.filter(c =>
    c.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedMessages: { date: string; msgs: any[] }[] = [];
  messages.forEach(msg => {
    const label = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === label) last.msgs.push(msg);
    else groupedMessages.push({ date: label, msgs: [msg] });
  });

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading conversations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-950">

      {/* ── Left Sidebar ── */}
      <div className="w-[320px] shrink-0 flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">

        <div className="px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Messages</h2>
            <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
              {conversations.reduce((s, c) => s + (c.unread_count || 0), 0) || conversations.length} active
            </span>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-3 p-8">
              <MessageSquare size={40} className="opacity-30" />
              <p className="text-sm font-medium text-center">
                {search ? 'No matching clients' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2 pb-2">
              {filteredConversations.map(conv => {
                const isActive = activeClient?.client_id === conv.client_id;
                return (
                  <button
                    key={conv.client_id}
                    onClick={() => setActiveClient(conv)}
                    className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-blue-600 shadow-md shadow-blue-600/20'
                        : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    }`}>
                      {initials(conv.client_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                          {conv.client_name}
                        </span>
                        {conv.unread_count > 0 && !isActive && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {conv.latest_message || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-w-0">
        {activeClient ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-blue-500/30">
                  {initials(activeClient.client_name)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white leading-tight">{activeClient.client_name}</h2>
                  <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Client conversation
                  </p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <MoreVertical size={17} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1 bg-gradient-to-b from-blue-50/30 via-white to-white dark:from-blue-950/10 dark:via-slate-950 dark:to-slate-950">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 dark:text-slate-500 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <MessageSquare size={32} className="opacity-40" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">No messages yet</p>
                    <p className="text-xs mt-1 opacity-70">Send the first message to start the conversation</p>
                  </div>
                </div>
              ) : (
                groupedMessages.map(({ date, msgs }) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 px-2">{date}</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="space-y-2">
                      {msgs.map((msg: any, i: number) => {
                        const isStaff = msg.sender_type === 'Staff';
                        const prevMsg = i > 0 ? msgs[i - 1] : null;
                        const isGrouped = prevMsg && prevMsg.sender_type === msg.sender_type;
                        return (
                          <div key={msg.id || i} className={`group flex items-end gap-2 ${isStaff ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
                            
                            {/* Reply button for client messages */}
                            {!isStaff && (
                              <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 mb-1">
                                <CornerUpLeft size={14} />
                              </button>
                            )}

                            {!isStaff && (
                              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br from-slate-400 to-slate-600 ${isGrouped ? 'invisible' : ''}`}>
                                {initials(activeClient.client_name)}
                              </div>
                            )}
                            <div className="max-w-[65%] flex flex-col">
                              <div className={`px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
                                isStaff
                                  ? `bg-blue-600 text-white ${isGrouped ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tr-sm'}`
                                  : `bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 ${isGrouped ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-tl-sm'}`
                              } ${msg.is_optimistic ? 'opacity-70' : ''}`}>
                                
                                {/* Quoted Reply Section */}
                                {msg.reply_to_details && (
                                  <div className={`mb-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border-l-4 ${
                                    isStaff 
                                      ? 'bg-blue-700/50 border-blue-300 text-blue-50' 
                                      : 'bg-slate-100 dark:bg-slate-700/50 border-slate-400 dark:border-slate-500 text-slate-600 dark:text-slate-300'
                                  }`}>
                                    <p className={`font-bold mb-0.5 ${isStaff ? 'text-blue-200' : 'text-slate-700 dark:text-slate-200'}`}>
                                      {msg.reply_to_details.sender_type === 'Staff' ? 'You' : activeClient.client_name}
                                    </p>
                                    <p className="line-clamp-2 truncate whitespace-normal leading-snug">{msg.reply_to_details.content}</p>
                                  </div>
                                )}

                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                
                                <div className="flex items-center gap-1 mt-1.5 justify-end">
                                  <span className={`text-[10px] font-medium ${isStaff ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {formatTime(msg.created_at)}
                                  </span>
                                  {isStaff && (
                                    msg.is_optimistic ? (
                                      <Clock size={11} className="text-blue-300/70" />
                                    ) : msg.is_read ? (
                                      <CheckCheck size={13} className="text-cyan-300" />
                                    ) : (
                                      <Check size={13} className="text-blue-300/70" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Reply button for staff messages */}
                            {isStaff && (
                              <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 mb-1">
                                <CornerUpLeft size={14} />
                              </button>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 relative">
              
              {/* Reply Preview */}
              {replyingTo && (
                <div className="absolute bottom-full left-0 right-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-2.5 flex items-center gap-3 animate-in slide-in-from-bottom-2">
                  <div className="w-1 h-full rounded-full bg-blue-500 self-stretch min-h-[36px]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                      {replyingTo.sender_type === 'Staff' ? 'You' : activeClient.client_name}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 truncate">{replyingTo.content}</p>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="px-6 py-4">
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    disabled={sending}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); } }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 disabled:opacity-40 transition-all shadow-lg shadow-blue-600/30 shrink-0"
                  >
                    {sending
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send size={17} className="-ml-0.5" />
                    }
                  </button>
                </form>
                <p className="text-[11px] text-slate-400 dark:text-slate-600 text-center mt-2.5">Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center">
              <MessageSquare size={40} className="text-blue-300 dark:text-blue-700" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700 dark:text-slate-300">Select a conversation</p>
              <p className="text-sm mt-1 text-slate-400">Choose a client from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
