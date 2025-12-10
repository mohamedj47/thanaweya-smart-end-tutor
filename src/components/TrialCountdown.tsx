
import React, { useState, useEffect } from 'react';
import { Timer, Clock, AlertCircle } from 'lucide-react';

export const TrialCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // منطق فحص الحالة
  const checkStatus = () => {
      const isActivated = localStorage.getItem('app_activated') === 'true';
      if (isActivated) {
        setIsVisible(false);
        return false; // Stop timer logic
      }
      setIsVisible(true);
      return true; // Continue timer logic
  };

  useEffect(() => {
    // 1. Initial Check
    if (!checkStatus()) return;

    // 2. Listen for Updates
    const handleUpdate = () => checkStatus();
    window.addEventListener('subscription-updated', handleUpdate);

    // 3. Setup Timer
    let startStr = localStorage.getItem('trial_start_date');
    if (!startStr) {
      const now = new Date();
      localStorage.setItem('trial_start_date', now.toISOString());
      startStr = now.toISOString();
    }

    const startDate = new Date(startStr);
    const TRIAL_DURATION = 14 * 24 * 60 * 60 * 1000; 
    const endDate = new Date(startDate.getTime() + TRIAL_DURATION);

    const timer = setInterval(() => {
      // Re-check visibility
      if (!isVisible) {
          clearInterval(timer);
          return;
      }

      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => {
        clearInterval(timer);
        window.removeEventListener('subscription-updated', handleUpdate);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`w-full py-2 px-4 flex items-center justify-between shadow-md z-[150] relative transition-colors duration-500 font-mono text-sm md:text-base dir-rtl
      ${isExpired ? 'bg-red-600 text-white' : 'bg-slate-900 text-amber-400 border-b border-amber-500/30'}`} dir="rtl">
      
      <div className="flex items-center gap-2">
        {isExpired ? <AlertCircle className="animate-pulse" size={20} /> : <Timer size={20} />}
        <span className="font-bold font-sans">
          {isExpired ? 'انتهت الفترة التجريبية' : 'الفترة التجريبية المجانية:'}
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-3 font-bold tracking-widest bg-black/20 px-3 py-1 rounded-lg border border-white/10">
        {timeLeft ? (
            <>
                <div className="flex flex-col items-center leading-none min-w-[20px]">
                    <span>{timeLeft.days}</span>
                    <span className="text-[8px] opacity-60 font-sans">يوم</span>
                </div>
                <span className="opacity-50">:</span>
                <div className="flex flex-col items-center leading-none min-w-[20px]">
                    <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[8px] opacity-60 font-sans">ساعة</span>
                </div>
                <span className="opacity-50">:</span>
                <div className="flex flex-col items-center leading-none min-w-[20px]">
                    <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[8px] opacity-60 font-sans">دقيقة</span>
                </div>
                <span className="opacity-50 text-red-500 animate-pulse">:</span>
                <div className="flex flex-col items-center leading-none min-w-[20px]">
                    <span className="text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[8px] opacity-60 font-sans">ثانية</span>
                </div>
            </>
        ) : (
            <span className="text-xs">جاري الحساب...</span>
        )}
      </div>
    </div>
  );
};
