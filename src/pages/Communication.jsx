import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Send, Search, User, Clock, Check, CheckCheck, 
  AlertCircle, MessageSquare, Phone, MoreVertical, Paperclip 
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const Communication = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const { data: enrolledPatients } = useQuery('enrolled-patients', async () => {
    const res = await api.get('/patients/enrolled');
    return res.data.patients || [];
  });

  const { data: messages } = useQuery(
    ['chat-messages', selectedSession?.id],
    async () => {
      const res = await api.get(`/communication/messages/${selectedSession.id}`);
      return res.data;
    },
    { 
      enabled: !!selectedSession,
      refetchInterval: 5000 // Poll for new messages every 5s
    }
  );

  const startSessionMutation = useMutation(
    (patientId) => api.post('/communication/sessions', { patientId }),
    {
      onSuccess: (data) => {
        setSelectedSession({ id: data.session_id });
      }
    }
  );

  const sendMessageMutation = useMutation(
    (data) => api.post('/communication/messages', data),
    {
      onSuccess: () => {
        setMessageText('');
        queryClient.invalidateQueries(['chat-messages', selectedSession.id]);
      }
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessageMutation.mutate({
      sessionId: selectedSession.id,
      message: messageText
    });
  };

  const filteredPatients = enrolledPatients?.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.account_number.includes(searchQuery)
  );

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar - Patient List */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Messenger
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              className="input pl-10 h-10 text-sm" 
              placeholder="Search patients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPatients?.map(p => (
            <button
              key={p.id}
              onClick={() => startSessionMutation.mutate(p.id)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                selectedSession?.patientId === p.id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="bg-primary-100 text-primary-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                {p.first_name[0]}{p.last_name[0]}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-gray-500">ID: {p.account_number}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 text-primary-700 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                  {/* Find patient name from session patientId if available */}
                  P
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Communication Thread</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-gray-500">Active Session</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><Phone className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {messages?.map(msg => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] space-y-1`}>
                      {!isMe && <p className="text-[11px] text-gray-500 ml-1">{msg.sender_name}</p>}
                      <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                        isMe 
                          ? 'bg-primary-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                      }`}>
                        {msg.message}
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] text-gray-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (msg.is_read ? <CheckCheck className="w-3 h-3 text-primary-500" /> : <Check className="w-3 h-3" />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-3 bg-gray-50 p-2 pl-4 rounded-xl border border-gray-200">
                <button type="button" className="text-gray-400 hover:text-primary-600"><Paperclip className="w-5 h-5" /></button>
                <input 
                  type="text" 
                  className="bg-transparent flex-1 border-none focus:ring-0 text-sm placeholder:text-gray-400" 
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!messageText.trim() || sendMessageMutation.isLoading}
                  className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition shadow-lg shadow-primary-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/20">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select a thread or start a new conversation</h3>
            <p className="text-gray-500 max-w-sm">Choose an enrolled patient from the list on the left to start coordinating care.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
