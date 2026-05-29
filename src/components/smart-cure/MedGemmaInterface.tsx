import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './medgemma.css'; // Sourced exactly from JS_MedGemma App.css
import { UserProfile } from '@/types';
import { ChevronRight } from 'lucide-react';

interface MedGemmaInterfaceProps {
  user: UserProfile;
  onBack: () => void;
}

const ECGHeartbeat = () => (
  <svg width="60" height="40" viewBox="0 0 60 40" className="ecg-logo">
    <polyline
      fill="none"
      stroke="var(--neon)"
      strokeWidth="2"
      points="0,20 15,20 20,5 25,35 30,20 40,20 45,10 50,30 55,20 60,20"
      className="ecg-path"
    />
  </svg>
);
const TypingIndicator = () => (
  <div className="typing-container">
    <svg width="40" height="20" viewBox="0 0 40 20">
      <polyline
        fill="none"
        stroke="var(--neon)"
        strokeWidth="1.5"
        points="0,10 5,10 10,2 15,18 20,10 40,10"
        className="ecg-typing"
      />
    </svg>
    <span className="typing-label">Processing<span className="blinking-cursor">_</span></span>
  </div>
);

const UserAvatar = () => (
  <div className="avatar user-avatar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

const AIAvatar = () => (
  <div className="avatar ai-avatar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ai-logo-svg">
      <path d="M12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9z" className="ai-halo" />
      <path d="M12 22v-3" className="ai-stem" />
      <path d="M12 19c-2.5 0-4.5-2-4.5-4.5S12 8 12 8" className="ai-leaf-left" />
      <path d="M12 19c2.5 0 4.5-2 4.5-4.5S12 8 12 8" className="ai-leaf-right" />
      <circle cx="12" cy="11.5" r="1.5" fill="currentColor" stroke="none" className="ai-core" />
    </svg>
  </div>
);

const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
    <line x1="3" y1="12" x2="21" y2="12" className="scan-line" />
  </svg>
);

const SubmitIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="submit-icon">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="copy-icon">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const MicIcon = ({ isListening }: { isListening: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mic-icon ${isListening ? 'listening-icon' : ''}`}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

export default function MedGemmaInterface({ user, onBack }: MedGemmaInterfaceProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string, image?: string | null }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0); // reset file input after each upload
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setToast("Microphone error or not allowed.");
        setTimeout(() => setToast(null), 3000);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      setToast("Speech recognition is not supported in this browser.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollFab(scrollHeight - scrollTop > clientHeight + 200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setImage(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => {
        if(typeof reader.result === 'string') {
            setImageBase64(reader.result.split(',')[1]);
        }
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      setFileInputKey(prev => prev + 1); // reset input so same file can be re-selected
    }
  };

  const sendMessage = async () => {
    if (!input && !imageBase64) return;

    const userMsg = { role: 'user' as const, content: input, image };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImage(null);
    setLoading(true);

    try {
      // Connect to root backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const response = await fetch(`${API_URL}/medgemma/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, image: imageBase64 }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Server responded with an error.");
      }

      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${error.message || "Could not connect to the medical server."}` }]);
    } finally {
      setLoading(false);
      setImageBase64(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast("Copied ✓");
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="medgemma-theme w-full h-full">
      <div
        className="app-container font-mono"
        onDragOver={handleDragOver}
      >
      {isDragging && (
        <div className="drag-overlay" onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="pulse-rings">
            <div className="ring"></div>
            <div className="ring"></div>
            <div className="ring"></div>
          </div>
          <h2 className="drag-text">DROP SCAN TO ANALYZE</h2>
        </div>
      )}

      <header className="header block">
        <div className="logo-section w-full items-center flex">
          <button onClick={onBack} className="p-2 mr-4 bg-[#0a0f12] text-[#39ff14] hover:bg-[#39ff14]/10 rounded-lg transition-colors border-2 border-transparent">
             <ChevronRight className="w-6 h-6 transform rotate-180" />
          </button>
          <div className="flex items-center gap-6">
              <ECGHeartbeat />
              <h1 className="logo-text m-0">MEDGEMMA</h1>
          </div>
        </div>
      </header>

      <main className="chat-window" onScroll={handleScroll} ref={chatWindowRef as any}>
        {messages.length === 0 && (
          <div className="hero-section">
            <div className="hero-logo"><ECGHeartbeat /></div>
            <h2>How can I assist your health today?</h2>
            <div className="suggested-prompts">
              <button onClick={() => setInput("Routine checkup for cough")}>Chest Discomfort</button>
              <button onClick={() => setInput("Analyze my MRI scan")}>Scan Analysis</button>
              <button onClick={() => setInput("Common symptoms for fever")}>Symptom Guide</button>
            </div>
          </div>
        )}

        <div className="messages-container">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.role === 'user' ? 'user-wrapper' : 'ai-wrapper'}`}>
              {msg.role === 'ai' && <AIAvatar />}
              <div className={`message ${msg.role}-message`}>
                <span className="message-badge">{msg.role === 'ai' ? 'MEDGEMMA' : 'YOU'}</span>
                {msg.image && <img src={msg.image} alt="upload" className="image-preview" />}
                <div className="markdown-container">
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked.parse(msg.content || "") as string)
                    }}
                  />
                </div>
                {msg.role === 'ai' && (
                  <button className="copy-btn" onClick={() => copyToClipboard(msg.content)} title="Copy message">
                    <CopyIcon />
                  </button>
                )}
              </div>
              {msg.role === 'user' && <UserAvatar />}
            </div>
          ))}
          {loading && (
            <div className="message-wrapper ai-wrapper">
              <AIAvatar />
              <div className="message ai-message">
                <span className="message-badge">MEDGEMMA</span>
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {showScrollFab && (
          <button className="scroll-fab" onClick={scrollToBottom}>
            ↓
          </button>
        )}
      </main>

      <div className="input-area">
        {image && (
          <div className="image-attachment-preview">
            <div className="image-attachment-wrapper">
              <img src={image} alt="Attached scan" />
              <div className="scan-overlay-text">SCAN ATTACHED</div>
              <button className="remove-image-btn" onClick={() => { setImage(null); setImageBase64(null); }} title="Remove Scan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        )}
        <div className="input-wrapper">
          <input key={fileInputKey} type="file" id="fileInput" hidden onChange={handleImageChange} accept="image/*" />
          <button className="upload-btn" onClick={() => document.getElementById('fileInput')?.click()} title="Upload Scan / X-Ray">
            <ScanIcon />
            <span className="upload-label hidden sm:block">UPLOAD SCAN</span>
          </button>
          <textarea
            className="chat-input scrollbar-hide focus:ring-0"
            placeholder="Describe your symptoms or ask a medical question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          />
          <button
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListen}
            title={isListening ? "Stop listening" : "Use microphone"}
          >
            <MicIcon isListening={isListening} />
          </button>
          <button className="send-btn" onClick={sendMessage} disabled={loading}>
            <SubmitIcon />
            <span className="hidden sm:block">{loading ? 'SUBMITTING...' : 'SUBMIT'}</span>
          </button>
        </div>
      </div>

      {toast && <div className="toast fixed bottom-4 right-4 bg-[#39ff14] text-black px-4 py-2 rounded-md font-bold z-50">{toast}</div>}
      </div>
    </div>
  );
}
