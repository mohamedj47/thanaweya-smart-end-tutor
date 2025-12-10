
import React, { useState, useEffect } from 'react';
import { Message, Sender, Subject } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Search, Volume2, StopCircle, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

interface MessageBubbleProps {
  message: Message;
  subject?: Subject;
  onTermClick?: (term: string) => void;
  onQuote?: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, subject, onTermClick, onQuote }) => {
  const isUser = message.sender === Sender.USER;
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeakFullMessage = () => {
      if (isPlaying) {
          window.speechSynthesis.cancel();
          setIsPlaying(false);
          return;
      }

      // Clean text for reading
      const text = message.text
        .replace(/```[\s\S]*?```/g, ' . رسم بياني . ') // Skip code blocks
        .replace(/[*#`_]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA";
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
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
      let clean = str;
      clean = clean.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      clean = clean.replace(/[\n\r\t]/g, " "); // Flatten newlines to spaces
      clean = clean.replace(/,(\s*[}\]])/g, "$1");
      clean = clean.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      clean = clean.replace(/(\d+)\.\s*([,}\]])/g, "$1.0$2");
      return clean;
  };

  return (
    <div className={`flex w-full mb-3 md:mb-4 pop-in ${isUser ? 'justify-start' : 'justify-end'} print:block print:mb-4 print:w-full`}>
      <div className={`flex w-full ${isUser ? 'flex-row' : 'flex-row-reverse'} gap-2 print:max-w-full print:flex-row print:w-full`}>
        
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center no-print mt-1 transition-transform ${
          isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {isUser ? <User size={16} className="md:w-[18px]" /> : <Bot size={18} className="md:w-[20px]" />}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} print:items-start print:w-full min-w-0 max-w-[90%] md:max-w-[85%]`}>
          <div className={`px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-sm markdown-body text-sm md:text-lg leading-relaxed relative w-full overflow-hidden transition-all duration-300
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-tl-none font-medium user-message-bubble' 
              : 'bg-white border border-slate-200 text-slate-900 rounded-tr-none font-medium'
            }`}>
            
            {!isUser && (
              <div className="flex gap-2 mb-2 pb-2 border-b border-slate-100 no-print w-full justify-end items-center">
                <button 
                  onClick={handleSpeakFullMessage}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] md:text-xs font-bold transition-all active:scale-95 ${
                      isPlaying
                      ? 'bg-red-100 text-red-600 border border-red-200' 
                      : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
                  }`}
                >
                  {isPlaying ? <StopCircle size={12} /> : <Volume2 size={12} />}
                  {isPlaying ? 'إيقاف' : '▶️ استمع للقطعة كاملة'}
                </button>
                <button 
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] md:text-xs font-bold border border-slate-200 transition-all active:scale-95 ${
                      isCopied 
                      ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                      : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  {isCopied ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
            )}

            {isUser ? (
              <p className="whitespace-pre-wrap leading-relaxed break-words">{message.text}</p>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({node, ...props}) => <div className="overflow-x-auto my-3 w-full border rounded-lg print:overflow-visible print:block"><table className="min-w-full divide-y divide-slate-200 border text-xs md:text-base print:border-black print:text-sm print:w-full" {...props} /></div>,
                  th: ({node, ...props}) => <th className="px-2 py-2 bg-slate-50 text-right font-bold text-slate-700 uppercase border print:bg-gray-100 print:text-black print:border-black whitespace-nowrap" {...props} />,
                  td: ({node, ...props}) => <td className="px-2 py-2 text-slate-800 border print:border-black min-w-[100px]" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-600 underline hover:text-blue-800 font-semibold print:text-black print:no-underline break-all" {...props} />,
                  
                  p: ({node, children, ...props}) => {
                    const text = extractText(children);
                    return (
                        <p 
                            className="mb-2 last:mb-0 leading-relaxed cursor-pointer hover:bg-indigo-50/30 rounded px-1 -mx-1 transition-colors"
                            onClick={() => onQuote && onQuote(text)}
                            title="اضغط للسؤال عن هذا الجزء"
                            {...props}
                        >
                            {children}
                        </p>
                    );
                  },
                  
                  li: ({node, children, ...props}) => {
                    const text = extractText(children);
                    return (
                        <li 
                            className="mb-1 cursor-pointer hover:bg-indigo-50/30 rounded px-1 -mx-1 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuote && onQuote(text);
                            }}
                            {...props}
                        >
                            {children}
                        </li>
                    );
                  },

                  blockquote: ({node, ...props}) => <blockquote className="border-r-4 border-indigo-300 pr-3 italic text-slate-600 bg-indigo-50/50 p-2 rounded my-2 text-sm md:text-lg print:bg-white print:text-black print:border-black print:pl-0" {...props} />,
                  
                  code: ({node, inline, className, children, ...props}: any) => {
                     const match = /language-(\w+)/.exec(className || '');
                     const isChart = match && match[1] === 'chart';
                     
                     if (!inline && isChart) {
                        try {
                           const jsonString = String(children);
                           const cleanedJson = cleanJsonString(jsonString);
                           const chartData = JSON.parse(cleanedJson);
                           
                           return (
                               <div className="my-4 w-full h-64 md:h-80 bg-white p-4 rounded-xl border border-slate-200 shadow-sm direction-ltr pop-in" dir="ltr">
                                   <div className="text-center font-bold text-slate-700 mb-2 text-sm bg-slate-50 py-1 rounded-t-lg border-b">{chartData.title}</div>
                                   <ResponsiveContainer width="100%" height="100%">
                                       {chartData.type === 'bar' ? (
                                           <BarChart data={chartData.data}>
                                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                               <XAxis dataKey="x" tick={{fontSize: 12}} />
                                               <YAxis tick={{fontSize: 12}} />
                                               <RechartsTooltip />
                                               <Bar dataKey="y" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                           </BarChart>
                                       ) : chartData.type === 'area' ? (
                                            <AreaChart data={chartData.data}>
                                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                               <XAxis dataKey="x" />
                                               <YAxis />
                                               <RechartsTooltip />
                                               <Area type="monotone" dataKey="y" stroke="#059669" fill="#10b981" fillOpacity={0.3} />
                                            </AreaChart>
                                       ) : (
                                           <LineChart data={chartData.data}>
                                               <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                               <XAxis dataKey="x" />
                                               <YAxis />
                                               <RechartsTooltip />
                                               <Line type="monotone" dataKey="y" stroke="#059669" strokeWidth={3} dot={{r: 4}} />
                                           </LineChart>
                                       )}
                                   </ResponsiveContainer>
                               </div>
                           );
                        } catch (e) {
                           return (
                               <div className="text-red-500 text-xs p-2 bg-red-50 border border-red-100 rounded text-center my-2">
                                  ⚠️ تعذر عرض الرسم البياني
                               </div>
                           );
                        }
                     }

                     if (inline) {
                       return (
                         <button 
                           onClick={(e) => {
                               e.stopPropagation();
                               onTermClick && onTermClick(String(children));
                           }}
                           className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer print:bg-transparent print:border-black print:text-black text-xs md:text-sm align-middle font-bold"
                         >
                           <Search size={10} className="ml-1 opacity-50 no-print" />
                           {children}
                         </button>
                       );
                     }
                     return (
                        <div className="my-4 w-full direction-ltr pop-in rounded-lg overflow-hidden border border-slate-200" dir="ltr">
                           <div className="bg-slate-800 text-slate-300 text-[10px] px-3 py-1 flex justify-between items-center no-print">
                              <span className="font-mono">Code / Diagram</span>
                           </div>
                           <pre className="bg-[#1e1e1e] text-[#4ec9b0] p-4 font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words overflow-x-auto print:bg-white print:border-none print:text-black print:p-0">
                             <code {...props}>
                               {children}
                             </code>
                           </pre>
                        </div>
                     );
                  },
                }}
              >
                {message.text}
              </ReactMarkdown>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 px-1 no-print">
            {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
