
import React, { useState, useEffect } from 'react';
import { GradeLevel, Subject } from './types';
import { SubjectGrid } from './components/SubjectGrid';
import { ChatInterface } from './components/ChatInterface';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminGenerator } from './components/AdminGenerator';
import { GraduationCap, Sparkles, ArrowRight, Printer, LockKeyhole } from 'lucide-react';
import { FloatingTools } from './components/FloatingTools';
import { TrialCountdown } from './components/TrialCountdown';

const App: React.FC = () => {
  const [grade, setGrade] = useState<GradeLevel | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = () => setIsAdmin(window.location.hash === '#admin');
    checkAdmin();
    window.addEventListener('hashchange', checkAdmin);
    return () => window.removeEventListener('hashchange', checkAdmin);
  }, []);

  if (isAdmin) return <AdminGenerator />;

  return (
    <div className="min-h-screen bg-slate-50">
      <TrialCountdown />
      <SubscriptionModal currentGrade={grade} />
      {grade && <FloatingTools />}

      {grade && subject ? (
        <ChatInterface grade={grade} subject={subject} onBack={() => setSubject(null)} />
      ) : grade ? (
        <div className="min-h-screen flex flex-col bg-white">
          <header className="glass px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => setGrade(null)}>
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                   <GraduationCap size={24} />
                </div>
                <div>
                   <h1 className="text-xl font-bold text-slate-800 leading-tight">نظام الثانوية الذكي</h1>
                   <p className="text-xs text-slate-500 font-medium">{grade}</p>
                </div>
             </div>
             <button onClick={() => window.print()} className="p-2.5 rounded-xl bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
                <Printer size={20} />
             </button>
          </header>
          <main className="flex-1 max-w-6xl mx-auto w-full p-6">
             <div className="mb-8 text-center md:text-right">
                <h2 className="text-3xl font-black text-slate-800 mb-2">ماذا سنذاكر اليوم؟ 📚</h2>
                <p className="text-slate-500 text-lg">اختر المادة لتبدأ رحلة التفوق</p>
             </div>
             <SubjectGrid grade={grade} onSelect={setSubject} />
          </main>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white">
          <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center z-10">
             <div className="text-center md:text-right space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm mb-4">
                   <Sparkles size={16} className="text-amber-500" />
                   <span className="text-sm font-bold text-slate-600">الذكاء الاصطناعي في خدمتك</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight">
                   مُعلمك <span className="text-indigo-600">الذكي</span> متاح 24/7
                </h1>
                <div className="flex gap-4 justify-center md:justify-start pt-4">
                   <button onClick={() => setGrade(GradeLevel.GRADE_12)} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                      ابدأ الآن <ArrowRight size={20} />
                   </button>
                </div>
             </div>
             <div className="space-y-4">
                {[
                  { id: GradeLevel.GRADE_10, title: 'الصف الأول الثانوي', desc: 'نظام 2026 الجديد', num: '1' },
                  { id: GradeLevel.GRADE_11, title: 'الصف الثاني الثانوي', desc: 'علمي وأدبي', num: '2' },
                  { id: GradeLevel.GRADE_12, title: 'الصف الثالث الثانوي', desc: 'عام التحديد والتفوق', num: '3' },
                ].map((item) => (
                   <button key={item.id} onClick={() => setGrade(item.id)} className="glass-card w-full p-4 rounded-2xl flex items-center gap-6 group text-right">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl">{item.num}</div>
                      <div>
                         <h3 className="text-xl font-bold text-slate-800">{item.title}</h3>
                         <p className="text-slate-500 font-medium">{item.desc}</p>
                      </div>
                      <div className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight size={24} /></div>
                   </button>
                ))}
             </div>
          </div>
          <div className="absolute bottom-4 left-0 w-full text-center">
             <button onClick={() => window.location.hash = '#admin'} className="text-slate-400 hover:text-slate-600 transition-colors"><LockKeyhole size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
