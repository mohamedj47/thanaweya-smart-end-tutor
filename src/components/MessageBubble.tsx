import React, { useState, useEffect, useRef } from 'react';
import { Message, Sender, Subject } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Search, Volume2, StopCircle, Check, Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis, AreaChart, Area, LineChart, Line } from 'recharts';
import { StoryboardPlayer } from './StoryboardPlayer';
import { speakTextSmart } from '../utils/tts';

interface MessageBubbleProps {
  message: Message;
  subject?: Subject;
  onTermClick?: (term: string) => void;
  onQuote?: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, subject, onTermClick, onQuote }) => {
  const isUser = message.sender === Sender.USER;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    currentAudioRef.current = null;
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  const handleSpeakFullMessage = async () => {
    if (isPlaying || isLoadingAudio) {
      stopAudio();
      return;
    }

    setIsLoadingAudio(true);
    try {
      const audio = await speakTextSmart(message.text, () => {
        setIsPlaying(false);
        currentAudioRef.current = null;
      });

      setIsLoadingAudio(false);

      if (audio) {
        currentAudioRef.current = audio;
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Speak message error:", err);
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-4 pop-in ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex w-full ${isUser ? 'flex-row' : 'flex-row-reverse'} gap-2`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isUser ? <User size={18}/> : <Bot size={20}/>}
        </div>
        <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} w-full max-w-[85%]`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm markdown-body text-lg leading-relaxed relative w-full ${isUser ? 'bg-indigo-600 text-white rounded-tl-none' : 'bg-white border border-slate-200 text-slate-900 rounded-tr-none'}`}>
            {message.attachment?.type === 'storyboard' && message.attachment.data && <StoryboardPlayer data={message.attachment.data} />}
            {!isUser && (
              <div className="flex gap-2 mb-2 pb-2 border-b border-slate-100 justify-end no-print">
                <button 
                  onClick={handleSpeakFullMessage} 
                  disabled={isLoadingAudio} 
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all active:scale-95 ${
                    isPlaying || isLoadingAudio 
                      ? 'bg-red-100 text-red-600 border border-red-200' 
                      : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
                  }`}
                >
                  {isLoadingAudio ? <Loader2 size={12} className="animate-spin"/> : isPlaying ? <StopCircle size={12}/> : <Volume2 size={12}/>}
                  {isLoadingAudio ? 'جاري التحميل' : isPlaying ? 'إيقاف' : 'استمع'}
                </button>
                <button 
                  onClick={handleCopy} 
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border transition-all active:scale-95 ${
                    isCopied ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {isCopied ? <Check size={12}/> : <Copy size={12}/>} {isCopied ? 'تم' : 'نسخ'}
                </button>
              </div>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
