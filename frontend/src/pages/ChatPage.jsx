import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  ACTIVE:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  CLOSED:  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

function UnreadBadge({ count }) {
  if (!count) return null;
  return (
    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function ChatPage() {
  const { token, currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [orders, setOrders] = useState([]);
  const [newReq, setNewReq] = useState({ orderId: '', subject: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const clientRef = useRef(null);
  const subRef = useRef(null);
  const sessionSubRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeSessionRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const subscribeToSession = useCallback((client, sessionId) => {
    if (subRef.current) { subRef.current.unsubscribe(); subRef.current = null; }
    if (sessionSubRef.current) { sessionSubRef.current.unsubscribe(); sessionSubRef.current = null; }
    if (!sessionId || !client?.connected) return;
    subRef.current = client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
      const message = JSON.parse(msg.body);
      setMessages((prev) => prev.find((m) => m.id === message.id) ? prev : [...prev, message]);
      scrollToBottom();
    });
    sessionSubRef.current = client.subscribe(`/topic/chat/${sessionId}/session`, (msg) => {
      const updated = JSON.parse(msg.body);
      setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setActiveSession((prev) => prev?.id === updated.id ? { ...prev, ...updated } : prev);
    });
  }, [scrollToBottom]);

  const loadSessions = useCallback(async () => {
    try {
      const res = await axios.get('/api/chat/sessions', { headers });
      setSessions(res.data);
    } catch { /* ignore */ }
  }, [token]);

  const loadOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders', { headers });
      setOrders(res.data);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { loadSessions(); loadOrders(); }, [loadSessions, loadOrders]);

  useEffect(() => {
    if (!token) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        clientRef.current = client;
        setConnected(true);
        client.subscribe('/user/queue/chat-accepted', (msg) => {
          const session = JSON.parse(msg.body);
          setSessions((prev) => {
            const exists = prev.find((s) => s.id === session.id);
            return exists ? prev.map((s) => s.id === session.id ? session : s) : [session, ...prev];
          });
          setActiveSession((prev) => prev?.id === session.id ? session : prev);
        });
        client.subscribe('/user/queue/chat-closed', (msg) => {
          const session = JSON.parse(msg.body);
          setSessions((prev) => prev.map((s) => s.id === session.id ? session : s));
          setActiveSession((prev) => prev?.id === session.id ? session : prev);
        });
        if (activeSessionRef.current) subscribeToSession(client, activeSessionRef.current.id);
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); setConnected(false); };
  }, [token]);

  useEffect(() => {
    activeSessionRef.current = activeSession;
    if (connected && clientRef.current) subscribeToSession(clientRef.current, activeSession?.id);
  }, [activeSession?.id, connected, subscribeToSession]);

  async function openSession(session) {
    setActiveSession(session);
    setMessages([]);
    try {
      const res = await axios.get(`/api/chat/sessions/${session.id}/messages`, { headers });
      setMessages(res.data);
      scrollToBottom();
      await axios.post(`/api/chat/sessions/${session.id}/read`, {}, { headers });
      setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, unreadUser: 0 } : s));
    } catch { /* ignore */ }
  }

  async function sendText(e) {
    e.preventDefault();
    if (!text.trim() || !activeSession || activeSession.status !== 'ACTIVE') return;
    setSending(true);
    const payload = { messageType: 'TEXT', content: text };
    try {
      if (clientRef.current?.connected) {
        clientRef.current.publish({ destination: `/app/chat/${activeSession.id}/send`, body: JSON.stringify(payload) });
      } else {
        await axios.post(`/api/chat/sessions/${activeSession.id}/messages`, payload, { headers });
      }
      setText('');
    } catch { /* ignore */ } finally { setSending(false); }
  }

  async function sendImage(e) {
    const file = e.target.files?.[0];
    if (!file || !activeSession || activeSession.status !== 'ACTIVE') return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1];
      const payload = { messageType: 'IMAGE', content: base64, imageMimeType: file.type };
      try {
        if (clientRef.current?.connected) {
          clientRef.current.publish({ destination: `/app/chat/${activeSession.id}/send`, body: JSON.stringify(payload) });
        } else {
          await axios.post(`/api/chat/sessions/${activeSession.id}/messages`, payload, { headers });
        }
      } catch { /* ignore */ }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function createSession(e) {
    e.preventDefault();
    setCreating(true); setError('');
    try {
      const res = await axios.post('/api/chat/sessions', {
        refType: 'ORDER',
        refId: parseInt(newReq.orderId),
        subject: newReq.subject,
      }, { headers });
      setSessions((prev) => [res.data, ...prev]);
      setShowNewForm(false);
      setNewReq({ orderId: '', subject: '' });
      openSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chat request.');
    } finally { setCreating(false); }
  }

  const totalUnread = sessions.reduce((sum, s) => sum + (s.unreadUser || 0), 0);
  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>

        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-xs text-slate-400 dark:text-slate-500">{connected ? 'Connected' : 'Connecting…'}</span>
            </div>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">{totalUnread} unread</span>
            )}
          </div>

          <button type="button" onClick={() => setShowNewForm((v) => !v)}
            disabled={orders.length === 0}
            title={orders.length === 0 ? 'Submit an order first to start a chat' : ''}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors">
            {showNewForm ? '✕ Cancel' : '+ New Chat Request'}
          </button>

          {orders.length === 0 && !showNewForm && (
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 px-2">
              Submit an order first to start a chat with admin.
            </p>
          )}

          {showNewForm && (
            <form onSubmit={createSession} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow border border-slate-100 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Select Your Order</label>
                <select value={newReq.orderId} onChange={(e) => setNewReq((p) => ({ ...p, orderId: e.target.value }))} className={inputClass} required>
                  <option value="">— Choose an order —</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} · {o.serviceType} · {o.deviceDescription.slice(0, 25)}{o.deviceDescription.length > 25 ? '…' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subject</label>
                <input type="text" value={newReq.subject} onChange={(e) => setNewReq((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="What do you need help with?" className={inputClass} required />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={creating || !newReq.orderId}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition-colors">
                {creating ? 'Sending…' : 'Send Request'}
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-2">
            {sessions.length === 0 && (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">No chat sessions yet.</p>
            )}
            {sessions.map((s) => (
              <button key={s.id} type="button" onClick={() => openSession(s)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  activeSession?.id === s.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order #{s.refId}</span>
                  <div className="flex items-center gap-1.5">
                    <UnreadBadge count={s.unreadUser} />
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.subject}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow border border-slate-100 dark:border-slate-700 overflow-hidden">
          {!activeSession ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="text-center">
                <div className="text-5xl mb-3">💬</div>
                <p>Select a chat or create a new request.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{activeSession.subject}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Order #{activeSession.refId}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[activeSession.status]}`}>
                  {activeSession.status}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeSession.status === 'PENDING' && (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <div className="text-3xl mb-2">⏳</div>
                    <p className="text-sm">Waiting for admin to accept your chat request…</p>
                  </div>
                )}
                {activeSession.status === 'CLOSED' && (
                  <div className="text-center py-4">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full text-xs">Chat closed</span>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-sm'}`}>
                        {!isMe && <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderUsername}</p>}
                        {msg.messageType === 'IMAGE' ? (
                          <img src={`data:${msg.imageMimeType};base64,${msg.content}`} alt="shared" className="max-w-full rounded-lg max-h-64 object-contain" />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>{formatTime(msg.sentAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {activeSession.status === 'ACTIVE' && (
                <form onSubmit={sendText} className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={sendImage} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Send image">🖼️</button>
                  <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…"
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  <button type="submit" disabled={sending || !text.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-colors">Send</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
