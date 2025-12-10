
import React, { useEffect, useState } from 'react';
import { Subject, GradeLevel } from '../types';
import { 
  BookOpen, Calculator, FlaskConical, Globe, Languages, Microscope, Atom, 
  Scale, BrainCircuit, Activity, BookType, Dna, ScrollText, Flag, Lock
} from 'lucide-react';

interface SubjectGridProps {
  grade: GradeLevel;
  onSelect: (subject: Subject) => void;
}

const subjectIcons: Partial<Record<Subject, React.ReactNode>> = {
  [Subject.ARABIC]: <BookType className="w-8 h-8 text-emerald-600" />,
  [Subject.ENGLISH]: <Languages className="w-8 h-8 text-blue-600" />,
  [Subject.FRENCH]: <span className="text-2xl font-black text-indigo-600">Fr</span>,
  [Subject.GERMAN]: <span className="text-2xl font-black text-amber-600">De</span>,
  [Subject.INTEGRATED_SCIENCES]: <Dna className="w-8 h-8 text-teal-600" />,
  [Subject.PHYSICS]: <Atom className="w-8 h-8 text-violet-600" />,
  [Subject.CHEMISTRY]: <FlaskConical className="w-8 h-8 text-pink-600" />,
  [Subject.BIOLOGY]: <Microscope className="w-8 h-8 text-green-600" />,
  [Subject.MATH]: <Calculator className="w-8 h-8 text-red-600" />,
  [Subject.HISTORY]: <BookOpen className="w-8 h-8 text-amber-700" />,
  [Subject.GEOGRAPHY]: <Globe className="w-8 h-8 text-cyan-600" />,
  [Subject.PHILOSOPHY]: <Scale className="w-8 h-8 text-teal-700" />,
  [Subject.PSYCHOLOGY]: <BrainCircuit className="w-8 h-8 text-fuchsia-600" />,
  [Subject.GEOLOGY]: <Activity className="w-8 h-8 text-orange-600" />,
  [Subject.RELIGION]: <ScrollText className="w-8 h-8 text-emerald-800" />,
  [Subject.NATIONAL_EDUCATION]: <Flag className="w-8 h-8 text-red-800" />,
};

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

export const SubjectGrid: React.FC<SubjectGridProps> = ({ grade, onSelect }) => {
  const displayedSubjects = SUBJECTS_BY_GRADE[grade] || [];
  const [unlockedSubjects, setUnlockedSubjects] = useState<string[]>([]);
  const [isTrial, setIsTrial] = useState(true);

  // دالة آمنة لقراءة البيانات (Prevent Uncaught Errors)
  const loadPermissions = () => {
    try {
        const trialStartStr = localStorage.getItem('trial_start_date');
        if (trialStartStr) {
            const start = new Date(trialStartStr);
            const now = new Date();
            const diff = now.getTime() - start.getTime();
            const days = diff / (1000 * 60 * 60 * 24);
            const trialActive = days < 14;
            setIsTrial(trialActive);
            
            // قراءة آمنة مع معالجة الأخطاء
            let activated: string[] = [];
            try {
                activated = JSON.parse(localStorage.getItem('activated_subjects') || '[]');
            } catch {
                activated = [];
            }

            if (localStorage.getItem('app_activated') === 'true') {
                 activated.push('FULL_BUNDLE');
            }
            setUnlockedSubjects(activated);
        }
    } catch (e) {
        console.error("Permission Load Error", e);
    }
  };

  useEffect(() => {
    loadPermissions();
    
    // الاستماع للتحديثات الفورية
    const handleUpdate = () => loadPermissions();
    window.addEventListener('subscription-updated', handleUpdate);
    
    return () => window.removeEventListener('subscription-updated', handleUpdate);
  }, []);

  const isLocked = (subject: Subject) => {
      if (isTrial) return false;
      if (unlockedSubjects.includes('FULL_BUNDLE')) return false;
      if (unlockedSubjects.includes(subject)) return false;
      return true;
  };

  const handleSubjectClick = (subject: Subject) => {
      if (isLocked(subject)) {
          // بدلاً من التنبيه وإعادة التحميل، نفتح نافذة الاشتراك مباشرة
          alert("🔒 هذا المحتوى مغلق. يرجى الاشتراك.");
          window.dispatchEvent(new Event('open-subscription-modal'));
          return;
      }
      onSelect(subject);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {displayedSubjects.map((subject) => {
        const locked = isLocked(subject);
        return (
            <button
            key={subject}
            onClick={() => handleSubjectClick(subject)}
            className={`glass-card p-6 rounded-2xl flex flex-col items-center justify-center gap-4 group text-center h-40 relative overflow-hidden transition-all duration-300 ${
                locked ? 'grayscale opacity-70 cursor-not-allowed hover:shadow-none' : 'hover:scale-105'
            }`}
            >
            {!locked && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            
            {locked && (
                <div className="absolute top-2 right-2 bg-slate-200 p-1.5 rounded-full z-10">
                    <Lock size={14} className="text-slate-500" />
                </div>
            )}

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                locked ? 'bg-slate-100' : 'bg-slate-50 border border-slate-100 group-hover:bg-white'
            }`}>
                {subjectIcons[subject]}
            </div>
            
            <span className={`text-base font-bold transition-colors ${
                locked ? 'text-slate-400' : 'text-slate-700 group-hover:text-indigo-700'
            }`}>
                {subject}
            </span>
            </button>
        );
      })}
    </div>
  );
};
