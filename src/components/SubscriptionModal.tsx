import React, { useState, useEffect } from 'react';
import { Lock, Copy, CheckCircle, Send, BadgePercent, AlertTriangle, Crown, X } from 'lucide-react';
import { GradeLevel } from '../types';

// --- Security Configuration ---
const SALT = "SMART_EDU_EGYPT_2026"; 
const MASTER_KEY = "202625ah"; 
const PHONE_NUMBER = "201021953277"; 

interface SubscriptionModalProps {
    currentGrade: GradeLevel | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ currentGrade }) => {
  const [status, setStatus] = useState<'loading' | 'trial' | 'expired' | 'activated'>('loading');
  const [deviceId, setDeviceId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = () => {
    try {
        let storedId = localStorage.getItem('device_id');
        if (!storedId) {
          storedId = 'ID-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          localStorage.setItem('device_id', storedId);
        }
        setDeviceId(storedId);

        const unlockedSubjects = JSON.parse(localStorage.getItem('activated_subjects') || '[]');
        const oldActivated = localStorage.getItem('app_activated') === 'true';

        if (unlockedSubjects.length > 0 || oldActivated) {
             setStatus('activated');
             return;
        }

        const startDateStr = localStorage.getItem('trial_start_date');
        let startDate = new Date();
        if (!startDateStr) {
          localStorage.setItem('trial_start_date', startDate.toISOString());
        } else {
          startDate = new Date(startDateStr);
        }

        const now = new Date();
        const diffTime = Math.abs(now.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const remaining = 14 - diffDays; 

        if (remaining <= 0) {
          setStatus('expired');
          setIsOpen(true); 
        } else {
          setStatus('trial');
        }
    } catch (e) {
        setStatus('trial'); 
    }
  };

  const handleActivate = () => {
    const code = inputCode.trim();
    const expectedCode = btoa(deviceId + SALT).substring(0, 12);

    if (code === expectedCode || code === MASTER_KEY) {
      localStorage.setItem('activated_subjects', JSON.stringify(['FULL_BUNDLE']));
      localStorage.setItem('app_activated', 'true');
      setStatus('activated');
      setIsOpen(false);
      alert("تم التفعيل بنجاح! 🚀");
      window.location.reload(); 
    } else {
      setError("كود التفعيل غير صحيح.");
    }
  };

  const handleWhatsAppClick = () => {
    const message = `مرحباً، أريد تفعيل اشتراك 'المعلم الذكي'.\nرقم جهازي: ${deviceId}`;
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isOpen && (status === 'trial' || status === 'loading')) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[200] bg-gradient-to-r from-yellow-400 to-amber-500 text-indigo-900 font-bold py-3 px-5 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2 animate-bounce border-2 border-white/50"
      >
        <Crown size={20} />
        <span>اشتراك VIP</span>
      </button>
    );
  }

  if (!isOpen && status !== 'expired') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 font-sans dir-rtl text-right" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 relative">
        
        {status === 'trial' && (
          <button onClick={() => setIsOpen(false)} className="absolute top-4 left-4 z-50 bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}

        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center text-white">
           <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-300" />
           <h2 className="text-2xl font-black">ترقية الحساب</h2>
           <p className="text-indigo-100 text-sm mt-1">اشترك الآن لفتح كافة المميزات</p>
        </div>

        <div className="p-6 space-y-6 bg-slate-50">
           <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-sm font-bold text-slate-700 mb-2">باقة الصف الدراسي كاملة</p>
              <p className="text-3xl font-black text-indigo-600">400ج.م</p>
              <p className="text-xs text-slate-400 mt-1">ترم دراسي كامل</p>
           </div>

           <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 border-dashed">
              <span className="text-xs text-slate-400 font-bold">رقم جهازك (مطلوب للتفعيل)</span>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-full justify-between">
                 <code className="text-sm font-mono font-black text-slate-700 tracking-widest">{deviceId}</code>
                 <button 
                   onClick={() => navigator.clipboard.writeText(deviceId)}
                   className="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-md transition-colors"
                 >
                    <Copy size={16} />
                 </button>
              </div>
           </div>

           <div className="space-y-3">
              <button 
                onClick={handleWhatsAppClick}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Send size={20} />
                <span>إرسال الطلب (واتساب)</span>
              </button>
              
              <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={inputCode}
                   onChange={(e) => setInputCode(e.target.value)}
                   className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono"
                   placeholder="كود التفعيل"
                 />
                 <button 
                  onClick={handleActivate}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold"
                >
                  تفعيل
                </button>
              </div>
           </div>
           
           {error && (
                <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg border border-red-100 flex items-center justify-center gap-1">
                    <AlertTriangle size={14} /> {error}
                </div>
           )}
        </div>
      </div>
    </div>
  );
};
