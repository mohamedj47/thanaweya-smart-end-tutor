
import React, { useState, useEffect, useRef } from 'react';
import { Message, Sender, Subject } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Bot, User, Copy, Search, Volume2, StopCircle, Check 
} from 'lucide-react';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

import { StoryboardPlayer } from './StoryboardPlayer';
import { speakTextSmart } from '../utils/tts';
import { unlockAudio } from '../utils/unlockAudio';

interface MessageBubbleProps {
  message: Message;
  subject?: Subject;
  onTermClick?: (term: string) => void;
  onQuote?: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, subject, onTermClick, onQuote }) => {
  const isUser = message.sender === Sender.USER;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const currentAudioRef = useRef<HTMLAudioElement | SpeechSynthesisUtterance | undefined>(undefined);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (currentAudioRef.current instanceof HTMLAudioElement) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    currentAudioRef.current = undefined;
  };

  const handleSpeakFullMessage = async () => {
    unlockAudio();
    if (isPlaying) {
      stopAudio();
      return;
    }

    const text = message.text
      .replace(/```[\s\S]*?```/g, ' . رسم بياني . ')
      .replace(/[*#`_]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    setIsPlaying(true);
    
    const mediaObject = await speakTextSmart(text, () => {
      setIsPlaying(false);
      currentAudioRef.current = undefined;
    });
    
    currentAudioRef.current = mediaObject;
  };

  const extractText = (children: any): string => {
    if (!children) return '';
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(extractText).join('');
    if (children?.props?.children) return extractText(children.props.children);
    return '';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const cleanJsonString = (str: string): string => {
    if (!str) return "{}";
    let clean = str;
    clean = clean.replace(/\/\/.*$/gm, "");
    clean = clean.replace(/\/\*[\s\S]*?\*\//g, "");
    clean = clean.replace(/[\n\r\t]/g, " ");
    clean = clean.replace(/,(\s*[}\]])/g, "$1");
    clean = clean.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    return clean;
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const getVideoSrc = (attachment: any) => {
    if (!attachment?.data) return '';
    if (attachment.data.startsWith('data:') || attachment.data.startsWith('http')) return attachment.data;
    return `data:${attachment.mimeType || 'video/mp4'};base64,${attachment.data}`;
  };

  return (
    <div className={`flex w-full mb-3 md:mb-4 pop-in ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex w-full ${isUser ? 'flex-row' : 'flex-row-reverse'} gap-2`}>
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
            isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {isUser ? <User size={16}/> : <Bot size={18}/>}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} w-full max-w-[90%] md:max-w-[85%]`}>
          <div className={`px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-sm markdown-body text-sm md:text-lg leading-relaxed relative w-full transition-all
              ${isUser 
                ? 'bg-indigo-600 text-white rounded-tl-none font-medium' 
                : 'bg-white border border-slate-200 text-slate-900 rounded-tr-none font-medium'
            }`}>
            
            {message?.attachment?.type === "storyboard" && message.attachment.data && (
              <StoryboardPlayer data={message.attachment.data}/>
            )}

            {message?.attachment?.type === "video" && message.attachment.data && (
              <div className="mb-3 w-full rounded-xl overflow-hidden bg-black shadow-lg">
                <video 
                  controls 
                  playsInline
                  preload="metadata"
                  className="w-full" 
                  src={getVideoSrc(message.attachment)}
                  onPlay={() => unlockAudio()}
                />
              </div>
            )}

            {!isUser && (
              <div className="flex gap-2 mb-2 pb-2 border-b border-slate-100 justify-end no-print">
                <button 
                  onClick={handleSpeakFullMessage}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] md:text-xs font-bold transition-all active:scale-95 ${
                    isPlaying
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
                  }`}
                >
                  {isPlaying ? <StopCircle size={12}/> : <Volume2 size={12}/>}
                  {isPlaying ? 'إيقاف' : 'استمع'}
                </button>
                <button 
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] md:text-xs font-bold border transition-all active:scale-95 ${
                    isCopied
                      ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border-slate-200'
                  }`}
                >
                  {isCopied ? <Check size={12}/> : <Copy size={12}/>}
                  {isCopied ? 'تم' : 'نسخ'}
                </button>
              </div>
            )}

            {isUser ? (
              <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, children, ...props}) => {
                    const text = extractText(children);
                    return (
                      <p className="mb-2 last:mb-0 cursor-pointer hover:bg-indigo-50/30 rounded px-1 -mx-1 transition-colors"
                        onClick={() => onQuote?.(text)} title="اضغط للسؤال عن هذا الجزء" {...props}>
                        {children}
                      </p>
                    );
                  },
                  li: ({node, children, ...props}) => {
                    const text = extractText(children);
                    return (
                      <li className="mb-1 cursor-pointer hover:bg-indigo-50/30 rounded px-1 -mx-1 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onQuote?.(text); }} {...props}>
                        {children}
                      </li>
                    );
                  },
                  table: (props) => (
                    <div className="overflow-x-auto my-3 w-full border rounded-lg bg-slate-50/50">
                      <table className="min-w-full divide-y divide-slate-200 border text-xs md:text-base" {...props}/>
                    </div>
                  ),
                  code: ({node, inline, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const lang = match ? match[1].toLowerCase() : '';
                    const content = extractText(children).trim();
                    
                    // Render SVG/HTML blocks directly
                    if (!inline && (lang === 'svg' || lang === 'html')) {
                        return (
                           <div className="my-4 w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                               <div dangerouslySetInnerHTML={{ __html: content }} className="w-full h-full max-h-[400px] [&>svg]:w-full [&>svg]:h-full" />
                           </div>
                        );
                    }

                    const isImplicitJson = !inline && !lang && content.startsWith('{') && content.endsWith('}');
                    const isChartBlock = lang === 'chart';
                    const isJsonBlock = lang === 'json' || isImplicitJson;
                    
                    if (!inline && (isChartBlock || isJsonBlock)) {
                      try {
                        const cleaned = cleanJsonString(content);
                        const rawData = JSON.parse(cleaned);

                        const isChartPayload = rawData.type && (rawData.data || rawData.datasets);

                        if (isChartBlock || (isJsonBlock && isChartPayload)) {
                            let chartData = rawData;
                            // Adapter for Chart.js style data
                            if (!Array.isArray(rawData.data) && rawData.data?.labels && rawData.data?.datasets?.[0]?.data) {
                                const labels = rawData.data.labels;
                                const values = rawData.data.datasets[0].data;
                                const transformedData = labels.map((label: string, i: number) => ({
                                    x: label,
                                    y: values[i]
                                }));
                                chartData = {
                                    ...rawData,
                                    data: transformedData,
                                    title: rawData.options?.plugins?.title?.text || rawData.title
                                };
                            }

                            return (
                              <div className="my-4 p-4 w-full bg-white border rounded-xl shadow-sm direction-ltr" dir="ltr">
                                <div className="text-center font-bold text-slate-700 mb-2 text-sm bg-slate-50 py-1 rounded-t-lg border-b">
                                    {chartData.title || "رسم بياني توضيحي"}
                                </div>
                                <ResponsiveContainer width="100%" height={250}>
                                  {chartData.type === 'pie' ? (
                                     <PieChart>
                                        <Pie
                                          data={chartData.data}
                                          dataKey="y"
                                          nameKey="x"
                                          cx="50%"
                                          cy="50%"
                                          outerRadius={80}
                                          label
                                        >
                                          {chartData.data.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                     </PieChart>
                                  ) : chartData.type === 'bar' ? (
                                    <BarChart data={chartData.data}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                      <XAxis dataKey="x" tick={{fontSize: 12}}/>
                                      <YAxis tick={{fontSize: 12}}/>
                                      <RechartsTooltip/>
                                      <Bar dataKey="y" fill="#4f46e5" radius={[4, 4, 0, 0]}/>
                                    </BarChart>
                                  ) : chartData.type === 'area' ? (
                                    <AreaChart data={chartData.data}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                      <XAxis dataKey="x"/>
                                      <YAxis/>
                                      <RechartsTooltip/>
                                      <Area type="monotone" dataKey="y" stroke="#059669" fill="#10b981" fillOpacity={0.3}/>
                                    </AreaChart>
                                  ) : (
                                    <LineChart data={chartData.data}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                      <XAxis dataKey="x"/>
                                      <YAxis/>
                                      <RechartsTooltip/>
                                      <Line type="monotone" dataKey="y" stroke="#059669" strokeWidth={3} dot={{r: 4}}/>
                                    </LineChart>
                                  )}
                                </ResponsiveContainer>
                              </div>
                            );
                        }
                      } catch {
                         if (isChartBlock) {
                            return (
                              <div className="text-red-500 text-xs p-2 bg-red-50 border border-red-100 rounded text-center my-2">
                                ⚠️ تعذر عرض الرسم البياني
                              </div>
                            );
                         }
                      }
                    }

                    if (inline) {
                      return (
                        <button onClick={(e) => { e.stopPropagation(); onTermClick?.(String(children)); }}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer text-xs md:text-sm font-bold mx-1">
                          <Search size={10} className="ml-1 opacity-50"/> {children}
                        </button>
                      );
                    }

                    return (
                      <div className="my-4 w-full direction-ltr rounded-lg overflow-hidden border border-slate-200" dir="ltr">
                         <div className="bg-slate-800 text-slate-300 text-[10px] px-3 py-1 flex justify-between items-center no-print">
                            <span className="font-mono">{isJsonBlock ? 'JSON Data' : 'Code'}</span>
                         </div>
                         <pre className="bg-[#1e1e1e] text-[#4ec9b0] p-4 font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
                           <code {...props}>{children}</code>
                         </pre>
                      </div>
                    );
                  }
                }}
              >
                {message.text}
              </ReactMarkdown>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
