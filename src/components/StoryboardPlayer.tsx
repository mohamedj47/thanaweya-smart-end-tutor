
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, MonitorPlay, Clapperboard, Sparkles, Loader2, Volume2 } from 'lucide-react';
import { speakTextSmart, fetchSmartAudioUrl } from '../utils/tts';
import { unlockAudio } from '../utils/unlockAudio';

interface StoryboardPlayerProps {
    data: string;
}

export const StoryboardPlayer: React.FC<StoryboardPlayerProps> = ({ data }) => {
    const [story, setStory] = useState<any>(null);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // Audio Cache: Index -> Blob URL
    const audioCacheRef = useRef<Record<number, string>>({});
    // Promise Cache: Index -> Promise (to prevent duplicate fetches during preload)
    const audioPromiseCacheRef = useRef<Record<number, Promise<string | null>>>({});
    
    const activeAudioRef = useRef<HTMLAudioElement | SpeechSynthesisUtterance | undefined>(undefined);
    const loadingRef = useRef(false);
    const activeIndexRef = useRef(0);

    // Parsing Logic
    useEffect(() => {
        try {
            if (!data) return; 
            if (typeof data !== 'string') throw new Error("Data must be a string");
            
            let jsonString = data.trim();
            const firstBrace = jsonString.indexOf('{');
            const lastBrace = jsonString.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonString = jsonString.substring(firstBrace, lastBrace + 1);
            }

            const parsed = JSON.parse(jsonString);

            if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
                 throw new Error("Invalid Storyboard Format");
            }

            setStory(parsed);
            setCurrentSceneIndex(0); 
            setError(false);
            
            // Clear old cache
            Object.values(audioCacheRef.current).forEach(url => URL.revokeObjectURL(url as string));
            audioCacheRef.current = {};
            audioPromiseCacheRef.current = {};
            
            // Start Preloading immediately (Parallel)
            preloadAudio(parsed.scenes);

        } catch (e) {
            console.error("Storyboard Parse Error:", e);
            setError(true);
        }
    }, [data]);

    // Preloading Logic - Parallel Fetching
    const preloadAudio = (scenes: any[]) => {
        scenes.forEach((scene, i) => {
            const text = scene.narration;
            if (text && !audioPromiseCacheRef.current[i]) {
                // Initiate fetch and cache the promise
                const promise = fetchSmartAudioUrl(text).then(url => {
                    if (url) {
                        audioCacheRef.current[i] = url;
                    }
                    return url;
                });
                audioPromiseCacheRef.current[i] = promise;
            }
        });
    };

    // Cleanup
    useEffect(() => {
        return () => {
            stopAllAudio();
            loadingRef.current = false;
            // Cleanup cache blobs
            Object.values(audioCacheRef.current).forEach(url => URL.revokeObjectURL(url as string));
        };
    }, []);

    const stopAllAudio = () => {
        if (activeAudioRef.current instanceof HTMLAudioElement) {
            activeAudioRef.current.pause();
            activeAudioRef.current.currentTime = 0;
        }
        window.speechSynthesis.cancel();
        activeAudioRef.current = undefined;
    };

    // Handle Scene Change
    useEffect(() => {
        activeIndexRef.current = currentSceneIndex;
        stopAllAudio();

        if (isPlaying && story) {
            playSceneAudio();
        }
    }, [currentSceneIndex]);

    // Handle Play/Pause Toggle
    useEffect(() => {
        if (!story) return;

        if (isPlaying) {
             if (activeAudioRef.current instanceof HTMLAudioElement) {
                 activeAudioRef.current.play().catch(e => {
                     console.warn("Resume failed, restarting scene audio", e);
                     playSceneAudio();
                 });
             } else if (!activeAudioRef.current && !loadingRef.current) {
                 playSceneAudio();
             } else if (window.speechSynthesis.paused) {
                 window.speechSynthesis.resume();
             }
        } else {
            if (activeAudioRef.current instanceof HTMLAudioElement) {
                activeAudioRef.current.pause();
            }
            window.speechSynthesis.cancel(); 
        }
    }, [isPlaying]);

    const playSceneAudio = async () => {
        unlockAudio();
        
        const targetIndex = activeIndexRef.current;
        const scene = story?.scenes[targetIndex];
        
        if (!scene || loadingRef.current) return;

        setIsLoadingAudio(true);
        loadingRef.current = true;

        try {
            if (targetIndex !== activeIndexRef.current || !isPlaying) {
                setIsLoadingAudio(false);
                loadingRef.current = false;
                return;
            }

            const narrationText = scene.narration || "مشهد جديد";
            
            // Check cache or promise
            let url = audioCacheRef.current[targetIndex];

            // If not in URL cache, check if there is a pending promise
            if (!url && audioPromiseCacheRef.current[targetIndex]) {
                try {
                    url = await audioPromiseCacheRef.current[targetIndex] || undefined;
                } catch (e) { console.error("Error awaiting audio promise", e); }
            } 
            
            // If still no url (and no promise - unlikely with preload), fetch now
            if (!url && !audioPromiseCacheRef.current[targetIndex]) {
                 const promise = fetchSmartAudioUrl(narrationText).then(u => {
                    if (u) audioCacheRef.current[targetIndex] = u;
                    return u;
                 });
                 audioPromiseCacheRef.current[targetIndex] = promise;
                 url = await promise || undefined;
            }

            const mediaObject = await speakTextSmart(narrationText, () => {
                 if (isPlaying && activeIndexRef.current === targetIndex) {
                     if (activeIndexRef.current < story.scenes.length - 1) {
                        setCurrentSceneIndex(prev => prev + 1);
                     } else {
                        setIsPlaying(false);
                     }
                 }
                 activeAudioRef.current = undefined;
            }, url);

            activeAudioRef.current = mediaObject;

        } catch (e) {
            console.error("Audio Playback Error", e);
            // Auto-advance on error after small delay
            setTimeout(() => {
                if (isPlaying && activeIndexRef.current === targetIndex) {
                    if (activeIndexRef.current < story.scenes.length - 1) {
                        setCurrentSceneIndex(prev => prev + 1);
                     } else {
                        setIsPlaying(false);
                     }
                 }
            }, 3000);
        } finally {
            setIsLoadingAudio(false);
            loadingRef.current = false;
        }
    };

    if (error) return (
        <div className="text-red-500 text-xs p-4 border border-red-200 bg-red-50 rounded-xl text-center my-4 font-bold shadow-sm">
            ⚠️ تعذر تشغيل الفيديو (البيانات غير صالحة)
        </div>
    );

    if (!story) return (
        <div className="text-slate-400 text-xs animate-pulse text-center p-6 border border-slate-100 rounded-xl bg-slate-50 my-4 flex flex-col items-center gap-2">
            <MonitorPlay size={20} className="opacity-50" />
            <span>جاري تحميل المشاهد...</span>
        </div>
    );
    
    const safeIndex = Math.min(Math.max(0, currentSceneIndex), story.scenes.length - 1);
    const currentScene = story.scenes[safeIndex];

    if (!currentScene) return null;

    const hasSvg = currentScene.svg_illustration && typeof currentScene.svg_illustration === 'string' && currentScene.svg_illustration.trim().startsWith('<svg');

    return (
        <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white my-6 direction-ltr flex flex-col group transition-all hover:shadow-2xl" dir="rtl">
            <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                 <div className="absolute top-4 right-4 bg-black/60 text-white/90 font-mono text-[10px] z-20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
                    Scene {safeIndex + 1} / {story.scenes.length}
                 </div>
                 
                 <div className="z-10 w-full h-full p-0 flex items-center justify-center">
                     {hasSvg ? (
                         <div 
                            className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain animate-in fade-in zoom-in-95 duration-700"
                            dangerouslySetInnerHTML={{ __html: currentScene.svg_illustration }}
                         />
                     ) : (
                        <div className="flex flex-col items-center gap-4 text-indigo-400 opacity-80 animate-pulse">
                            <MonitorPlay size={64} />
                            <p className="text-lg font-bold text-white text-center px-4 max-w-md leading-relaxed">
                                {currentScene.visual || "مشهد توضيحي"}
                            </p>
                        </div>
                     )}
                 </div>
            </div>

            <div className="bg-amber-50/80 backdrop-blur-sm p-4 border-t border-amber-100 min-h-[100px] flex flex-col items-center justify-center text-center relative transition-colors duration-300">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
                    <div className={`p-1.5 rounded-full shadow-md border-2 border-white ring-1 ring-indigo-100 transition-colors ${isLoadingAudio ? 'bg-amber-500' : 'bg-indigo-600'} text-white`}>
                       {isLoadingAudio ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} fill="currentColor" />}
                    </div>
                </div>

                <p 
                    key={`scene-text-${safeIndex}`} 
                    className="text-slate-800 text-base md:text-lg font-bold leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-3xl"
                >
                    {currentScene.narration || "..."}
                </p>
            </div>

            <div className="bg-white p-3 flex items-center justify-between border-t border-slate-100 select-none">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs max-w-[30%]">
                    <Clapperboard size={14} className="text-indigo-500 shrink-0" />
                    <span className="truncate">{story.title || "فيديو تعليمي"}</span>
                </div>

                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => {
                            setCurrentSceneIndex(Math.max(0, safeIndex - 1));
                            setIsPlaying(false);
                        }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-full active:scale-95"
                        disabled={safeIndex === 0}
                    >
                        <SkipForward size={24} className="transform rotate-180" /> 
                    </button>

                    <button 
                        onClick={() => {
                            unlockAudio(); 
                            setIsPlaying(!isPlaying);
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-xl ${
                            isPlaying 
                            ? 'bg-red-500 text-white shadow-red-200 ring-4 ring-red-100' 
                            : 'bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-100'
                        }`}
                        disabled={isLoadingAudio && !isPlaying}
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <button 
                        onClick={() => {
                            setCurrentSceneIndex(Math.min(story.scenes.length - 1, safeIndex + 1));
                            setIsPlaying(false);
                        }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-full active:scale-95"
                        disabled={safeIndex === story.scenes.length - 1}
                    >
                        <SkipBack size={24} className="transform rotate-180" />
                    </button>
                </div>

                <div className="w-[30%]"></div>
            </div>
        </div>
    );
};
