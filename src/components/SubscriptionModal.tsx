import React, { useState, useEffect } from 'react';
import { Lock, Copy, CheckCircle, Send, BadgePercent, AlertTriangle, Crown, X } from 'lucide-react';
import { GradeLevel } from '../types';

// --- إعدادات المدير ---
const SALT = "SMART_EDU_EGYPT_2026"; 
const MASTER_KEY = "202625ah"; 
const PHONE_NUMBER = "201021953277"; // رقمك مع كود مصر

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
    const message = `مرحباً مستر، أريد تفعيل اشتراك تطبيق 'المعلم الذكي'.%0aرقم جهازي هو: ${deviceId}%0aلقد قمت بتحويل مبلغ الاشتراك.`;
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${message}`, '_blank');
  };

  if (!isOpen && (status === 'trial' || status === 'loading')) return null;
  if (!isOpen && status === 'activated') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 font-sans dir-rtl text-right" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 relative">
        
        {status === 'trial' && (
          <button onClick={() => setIsOpen(false)} className="absolute top-4 left-4 z-50 bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-white p-5 text-center border-b border-red-100">
           <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-3 shadow-sm animate-bounce">
             <Crown className="text-red-600 w-7 h-7" />
           </div>
           <h2 className="text-xl font-black text-slate-800">
             {status === 'expired' ? 'انتهت الفترة التجريبية' : 'اشترك الآن في الباقة الذهبية'}
           </h2>
           <p className="text-sm text-slate-600 font-medium mt-1">استثمر في مستقبلك واضمن التفوق</p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
           
           {/* Pricing Layout */}
           <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-center gap-2 mb-3">
                 <BadgePercent className="text-indigo-600 w-5 h-5" />
                 <span className="text-sm font-bold text-indigo-800">باقات الاشتراك المتاحة</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <p className="text-xs text-slate-500 font-bold mb-1">المادة الواحدة</p>
                    <p className="text-2xl font-black text-indigo-600">100<span className="text-xs text-slate-400 font-medium mr-1">ج.م</span></p>
                 </div>

                 <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-xl shadow-md text-center text-white relative overflow-hidden">
                    <p className="text-xs text-indigo-100 font-bold mb-1">باقة الصف كاملة</p>
                    <p className="text-2xl font-black text-white">400<span className="text-xs text-indigo-200 font-medium mr-1">ج.م</span></p>
                 </div>
              </div>
           </div>

           {/* Device ID */}
           <div className="flex flex-col items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 border-dashed">
              <span className="text-xs text-slate-500 font-bold">رقم جهازك (مطلوب للتفعيل)</span>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm w-full justify-between">
                 <code className="text-sm font-mono font-black text-slate-700 tracking-widest">{deviceId}</code>
                 <button 
                   onClick={() => navigator.clipboard.writeText(deviceId)}
                   className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
                 >
                    <Copy size={16} />
                 </button>
              </div>
           </div>

           {/* Actions */}
           <div className="space-y-3 pt-2">
              <button 
                onClick={handleWhatsAppClick}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Send size={20} />
                <span>إرسال صورة التحويل (واتساب)</span>
              </button>
              
              <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={inputCode}
                   onChange={(e) => setInputCode(e.target.value)}
                   className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono font-bold"
                   placeholder="أدخل كود التفعيل"
                 />
                 <button 
                  onClick={handleActivate}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
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
