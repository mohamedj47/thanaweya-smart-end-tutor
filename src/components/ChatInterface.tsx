import React, { useState, useRef, useEffect } from 'react';
import { GradeLevel, Subject, Message, Sender, Attachment } from '../types';
import { sendToGemini, generateEducationalVideo } from '../services/geminiService';
import { MessageBubble } from './MessageBubble';
import { LiveVoiceModal } from './LiveVoiceModal';
import { Send, ChevronRight, HelpCircle, FileText, Lightbulb, Bot, List, Printer, Mic, Camera, Paperclip, X, AudioLines, StopCircle, Sparkles, Video, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  grade: GradeLevel;
  subject: Subject;
  onBack: () => void;
}

const SUGGESTIONS = [
  { label: 'شرح درس', icon: <List size={14} />, prompt: 'اعرض لي قائمة بعناوين وحدات ودروس المنهج لأختار منها.' },
  { label: 'أسئلة', icon: <HelpCircle size={14} />, prompt: 'أعطني أسئلة تدريبية عن الدرس الأخير.' },
  { label: 'تلخيص', icon: <FileText size={14} />, prompt: 'لخص لي هذا المفهوم في نقاط بسيطة.' },
  { label: 'توقعات', icon: <Lightbulb size={14} />, prompt: 'ما هي أهم التوقعات والأسئلة الشائعة في هذا الجزء؟' },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ grade, subject, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `أهلاً بك يا بطل في مادة **${subject}**! 🚀\n\nأنا جاهز لمساعدتك. اسألني أي سؤال أو صور المسألة وسأشرحها لك فوراً.`,
      sender: Sender.BOT,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, attachment, isLoading, isVideoGenerating]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        setAttachment({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            mimeType: file.type,
            data: (e.target?.result as string).split(',')[1],
            name: file.name
        });
    };
    reader.readAsDataURL(file);
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks: Blob[] = [];
            
            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const reader = new FileReader();
                reader.readAsDataURL(new Blob(audioChunks, { type: 'audio/mp3' }));
                reader.onloadend = () => {
                     setAttachment({ type: 'audio', mimeType: 'audio/mp3', data: (reader.result as string).split(',')[1], name: 'تسجيل صوتي' });
                     stream.getTracks().forEach(t => t.stop());
                };
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) { alert("تأكد من صلاحيات الميكروفون."); }
    }
  };

  const handleVideoGenerate = async () => {
    if (!inputValue.trim()) {
        alert("اكتب وصفاً للفيديو أولاً في مربع الكتابة (مثلاً: فيديو يشرح التفاعل الكيميائي) ثم اضغط على زر الفيديو.");
        return;
    }

    const promptText = inputValue;
    const userMessage: Message = {
        id: Date.now().toString(),
        text: `🎥 أريد فيديو توضيحي عن: ${promptText}`,
        sender: Sender.USER,
        timestamp: new Date()
    };
    setMessages(p => [...p, userMessage]);
    setInputValue('');
    setIsVideoGenerating(true);

    try {
        const storyboardJson = await generateEducationalVideo(promptText);
        setMessages(p => [...p, {
            id: Date.now().toString(),
            text: "تم تجهيز الفيديو التعليمي! 🎬\nاضغط على زر التشغيل في الأسفل لتبدأ العرض.",
            sender: Sender.BOT,
            timestamp: new Date(),
            attachment: {
                type: 'storyboard',
                mimeType: 'application/json',
                data: storyboardJson,
                name: 'Educational Storyboard'
            }
        }]);
    } catch (error) {
        console.error(error);
        setMessages(p => [...p, {
            id: Date.now().toString(),
            text: "عذراً، حدث خطأ أثناء إعداد الفيديو. حاول مرة أخرى بموضوع أبسط.",
            sender: Sender.BOT,
            timestamp: new Date()
        }]);
    } finally {
        setIsVideoGenerating(false);
    }
  };

  const handleSend = async (text: string = inputValue) => {
    if ((!text.trim() && !attachment) || isLoading || isVideoGenerating) return;
    
    let finalText = text || (attachment?.type === 'image' ? "اشرح هذه الصورة" : "اشرح الملف");
    const userMessage: Message = {
      id: Date.now().toString(), text: finalText, sender: Sender.USER, timestamp: new Date(),
      attachment: attachment ? { ...attachment } : undefined
    };

    setMessages(p => [...p, userMessage]);
    setInputValue(''); setAttachment(null); setIsLoading(true);

    try {
      const response = await sendToGemini([...messages, userMessage], grade, subject, userMessage.attachment);
      setMessages(p => [...p, { id: Date.now().toString(), text: response, sender: Sender.BOT, timestamp: new Date() }]);
    } catch {
      setMessages(p => [...p, { id: Date.now().toString(), text: "خطأ في الاتصال.", sender: Sender.BOT, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] chat-container relative">
      <LiveVoiceModal isOpen={isLiveMode} onClose={() => setIsLiveMode(false)} grade={grade} subject={subject} />
      <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" accept="image/*,application/pdf" />
      <input type="file" ref={cameraInputRef} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" accept="image/*" capture="environment" />

      {/* Header */}
      <header className="glass px-4 py-3 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors"><ChevronRight size={22} /></button>
          <div>
             <h1 className="font-bold text-slate-800">{subject}</h1>
             <p className="text-[10px] text-slate-500 font-bold">{grade}</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-indigo-600"><Printer size={20} /></button>
            <div className="bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1">
               <Sparkles size={14} className="text-indigo-600" />
               <span className="text-xs font-bold text-indigo-700">متصل</span>
            </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id}>
             {msg.attachment && msg.attachment.type !== 'video' && msg.attachment.type !== 'storyboard' && <div className="flex justify-end mb-1"><span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">📎 {msg.attachment.name || 'مرفق'}</span></div>}
             <MessageBubble message={msg} subject={subject} onQuote={(t) => setInputValue(`اشرح: ${t}`)} />
          </div>
        ))}
        {isLoading && <div className="flex gap-2 items-center text-indigo-500 animate-pulse px-4"><Bot size={18} /><span className="text-xs font-bold">يكتب الآن...</span></div>}
        {isVideoGenerating && (
            <div className="flex gap-3 items-center bg-amber-50 border border-amber-200 p-4 rounded-xl mx-4 animate-pulse">
                <Loader2 size={24} className="text-amber-600 animate-spin" />
                <div>
                   <span className="block text-sm font-bold text-amber-800">جاري إعداد الفيديو التعليمي (مجاني)...</span>
                   <span className="text-xs text-amber-600">يتم تأليف السيناريو والمشاهد الآن.</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {!isLoading && !isVideoGenerating && messages.length < 3 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide no-print">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => handleSend(s.prompt)} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-400 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-sm whitespace-nowrap">
              <span className="text-indigo-500">{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 input-area">
        {attachment && (
            <div className="flex justify-between bg-slate-50 p-2 rounded-lg mb-2 border border-slate-200">
                <span className="text-xs truncate">{attachment.name}</span>
                <button onClick={() => setAttachment(null)}><X size={14} /></button>
            </div>
        )}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-2 flex items-end shadow-inner focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <div className="flex gap-1 pb-1 px-1">
             <button onClick={() => setIsLiveMode(true)} className="p-2 rounded-full bg-indigo-100 text-indigo-600" title="محادثة صوتية حية"><AudioLines size={18} /></button>
             <button onClick={() => cameraInputRef.current?.click()} className="p-2 rounded-full hover:bg-slate-200 text-slate-500"><Camera size={18} /></button>
             <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-slate-200 text-slate-500"><Paperclip size={18} /></button>
             <button 
                onClick={handleVideoGenerate} 
                className="p-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 shadow-md transition-all hover:scale-105" 
                title="فيديو تعليمي (مجاني)"
             >
                <Video size={18} />
             </button>
          </div>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={isRecording ? "جاري التسجيل..." : "اكتب سؤالك أو صف الفيديو الذي تريده..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none h-[44px] py-2.5 px-2 text-sm max-h-32"
          />
          <div className="flex gap-1 pb-1">
             <button onClick={handleRecordToggle} className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-slate-200 text-slate-500'}`}>
                {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
             </button>
             <button onClick={() => handleSend()} disabled={!inputValue.trim() && !attachment} className={`p-2 rounded-full transition-all ${inputValue.trim() || attachment ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'}`}>
                <Send size={20} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};