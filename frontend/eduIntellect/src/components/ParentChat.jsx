import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Bot, CreditCard, ShieldCheck, ArrowRight, Building2, Lock, CheckCircle2 } from 'lucide-react';

export default function ParentChat() {
  const { studentId } = useParams();
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      type: 'text',
      text: `Hello! I am the EduIntellect AI Assistant for Excel Academy. I see you're here regarding ${studentId || 'your child'}'s account. How can I help you today?`
    }
  ]);

  // 1. Dynamically load the Interswitch WebPay QA (Sandbox) Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://qa.interswitchng.com/collections/public/javascripts/inline-checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isTyping]);

const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMsg = { id: Date.now(), sender: 'parent', type: 'text', text: input };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 1. Call your real FastAPI Backend
      const response = await fetch('http://127.0.0.1:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use a test phone number so the AI can look up Aisha in the DB!
        body: JSON.stringify({ phone_number: "+2348011111111", message: newUserMsg.text })
      });
      
      const data = await response.json();

      // 2. Format the AI's text response
      let aiResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'text',
        text: data.reply
      };
      
      setMessages((prev) => [...prev, aiResponse]);

      // 3. If the AI generated an Interswitch link, render the Payment Widget!
      if (data.payment_link) {
        // Extract the amount from the reply (if possible) or default to 50000 for the demo
        const amountMatch = data.reply.match(/₦([\d,]+)/);
        const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 50000;
        
        const paymentWidget = {
          id: Date.now() + 2,
          sender: 'bot',
          type: 'payment_card',
          payload: { amount: amount, feeType: 'Outstanding Balance' }
        };
        setMessages((prev) => [...prev, paymentWidget]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { id: Date.now()+1, sender: 'bot', type: 'text', text: "Sorry, the AI server is offline." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // 2. The Interswitch Inline Checkout Function
  const handlePaymentClick = (amount) => {
    if (!scriptLoaded || !window.webpayCheckout) {
      alert("Secure payment gateway is still loading. Please try again in a few seconds.");
      return;
    }

    // Interswitch expects the amount in kobo (multiply Naira by 100)
    const amountInKobo = amount * 100;
    const transactionReference = `REF-${Date.now()}`; 

    const paymentParams = {
      merchant_code: "MX12345", // REPLACE with your actual Interswitch Sandbox Merchant Code
      pay_item_id: "1010101",   // REPLACE with your actual Pay Item ID
      txn_ref: transactionReference,
      amount: amountInKobo,
      currency: 566, // 566 is the code for NGN (Naira)
      site_redirect_url: window.location.origin,
      mode: 'TEST', // Keeps it in sandbox mode for the Buildathon demo
      onComplete: function(response) {
        console.log("Interswitch Response:", response);
        
        // Handle successful payment simulation in the chat UI
        if(response.desc === "Approved by Financial Institution" || response.responseCode === "00" || response.amount) {
          setMessages((prev) => [...prev, {
            id: Date.now() + 2,
            sender: 'bot',
            type: 'success_card',
            text: "Payment Processed!",
            payload: { amount: amount, ref: transactionReference }
          }]);
        }
      }
    };

    // Trigger the Interswitch modal
    window.webpayCheckout(paymentParams);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* DESKTOP LEFT PANEL: Informational / Branding sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/3 lg:w-1/4 bg-[#0F172A] text-white p-8 flex-col justify-between shadow-xl z-10">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#00C48C] rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Excel Academy</h1>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4 leading-tight">Secure Payment Portal</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            You are chatting with the EduIntellect AI. You can securely check balances, download invoices, and pay tuition via Interswitch directly from this window.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Student ID</p>
            <p className="font-mono text-lg">{studentId || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Lock className="w-4 h-4" /> End-to-end encrypted
        </div>
      </div>

      {/* RIGHT PANEL: The Chat Interface (Full width on mobile) */}
      <div className="flex-1 flex flex-col h-screen relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50">
        
        {/* Mobile-only Header */}
        <div className="md:hidden bg-[#0F172A] px-4 py-3 flex items-center gap-3 shadow-md z-10">
          <div className="w-8 h-8 bg-[#00C48C] rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Excel Academy AI</h2>
            <p className="text-[#00C48C] text-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure Session
            </p>
          </div>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6 w-full">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'parent' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.sender === 'parent' && (
                  <div className="bg-[#0F172A] text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-[85%] md:max-w-[70%] text-sm md:text-base">
                    {msg.text}
                  </div>
                )}

                {msg.sender === 'bot' && (
                  <div className="max-w-[90%] md:max-w-[70%] space-y-2">
                    {msg.type === 'text' && (
                      <div className="bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm text-sm md:text-base">
                        {msg.text}
                      </div>
                    )}

                    {/* PAYMENT CARD WIDGET */}
                    {msg.type === 'payment_card' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-lg mt-2">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{msg.payload.feeType}</p>
                            <h3 className="text-3xl font-extrabold text-slate-800">₦{msg.payload.amount.toLocaleString()}</h3>
                          </div>
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <CreditCard className="w-6 h-6" />
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handlePaymentClick(msg.payload.amount)}
                          className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                          Pay Securely via Interswitch <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* SUCCESS CARD WIDGET */}
                    {msg.type === 'success_card' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm mt-2 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-3 text-white shadow-md">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Payment Successful!</h3>
                        <p className="text-sm text-slate-600 mb-3">₦{msg.payload.amount.toLocaleString()} has been credited.</p>
                        <div className="bg-white px-4 py-2 rounded-lg border border-emerald-100 text-xs font-mono text-slate-500">
                          Ref: {msg.payload.ref}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-200 shrink-0 z-10">
          <form onSubmit={handleSend} className="flex gap-3 max-w-3xl mx-auto w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-[#00C48C] focus:ring-2 focus:ring-[#00C48C] rounded-full px-6 py-3.5 text-sm md:text-base outline-none transition-all shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="w-14 h-14 bg-[#00C48C] hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-md"
            >
              <Send className="w-6 h-6 ml-1" />
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}