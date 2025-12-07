
import React, { useState } from 'react';
import { User, BookOpen, ArrowRight, Baby, GraduationCap, School } from 'lucide-react';
import { KidProfile } from '../types';
import { playClick } from '../utils/soundUtils';

interface KidProfileSelectorProps {
  onComplete: (profile: KidProfile) => void;
}

export const KidProfileSelector: React.FC<KidProfileSelectorProps> = ({ onComplete }) => {
  const [ageGroup, setAgeGroup] = useState<KidProfile['ageGroup']>('6-8');
  const [englishLevel, setEnglishLevel] = useState<KidProfile['englishLevel']>('Intermediate');

  const ages: { val: KidProfile['ageGroup']; label: string; icon: React.ReactNode }[] = [
    { val: '3-5', label: '3-5', icon: <Baby size={24} /> },
    { val: '6-8', label: '6-8', icon: <School size={24} /> },
    { val: '9-12', label: '9-12', icon: <GraduationCap size={24} /> },
  ];

  const levels: { val: KidProfile['englishLevel']; label: string; desc: string; color: string }[] = [
    { val: 'Beginner', label: 'Beginner', desc: 'Simple words', color: 'bg-green-100 border-green-200 text-green-700' },
    { val: 'Intermediate', label: 'Intermediate', desc: 'I can read', color: 'bg-blue-100 border-blue-200 text-blue-700' },
    { val: 'Advanced', label: 'Advanced', desc: 'Book lover', color: 'bg-purple-100 border-purple-200 text-purple-700' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide bg-slate-50">
      <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 animate-pop-in pb-8">
        
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-2xl font-black text-slate-800 mb-1">About You</h2>
          <p className="text-sm text-slate-500">Let's set up your profile!</p>
        </div>

        <div className="w-full max-w-sm space-y-6 mb-8">
          {/* Age Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <User size={14} /> Age
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {ages.map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => { playClick(); setAgeGroup(opt.val); }}
                  className={`py-3 px-1 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    ageGroup === opt.val
                      ? 'border-brand-orange bg-white text-brand-orange shadow-md scale-[1.02]'
                      : 'border-transparent bg-white text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className={ageGroup === opt.val ? 'animate-bounce-slow' : ''}>{opt.icon}</div>
                  <span className="font-bold text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Level Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <BookOpen size={14} /> Level
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {levels.map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => { playClick(); setEnglishLevel(opt.val); }}
                  className={`p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                    englishLevel === opt.val
                      ? `${opt.color.replace('bg-', 'bg-opacity-20 ')} border-current shadow-sm`
                      : 'bg-white border-transparent text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                      englishLevel === opt.val ? 'border-current bg-current' : 'border-slate-300'
                  }`} />
                  <div>
                      <span className={`block font-bold text-base leading-none mb-0.5 ${englishLevel === opt.val ? 'text-slate-800' : 'text-slate-500'}`}>{opt.label}</span>
                      <span className="text-xs opacity-70 font-medium">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => { playClick(); onComplete({ ageGroup, englishLevel }); }}
          className="w-full max-w-xs py-4 bg-brand-blue text-white rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 animate-pop-in shrink-0 touch-manipulation"
        >
          Start <ArrowRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
