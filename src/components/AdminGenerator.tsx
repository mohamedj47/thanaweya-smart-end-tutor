
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Copy, RefreshCw, Home, 
  AlertTriangle, Lock, Crown, LogOut, RotateCcw, KeyRound, ChevronRight
} from 'lucide-react';

const SALT = "SMART_EDU_EGYPT_2026";
const ADMIN_PASSWORD = "2026";

export const AdminGenerator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [studentDeviceId, setStudentDeviceId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  
  const [myDeviceId, setMyDeviceId] = useState('');
  const [appStatus, setAppStatus] = useState('');

  useEffect(() => {
    try {
        setMyDeviceId(localStorage.getItem('device_id') || 'غير معروف');
        const isActivated = localStorage.getItem('app_activated') === 'true';
        setAppStatus(isActivated ? 'مفعل (Activated)' : 'فترة تجريبية (Trial)');
    } catch (e) {
        console.warn("Admin storage error", e);
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        setLoginError("");
    } else {
        setLoginError("كلمة المرور غير صحيحة");
        setPasswordInput("");
    }
  };

  const generateCode = () => {
    if (!studentDeviceId.trim()) return;
    try {
        if (/[^\x00-\x7F]/.test(studentDeviceId)) {
             alert("⚠️ تنبيه: رقم الجهاز يجب أن يكون بالإنجليزية فقط (بدون حروف عربية).");
             return;
        }
        const code = btoa(studentDeviceId.trim() + SALT).substring(0, 12);
        setGeneratedCode(code);
    } catch (e) {
        console.error(e);
        alert("حدث خطأ. تأكد من أن رقم الجهاز صحيح (أحرف إنجليزية فقط).");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert("تم نسخ الكود!");
  };

  // الخروج والعودة للتطبيق مع تحديث الحالة فورياً
  const exitAdminMode = () => {
    window.location.hash = "";
    // إرسال حدث لتحديث المكونات الأخرى (مثل المودال)
    window.dispatchEvent(new Event('subscription-updated'));
  };

  const forceExpireTrial = () => {
    try {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 15);
        localStorage.setItem("trial_start_date", pastDate.toISOString());
        localStorage.removeItem("app_activated");
        localStorage.removeItem("activated_subjects");
        alert("تم إنهاء الفترة التجريبية.");
        exitAdminMode();
    } catch (e) {
        alert("تعذر تعديل البيانات.");
    }
  };

  const resetApp = () => {
    try {
        localStorage.clear();
        alert("تم تصفير التطبيق بالكامل.");
        exitAdminMode();
    } catch (e) {
        alert("تعذر مسح البيانات.");
    }
  };

  const activateVip = () => {
    try {
        localStorage.setItem("app_activated", "true");
        localStorage.setItem("activated_subjects", JSON.stringify(['FULL_BUNDLE']));
        alert("تم تفعيل هذا الجهاز VIP! 👑");
        exitAdminMode();
    } catch (e) {
        alert("تعذر التفعيل.");
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative" dir="rtl">
            <button 
                onClick={exitAdminMode}
                className="fixed top-6 left-6 z-50 bg-white text-slate-900 px-5 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 border-2 border-slate-200 hover:bg-slate-100 hover:scale-105 transition-all"
            >
                <Home size={20} /> الخروج للتطبيق
            </button>

            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md text-center relative overflow-hidden z-10">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="bg-slate-700/50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Lock className="text-indigo-400 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">منطقة المطورين</h1>
                <p className="text-slate-400 mb-8 text-sm font-medium">هذه المنطقة مخصصة لإدارة النظام فقط</p>
                
                <form onSubmit={handleLogin} className="space-y-4 mb-8">
                    <div className="relative group">
                        <KeyRound className="absolute top-3.5 right-4 text-slate-500 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                            type="password" 
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-600 font-bold tracking-widest text-center"
                            placeholder="••••"
                            autoFocus
                        />
                    </div>
                    {loginError && <p className="text-red-400 text-xs font-bold animate-pulse bg-red-900/20 p-2 rounded-lg">{loginError}</p>}
                    
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95">
                        دخول <ChevronRight size={18} className="rotate-180" />
                    </button>
                </form>

                <div className="border-t border-slate-700 pt-6">
                    <button 
                        onClick={exitAdminMode} 
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group border border-slate-600"
                    >
                        <Home size={20} className="text-slate-400 group-hover:text-white transition-colors" /> 
                        اضغط هنا للعودة للتطبيق (خروج)
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-mono" dir="rtl">
      
      <button 
        onClick={exitAdminMode}
        className="fixed top-6 left-6 z-50 bg-slate-800 text-white px-4 py-2 rounded-full border border-slate-600 hover:bg-red-600 hover:border-red-600 transition-all flex items-center gap-2 shadow-lg"
      >
         <LogOut size={18} /> خروج نهائي
      </button>

      <div className="max-w-2xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 relative">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-700 pb-6">
            <div className="bg-emerald-500/10 p-3 rounded-full">
              <ShieldCheck className="text-emerald-500 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">لوحة التحكم السرية</h1>
              <p className="text-slate-400 text-xs">Admin Code Generator</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">رقم جهاز الطالب (Device ID)</label>
              <input
                type="text"
                value={studentDeviceId}
                onChange={(e) => setStudentDeviceId(e.target.value)}
                placeholder="ID-XXXXXX"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-center"
                dir="ltr"
              />
            </div>
            <button onClick={generateCode} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-900/20">
              <RefreshCw size={18} /> توليد كود التفعيل
            </button>
            {generatedCode && (
              <div className="bg-slate-900 p-4 rounded-lg border border-emerald-500/50 text-center animate-in fade-in">
                <p className="text-xs text-slate-500 mb-2">كود التفعيل:</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <code className="text-2xl font-black text-emerald-400 tracking-wider">{generatedCode}</code>
                </div>
                <button onClick={copyToClipboard} className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto">
                  <Copy size={12} /> نسخ
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-xl border border-red-900/30 p-6 opacity-90 w-full">
            <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><AlertTriangle size={16} /> أدوات المطور</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">الحالة:</p>
                    <p className="font-bold text-white text-sm">{appStatus}</p>
                    <p className="text-[10px] text-slate-600 mt-1 font-mono truncate" dir="ltr">{myDeviceId}</p>
                </div>
                <div className="space-y-2">
                    <button onClick={activateVip} className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-3 rounded border border-amber-400 flex items-center justify-center gap-2 shadow-lg"><Crown size={14} /> تفعيل جهازي VIP</button>
                    <div className="flex gap-2">
                        <button onClick={forceExpireTrial} className="flex-1 bg-red-900/50 hover:bg-red-900/80 text-red-200 text-xs font-bold py-2 px-3 rounded border border-red-900/50 flex items-center justify-center gap-2"><Lock size={14} /> قفل</button>
                        <button onClick={resetApp} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-2 px-3 rounded border border-slate-600 flex items-center justify-center gap-2"><RotateCcw size={14} /> تصفير</button>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-2 text-center">
            <button onClick={exitAdminMode} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-900/50 flex items-center justify-center gap-2 text-lg hover:scale-[1.02]">
                <Home size={20} /> الخروج والعودة للتطبيق
            </button>
        </div>
      </div>
    </div>
  );
};
