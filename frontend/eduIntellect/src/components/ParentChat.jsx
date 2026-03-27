import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Bot, CreditCard, ShieldCheck, ArrowRight, Building2, Lock, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CustomModal from './CustomModal';

export default function ParentChat() {
  const { studentId } = useParams();
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [threadId] = useState(() => 'session_' + Math.random().toString(36).substring(2, 15));
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      type: 'text',
      text: `Hello! I am the EduIntellect AI Assistant. I see you're here regarding **${studentId || 'your child'}**'s account. How can I help you today?`
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add user message to UI
    const newUserMsg = { id: Date.now(), sender: 'parent', type: 'text', text: input };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    // 2. Create a placeholder for the AI response
    const aiMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: aiMsgId, sender: 'bot', type: 'text', text: '' }]);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newUserMsg.text,
          thread_id: threadId,
          phone_number: studentId,
          school_id: localStorage.getItem('school_id') || "mock-school-id"
        }),
      });

      // 1. ADD: Check if the initial connection failed
      if (!response.ok) throw new Error("Server error");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      // 2. IMPROVED LOOP: Explicitly exit when finished
      streamingLoop: while (true) {
        const { value, done } = await reader.read();
        if (done) break streamingLoop;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            
            // 3. THE CRITICAL FIX: Break the OUTER loop (streamingLoop) immediately
            if (dataStr === '[DONE]') {
              break streamingLoop; 
            }

            try {
              const data = JSON.parse(dataStr);
              
              if (data.type === 'text') {
                accumulatedText += data.content;
                setIsTyping(false);
                setMessages((prev) => prev.map(msg => 
                  msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg
                ));
              } 
              
              if (data.type === 'metadata' && data.payment_link) {
                const amountMatch = accumulatedText.match(/₦([\d,]+)/);
                const amountValue = amountMatch ? amountMatch[1] : "Amount";

                setMessages((prev) => [...prev, {
                  id: Date.now() + 500,
                  sender: 'bot',
                  type: 'payment_card',
                  payload: { 
                    amount: amountValue, 
                    feeType: 'School Fees Payment',
                    paymentUrl: data.payment_link 
                  }
                }]);
              }
            } catch (e) {
              // Ignore partial JSON chunks if they happen
            }
          }
        }
      }
    } catch (error) {
      // 4. LOG: Check your console to see exactly what triggered the lost connection
      console.error("Stream interrupted:", error);
      
      // Only show error if we haven't actually received a response yet
      // This prevents "ghost" errors at the end of successful chats
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.sender === 'bot' && lastMsg?.text?.length > 0) return prev;
        
        return [...prev, { 
          id: Date.now()+999, 
          sender: 'bot', 
          type: 'text', 
          text: "Connection lost. Please try again." 
        }];
      });
    } finally {
      setIsTyping(false);
    }
  };

 const handlePaymentClick = (url) => {
    if (url) {
      // Open the payment link in a new tab securely
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Payment Link Expired',
        message: 'This link is no longer valid. Please ask the AI to generate a new one.'
      });
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden relative">
      <CustomModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />

      {/* Sidebar - Same Branding */}
      <aside className="hidden md:flex md:w-1/3 lg:w-1/4 bg-[#0F172A] text-white p-8 flex-col justify-between shadow-xl z-10">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#00C48C] rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">EduIntellect</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-4 leading-tight">Secure Portal</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Check student balances and pay tuition securely via Interswitch.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Student ID</p>
            <p className="font-mono text-lg">{studentId || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm"><Lock className="w-4 h-4" /> Secure SSL</div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col h-screen relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50">
        <div className="md:hidden bg-[#0F172A] px-4 py-3 flex items-center gap-3 shadow-md z-10">
          <div className="w-8 h-8 bg-[#00C48C] rounded-full flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-white font-bold text-sm">AI Assistant</h2></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6 w-full">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'parent' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'parent' ? (
                  <div className="bg-[#0F172A] text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-[85%] text-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="max-w-[90%] md:max-w-[70%] space-y-2">
                    {msg.type === 'text' && (
                      <div className="bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm text-sm">
                        <div className="prose prose-slate prose-sm max-w-none">
                          <ReactMarkdown components={{
                            p: ({...props}) => <p className="m-0" {...props} />,
                            strong: ({...props}) => <strong className="font-bold text-slate-900" {...props} />,
                          }}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {msg.type === 'payment_card' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-lg mt-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase mb-1">{msg.payload.feeType}</p>
                            <h3 className="text-3xl font-extrabold text-slate-800">₦{msg.payload.amount}</h3>
                          </div>
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><CreditCard className="w-6 h-6" /></div>
                        </div>
                        <button onClick={() => handlePaymentClick(msg.payload.paymentUrl)} className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                          Complete Payment <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="p-4 md:p-6 bg-white border-t border-slate-200 z-10">
          <form onSubmit={handleSend} className="flex gap-3 max-w-3xl mx-auto w-full">
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your balance..."
              className="flex-1 bg-slate-100 focus:bg-white focus:ring-2 focus:ring-[#00C48C] rounded-full px-6 py-3.5 text-sm outline-none transition-all shadow-inner"
            />
            <button type="submit" disabled={isTyping || !input.trim()} className="w-14 h-14 bg-[#00C48C] hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center shadow-md">
              <Send className="w-6 h-6 ml-1" />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}