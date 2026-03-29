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

function ChatPage() {
  const { token, currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newReq, setNewReq] = useState({ refType: 'ORDER', refId: '', subject: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const clientRef = useRef(null);
  const subRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  // Keep a ref to activeSession so callbacks always see the latest value
  const activeSessionRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const subscribeToSession = useCallback((client, sessionId) => {
    if (subRef.current) {
      subRef.current.unsubscribe();
      subRef.current = null;
    }
    if (!sessionId || !client?.connected) return;
    subRef.current = client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
      const message = JSON.parse(msg.body);
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    });
  }, [scrollToBottom]);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const res = await axios.get('/api/chat/sessions', { headers });
      setSessions(res.data);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Connect WebSocket once
  useEffect(() => {
    if (!token) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        clientRef.current = client;
        setConnected(true);

        // Notifications: chat accepted / closed
        client.subscribe('/user/queue/chat-accepted', (msg) => {
          const session = JSON.parse(msg.body);
          setSessions((prev) => prev.map((s) => s.id === session.id ? session : s));
          setActiveSession((prev) => {
            if (prev?.id === session.id) return session;
            return prev;
          });
        });
        client.subscribe('/user/queue/chat-closed', (msg) => {
          const session = JSON.parse(msg.body);
          setSessions((prev) => prev.map((s) => s.id === session.id ? session : s));
          setActiveSession((prev) => {
            if (prev?.id === session.id) return session;
            return prev;
          });
        });

        // If a session was already selected before connection was ready, subscribe now
        if (activeSessionRef.current) {
          subscribeToSession(client, activeSessionRef.current.id);
        }
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [token]);

  // Re-subscribe whenever activeSession changes OR connection becomes ready
  useEffect(() => {
    activeSessionRef.current = activeSession;
    if (connected && clientRef.current) {
      subscribeToSession(clientRef.current, activeSession?.id);
    }
  }, [activeSession?.id, connected, subscribeToSession]);

  async function openSession(session) {
    setActiveSession(session);
    setMessages([]);
    try {
      const res = await axios.get(`/api/chat/sessions/${session.id}/messages`, { headers });
      setMessages(res.data);
      scrollToBottom();
    } catch { /* ignore */ }
  }

  async function sendText(e) {
    e.preventDefault();
    if (!text.trim() || !activeSession || activeSession.status !== 'ACTIVE') return;
    setSending(true);
    const payload = { messageType: 'TEXT', content: text };
    try {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: `/app/chat/${activeSession.id}/send`,
          body: JSON.stringify(payload),
        });
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
          clientRef.current.publish({
            destination: `/app/chat/${activeSession.id}/send`,
            body: JSON.stringify(payload),
          });
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
        refType: newReq.refType,
        refId: parseInt(newReq.refId) || 0,
        subject: newReq.subject,
      }, { headers });
      setSessions((prev) => [res.data, ...prev]);
      setShowNewForm(false);
      setNewReq({ refType: 'ORDER', refId: '', subject: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chat request.');
    } finally { setCreating(false); }
  }

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>

        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-2 px-1">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-400 dark:text-slate-500">{connected ? 'Connected' : 'Connecting…'}</span>
          </div>

          <button type="button" onClick={() => setShowNewForm((v) => !v)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
            {showNewForm ? '✕ Cancel' : '+ New Chat Request'}
          </button>

          {showNewForm && (
            <form onSubmit={createSession} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow border border-slate-100 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                <select value={newReq.refType} onChange={(e) => setNewReq((p) => ({ ...p, refType: e.target.value }))} className={inputClass}>
                  <option value="ORDER">Order</option>
                  <option value="ENQUIRY">Enquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Reference ID</label>
                <input type="number" value={newReq.refId} onChange={(e) => setNewReq((p) => ({ ...p, refId: e.target.value }))}
                  placeholder="Order/Enquiry ID" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subject</label>
                <input type="text" value={newReq.subject} onChange={(e) => setNewReq((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="What do you need help with?" className={inputClass} />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={creating}
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
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{s.refType} #{s.refId}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[s.status]}`}>{s.status}</span>
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
                <p>Select a chat session or create a new request.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{activeSession.subject}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{activeSession.refType} #{activeSession.refId}</p>
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
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-sm'
                      }`}>
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
                    className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Send image">
                    🖼️
                  </button>
                  <input type="text" value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  <button type="submit" disabled={sending || !text.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-colors">
                    Send
                  </button>
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
