import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import { generateTriageResponse } from '@/api/geminiService';
import { Message, UserProfile } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatbotPageProps {
    user: UserProfile;
}

const ChatbotPage: React.FC<ChatbotPageProps> = ({ user }) => {
    const { language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            text: "Namaste! I am VedaX-AI, your AI healthcare assistant. How can I help you today?",
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const history = [...messages, userMsg];
            const response = await generateTriageResponse(history, user, language);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: (response as any).text,
                options: (response as any).options
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: "I'm having trouble connecting right now. Please try again later."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 m-4 overflow-hidden">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                    <Bot className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 dark:text-white">VedaX-AI</h2>
                    <p className="text-xs text-green-600 font-medium">Online • Powered by Gemini</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                            }`}>
                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                {msg.role === 'assistant' ? <Bot size={14} /> : <UserIcon size={14} />}
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {msg.role === 'assistant' ? 'AI Assistant' : 'You'}
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                            {msg.options && msg.options.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {msg.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(opt)}
                                            className="text-xs bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors border border-blue-200 dark:border-slate-600"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border border-transparent focus-within:border-blue-500 transition-colors">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                            placeholder="Ask me anything about your health..."
                            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500 px-2"
                        />
                        <button
                            onClick={() => handleSend(input)}
                            disabled={!input.trim() || isTyping}
                            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-400">AI can make mistakes. For severe symptoms, always consult a doctor immediately.</p>
                </div>
            </div>
        </div>
    );
};

export default ChatbotPage;
