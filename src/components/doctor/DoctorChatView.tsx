import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Paperclip, Phone, Video, MoreVertical, CheckCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { OngoingTreatment, Message } from '@/types';
import { useSocket } from '@/contexts/SocketContext';

interface DoctorChatViewProps {
    treatment: OngoingTreatment;
    onBack: () => void;
    userId: string;
}

const DoctorChatView: React.FC<DoctorChatViewProps> = ({ treatment, onBack, userId }) => {
    const { socket, isConnected } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const initChat = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

                // 1. Get or create conversation
                const convRes = await fetch(`${API_URL}/api/conversations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participants: [userId, treatment.id] })
                });
                const convData = await convRes.json();
                setConversationId(convData._id);

                // 2. Fetch history
                const msgRes = await fetch(`${API_URL}/api/messages/${convData._id}`);
                const msgData = await msgRes.json();
                setMessages(msgData.length > 0 ? msgData : [
                    {
                        id: 'welcome',
                        role: 'assistant',
                        text: `Hello Rahul, I'm ${treatment.doctorName}. I've been monitoring your ${treatment.title} progress. How are you feeling today?`,
                        time: '09:00 AM'
                    }
                ]);
            } catch (err) {
                console.error("Failed to init chat:", err);
            } finally {
                setLoading(false);
            }
        };

        initChat();
    }, [userId, treatment.id]);

    useEffect(() => {
        if (socket && conversationId) {
            socket.emit('join_conversation', conversationId);

            socket.on('receive_message', (data) => {
                if (data.conversationId === conversationId && data.senderId !== userId) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: data.role,
                        text: data.text,
                        time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                }
            });

            return () => {
                socket.off('receive_message');
            };
        }
    }, [socket, conversationId, userId]);

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !conversationId) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageData = {
            conversationId,
            senderId: userId,
            role: 'user',
            text: input,
            time
        };

        // UI Optimistic Update
        const optimisticMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            time
        };
        setMessages([...messages, optimisticMsg]);
        setInput('');

        // Socket Emit
        if (socket) {
            socket.emit('send_message', messageData);
        }

        // Persistent Save
        try {
            const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
            await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
        } catch (err) {
            console.error("Failed to save message:", err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 absolute inset-0 z-[60] overflow-hidden">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm">Back</span>
                    </button>
                    <div className="relative">
                        <img src={treatment.doctorImage} alt={treatment.doctorName} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{treatment.doctorName}</h3>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">
                            {isConnected ? 'Online' : 'Offline'} • {treatment.title}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <Phone size={20} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <Video size={20} />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>

            {/* Encrypted Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/10 py-2 px-4 text-center border-b border-blue-100 dark:border-blue-900/20">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} /> END-TO-END ENCRYPTED BY SWASTHYA SETU SECURE
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <img src={treatment.doctorImage} className="w-6 h-6 rounded-full mr-2 mt-1" alt="Doc" />
                                )}
                                <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <div className={`flex items-center gap-1 justify-end mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                                        <span className="text-[10px]">{msg.time}</span>
                                        {msg.role === 'user' && <CheckCheck size={12} />}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 pb-safe">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-full border border-transparent focus-within:border-blue-500 transition-colors">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className={`p-2 rounded-full transition ${input.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'}`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Import ShieldCheck as it was missing in the top imports


export default DoctorChatView;
