
import React, { useState, useEffect } from 'react';
import { Lock, Copy, CheckCircle, Send, BadgePercent, Crown, X, AlertTriangle, Check, Package } from 'lucide-react';
import { GradeLevel, Subject } from '../types';

const SALT = "SMART_EDU_EGYPT_2026"; 
const MASTER_KEY = "MY-KIDS-VIP-2026"; 
const PHONE_NUMBER = "201221746554"; 

const SUBJECT_PRICE = 250;
const BUNDLE_PRICE = 700;

const SUBJECTS_BY_GRADE: Record<GradeLevel, Subject[]> = {
  [GradeLevel.GRADE_10]: [
    Subject.ARABIC, Subject.ENGLISH, Subject.MATH, Subject.INTEGRATED_SCIENCES, 
    Subject.HISTORY, Subject.PHILOSOPHY, Subject.FRENCH, Subject.GERMAN, 
    Subject.RELIGION, Subject.NATIONAL_EDUCATION
  ],
  [GradeLevel.GRADE_11]: [
    Subject.ARABIC, Subject.ENGLISH, Subject.MATH, Subject.PHYSICS, Subject.CHEMISTRY, 
    Subject.BIOLOGY, Subject.HISTORY, Subject.GEOGRAPHY, Subject.PHILOSOPHY, 
    Subject.PSYCHOLOGY, Subject.FRENCH, Subject.GERMAN
  ],
  [GradeLevel.GRADE_12]: [
    Subject.ARABIC, Subject.ENGLISH, Subject.MATH, Subject.PHYSICS, Subject.CHEMISTRY, 
    Subject.BIOLOGY, Subject.GEOLOGY, Subject.HISTORY, Subject.GEOGRAPHY, 
    Subject.PHILOSOPHY, Subject.PSYCHOLOGY, Subject.FRENCH, Subject.GERMAN
  ]
};

interface SubscriptionModalProps {
    currentGrade: GradeLevel | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ currentGrade }) => {
  const [status, setStatus] = useState<'loading' | 'trial' | 'expired' | 'activated'>('loading');
  const [deviceId, setDeviceId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // --- New State as Requested ---
  const [selectedGrade, setSelectedGrade] = useState("");
  // ------------------------------

  const [internalGrade, setInternalGrade] = useState<GradeLevel | null>(currentGrade);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isFullBundle, setIsFullBundle] = useState(true);

  useEffect(() => {
     if (currentGrade) {
         setInternalGrade(currentGrade);
         // Map current grade to the new state format automatically if present
         if (currentGrade === GradeLevel.GRADE_10) setSelectedGrade("grade-1");
         if (currentGrade === GradeLevel.GRADE_11) setSelectedGrade("grade-2");
         if (currentGrade === GradeLevel.GRADE_12) setSelectedGrade("grade-3");
     }
  }, [currentGrade]);

  const availableSubjects = internalGrade ? SUBJECTS_BY_GRADE[internalGrade] : [];

  useEffect(() => {
    checkSubscription();
    // Listeners for other events kept for compatibility
    const handleUpdate = () => checkSubscription();
    const handleOpen = () => setIsOpen(true);
    
    window.addEventListener('subscription-updated', handleUpdate);
    window.addEventListener('open-subscription-modal', handleOpen);
    
    return () => {
        window.removeEventListener('subscription-updated', handleUpdate);
        window.removeEventListener('open-subscription-modal', handleOpen);
    };
  }, []);

  const checkSubscription = () => {
    try {
        let storedId = localStorage.getItem('device_id');
        if (!storedId) {
          storedId = 'ID-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          localStorage.setItem('device_id', storedId);
        }
        setDeviceId(storedId);

        let unlockedSubjects: string[] = [];
        try {
            unlockedSubjects = JSON.parse(localStorage.getItem('activated_subjects') || '[]');
        } catch { unlockedSubjects = []; }
        
        const oldActivated = localStorage.getItem('app_activated') === 'true';

        if (unlockedSubjects.length > 0 || oldActivated) {
             setStatus('activated');
             return;
        }

        const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
        let startDateStr = localStorage.getItem('trial_start_date');
        let startDate;

        if (!startDateStr) {
          const now = new Date();
          localStorage.setItem('trial_start_date', now.toISOString());
          startDate = now;
        } else {
          startDate = new Date(startDateStr);
        }

        const now = new Date();
        const elapsed = now.getTime() - startDate.getTime();
        const remainingMs = TRIAL_DURATION_MS - elapsed;

        if (remainingMs <= 0) {
          setStatus('expired');
          setIsOpen(true);
        } else {
          setStatus('trial');
        }
    } catch (e) {
        console.error("Subscription check failed", e);
        setStatus('trial'); 
    }
  };

  const toggleSubject = (subject: string) => {
      if (isFullBundle) setIsFullBundle(false);
      setSelectedSubjects(prev => {
          if (prev.includes(subject)) return prev.filter(s => s !== subject);
          return [...prev, subject];
      });
  };

  const selectBundle = () => {
      setIsFullBundle(true);
      setSelectedSubjects([]); 
  };

  const handleActivate = () => {
    const code = inputCode.trim();
    const expectedCode = btoa(deviceId + SALT).substring(0, 12);

    if (code === expectedCode || code === MASTER_KEY) {
      
      // --- New Validation Logic ---
      if (isFullBundle && !selectedGrade) {
          setError("من فضلك اختر الصف الدراسي أولاً.");
          return;
      }
      // ----------------------------

      let subjectsToUnlock: string[] = [];
      
      if (isFullBundle) {
          subjectsToUnlock = ['FULL_BUNDLE'];
          // --- Store Selected Grade ---
          localStorage.setItem('selected_grade', selectedGrade);
          // Also store mapping for compatibility if needed elsewhere
          localStorage.setItem('activated_grade', selectedGrade);
          localStorage.setItem('activated_bundle', 'full');
      } else {
          if (selectedSubjects.length === 0) {
              setError("من فضلك اختر المواد أو الباقة أولاً قبل التفعيل.");
              return;
          }
          subjectsToUnlock = [...selectedSubjects];
      }

      let existing: string[] = [];
      try {
          existing = JSON.parse(localStorage.getItem('activated_subjects') || '[]');
      } catch { existing = []; }

      const merged = Array.from(new Set([...existing, ...subjectsToUnlock]));
      localStorage.setItem('activated_subjects', JSON.stringify(merged));
      
      // --- Mark App Activated ---
      localStorage.setItem('app_activated', 'true'); 

      setStatus('activated');
      setIsOpen(false);
      setError('');
      
      alert(`تم التفعيل بنجاح! 🚀`);
      
      // --- Reload as requested ---
      window.location.reload();

    } else {
      setError("كود التفعيل غير صحيح.");
    }
  };

  const handleWhatsAppClick = () => {
    let message = "";
    let price = 0;

    if (isFullBundle) {
        price = BUNDLE_PRICE;
        message = `مرحباً، أريد تفعيل *الباقة الشاملة* (ترم كامل).
رقم جهازي: ${deviceId}
الصف المختار: ${selectedGrade === 'grade-1' ? 'أولى ثانوي' : selectedGrade === 'grade-2' ? 'تانية ثانوي' : 'تالتة ثانوي'}
----------------
السعر المطلوب: ${price} جنيه`;
    } else {
        if (selectedSubjects.length === 0) return;
        price = selectedSubjects.length * SUBJECT_PRICE;
        message = `مرحباً، أريد تفعيل اشتراك مواد محددة.
رقم جهازي: ${deviceId}
المواد (${selectedSubjects.length}):
${selectedSubjects.join(' - ')}
----------------
السعر المطلوب: ${price} جنيه`;
    }

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

  const currentPrice = isFullBundle ? BUNDLE_PRICE : (selectedSubjects.length * SUBJECT_PRICE);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 font-sans dir-rtl text-right" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 relative max-h-[95vh] flex flex-col">
        
        {status === 'trial' && (
          <button onClick={() => setIsOpen(false)} className="absolute top-4 left-4 z-50 bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}

        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center text-white flex-shrink-0 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
                <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-300 animate-pulse" />
                <h2 className="text-2xl font-black">
                    ترقية الحساب
                </h2>
                <p className="text-indigo-100 text-sm mt-1">اختر المواد التي تريدها أو وفر مع الباقة الشاملة</p>
           </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
            {/* --- Grade Selection UI inside Modal --- */}
            {isFullBundle && (
                <div className="mb-6 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                    <p className="text-center font-bold text-slate-800 mb-3">اختر الصف الدراسي لعرض الباقات:</p>
                    <div className="grid grid-cols-1 gap-2">
                       <button 
                           onClick={() => { setSelectedGrade("grade-1"); setInternalGrade(GradeLevel.GRADE_10); }}
                           className={`p-3 rounded-xl font-bold transition-all border-2 ${selectedGrade === "grade-1" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                       >
                           الصف الأول الثانوي
                       </button>
                       <button 
                           onClick={() => { setSelectedGrade("grade-2"); setInternalGrade(GradeLevel.GRADE_11); }}
                           className={`p-3 rounded-xl font-bold transition-all border-2 ${selectedGrade === "grade-2" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                       >
                           الصف الثاني الثانوي
                       </button>
                       <button 
                           onClick={() => { setSelectedGrade("grade-3"); setInternalGrade(GradeLevel.GRADE_12); }}
                           className={`p-3 rounded-xl font-bold transition-all border-2 ${selectedGrade === "grade-3" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                       >
                           الصف الثالث الثانوي
                       </button>
                    </div>
                </div>
            )}
            
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                        onClick={selectBundle}
                        className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                            isFullBundle 
                            ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-[1.02]' 
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                    >
                        {isFullBundle && <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold">الخيار المفضل ⭐</div>}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Package className={isFullBundle ? "text-indigo-600" : "text-slate-400"} />
                                <span className={`font-black text-lg ${isFullBundle ? "text-indigo-900" : "text-slate-600"}`}>الباقة الشاملة</span>
                            </div>
                            {isFullBundle && <CheckCircle className="text-indigo-600" size={24} />}
                        </div>
                        <p className="text-sm text-slate-500 mb-3">كل مواد {internalGrade || "الصف المختار"} (ترم كامل)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-indigo-700">{BUNDLE_PRICE}ج</span>
                            <span className="text-sm text-slate-400 line-through">1500ج</span>
                        </div>
                        <div className="mt-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md inline-block">
                            توفير 800 جنيه! 🔥
                        </div>
                    </div>

                    <div 
                        onClick={() => setIsFullBundle(false)}
                        className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                            !isFullBundle 
                            ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-[1.02]' 
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                    >
                        {!isFullBundle && <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold">تخصيص</div>}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <BadgePercent className={!isFullBundle ? "text-indigo-600" : "text-slate-400"} />
                                <span className={`font-black text-lg ${!isFullBundle ? "text-indigo-900" : "text-slate-600"}`}>مواد محددة</span>
                            </div>
                            {!isFullBundle && <CheckCircle className="text-indigo-600" size={24} />}
                        </div>
                        <p className="text-sm text-slate-500 mb-3">اختر المواد التي تحتاجها فقط</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-indigo-700">{SUBJECT_PRICE}ج</span>
                            <span className="text-sm text-slate-500">/ للمادة</span>
                        </div>
                    </div>
                </div>

                {!isFullBundle && internalGrade && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
                        <h4 className="font-bold text-slate-700 mb-3 text-sm">حدد المواد المطلوبة:</h4>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {availableSubjects.map(subj => (
                                <button
                                    key={subj}
                                    onClick={() => toggleSubject(subj)}
                                    className={`flex items-center justify-between p-2 rounded-lg border text-sm transition-all ${
                                        selectedSubjects.includes(subj)
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold'
                                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{subj}</span>
                                    {selectedSubjects.includes(subj) && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
           </div>

           <div className="mt-6 flex flex-col items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 border-dashed">
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

           {error && (
                <div className="mt-4 text-red-600 text-xs font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                    <AlertTriangle size={16} /> {error}
                </div>
           )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
                <span className="text-slate-500 font-bold">الإجمالي المطلوب:</span>
                <span className="text-2xl font-black text-indigo-700">{currentPrice} جنيه</span>
            </div>

            <button 
                onClick={handleWhatsAppClick}
                disabled={!isFullBundle && selectedSubjects.length === 0}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send size={18} />
                <span>إرسال الطلب (واتساب)</span>
            </button>

            <div className="flex gap-2">
                <input 
                   type="text" 
                   value={inputCode}
                   onChange={(e) => setInputCode(e.target.value)}
                   className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono placeholder:font-sans"
                   placeholder="أدخل كود التفعيل"
                />
                <button 
                    onClick={handleActivate}
                    disabled={(!isFullBundle && selectedSubjects.length === 0)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                    تفعيل
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
