
import React, { useState } from 'react';
import { THEMES, SURPRISE_THEMES } from '../constants';
import { Theme, ThemeCategory } from '../types';
import { Sparkles, ArrowRight, Dna, Gift, Rocket } from 'lucide-react';
import { playClick, playSuccess, playPop } from '../utils/soundUtils';

interface ThemeSelectionProps {
  onSelectTheme: (theme: Theme, count: number) => void;
}

export const ThemeSelection: React.FC<ThemeSelectionProps> = ({ onSelectTheme }) => {
  const [wordCount, setWordCount] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<ThemeCategory>(ThemeCategory.COLOR);
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);
  const [randomTheme, setRandomTheme] = useState<Theme | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const categories = [
    { id: ThemeCategory.COLOR, label: 'Colors', icon: '🎨' },
    { id: ThemeCategory.SHAPE, label: 'Shapes', icon: '🔺' },
    { id: ThemeCategory.MATERIAL, label: 'Materials', icon: '🧱' },
    { id: ThemeCategory.SPACE, label: 'Places', icon: '🏠' },
    { id: ThemeCategory.FUNCTION, label: 'Fun', icon: '🎉' },
  ];

  const handleSurpriseMe = () => {
    playPop(); // Open Modal
    setShowSurpriseModal(true);
    setIsRolling(true);
    setRandomTheme(null);

    let shuffles = 0;
    const maxShuffles = 15;
    const allThemes = [...THEMES, ...SURPRISE_THEMES];
    
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * allThemes.length);
      setRandomTheme(allThemes[randomIdx]);
      // Removed tick sound for smoother experience
      shuffles++;
      if (shuffles >= maxShuffles) {
        clearInterval(interval);
        const finalTheme = Math.random() > 0.3 
            ? SURPRISE_THEMES[Math.floor(Math.random() * SURPRISE_THEMES.length)]
            : THEMES[Math.floor(Math.random() * THEMES.length)];
            
        setRandomTheme(finalTheme);
        setIsRolling(false);
        playSuccess(); // Tada!
      }
    }, 100);
  };

  const confirmSurprise = () => {
    if (randomTheme) {
      playPop(); // Confirm and Go
      onSelectTheme(randomTheme, wordCount);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      
      {/* Header Area */}
      <div className="px-3 pt-3 pb-2 md:px-6 md:pt-6 shrink-0 bg-white border-b border-slate-100 z-10 flex flex-col gap-4">
          
          <div className="flex flex-col items-center justify-center gap-3">
             <h2 className="text-xl md:text-3xl font-black text-brand-blue flex items-center gap-2">
                 <Rocket size={24} className="text-brand-orange" strokeWidth={3} />
                 Today's Mission
             </h2>
             
             {/* Centered, Bigger Word Count Selector */}
             <div className="flex bg-slate-100 p-1.5 rounded-full shadow-inner">
                {[3, 5, 7].map(num => (
                  <button
                    key={num}
                    onClick={() => { setWordCount(num); }} // Removed sound
                    className={`px-4 py-2 rounded-full font-bold text-sm md:text-base transition-all flex items-center gap-1 ${
                      wordCount === num 
                        ? 'bg-white text-brand-blue shadow-sm ring-1 ring-slate-200 scale-105' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {num} Items
                  </button>
                ))}
              </div>
          </div>

          {/* Compact Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 md:justify-center">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveTab(cat.id); }} // Removed sound
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                  activeTab === cat.id 
                    ? 'bg-brand-blue text-white border-brand-blue shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm md:text-base">{cat.icon}</span>
                <span className="text-xs md:text-sm font-bold">{cat.label}</span>
              </button>
            ))}
          </div>
      </div>

      {/* Main Content: Theme Grid */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 scrollbar-hide relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-20">
              {THEMES.filter(t => t.category === activeTab).map(theme => (
                  <button
                      key={theme.id}
                      onClick={() => { playPop(); onSelectTheme(theme, wordCount); }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-brand-yellow hover:shadow-md transition-all text-left flex items-center gap-4 group relative overflow-hidden"
                  >
                      {/* Icon Box */}
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl ${theme.color} bg-opacity-10 flex items-center justify-center text-3xl md:text-4xl shrink-0 group-hover:scale-110 transition-transform`}>
                          {theme.icon}
                      </div>
                      
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-black text-slate-800 leading-tight mb-0.5 truncate group-hover:text-brand-blue transition-colors">
                              {theme.label}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium leading-tight line-clamp-2">
                              Find {wordCount} {theme.description}!
                          </p>
                      </div>
                      
                      {/* Arrow */}
                      <div className="text-slate-200 group-hover:text-brand-blue group-hover:translate-x-1 transition-all">
                          <ArrowRight size={20} />
                      </div>
                  </button>
              ))}
          </div>
      </div>

      {/* Floating Surprise Button */}
      <div className="absolute bottom-4 right-4 z-30 md:bottom-6 md:right-6">
           <button 
              onClick={handleSurpriseMe} 
              className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-brand-purple to-pink-500 rounded-full shadow-lg shadow-purple-200 flex items-center justify-center text-white animate-bounce-slow border-2 border-white hover:scale-105 active:scale-95 transition-transform"
            >
              <Gift size={24} className="md:w-8 md:h-8" />
           </button>
      </div>

      {/* Surprise Modal Overlay */}
      {showSurpriseModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-1 w-full max-w-sm shadow-2xl animate-pop-in relative">
                <div className="bg-slate-50 p-6 rounded-[1.8rem] border border-slate-100 flex flex-col items-center text-center">
                    
                    <button className="absolute top-4 right-4 p-2 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300" onClick={() => { playClick(); setShowSurpriseModal(false); }}>✕</button>

                    <h3 className="text-lg font-black text-brand-purple mb-4 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={20} className="text-brand-yellow fill-current" /> Mystery Quest
                    </h3>
                    
                    {randomTheme ? (
                        <div className={`w-full p-6 rounded-2xl mb-6 bg-white border-2 border-dashed border-slate-200 shadow-sm relative overflow-hidden`}>
                            {isRolling && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-brand-blue" /></div>}
                            <div className="text-6xl mb-3 drop-shadow-sm">{randomTheme.icon}</div>
                            <h2 className="text-2xl font-black text-slate-800 mb-1">{randomTheme.label}</h2>
                            <p className="text-sm text-slate-500 font-medium leading-tight">Find {wordCount} {randomTheme.description}!</p>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center">
                            <Dna className="animate-spin text-brand-blue" size={48} />
                        </div>
                    )}

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={handleSurpriseMe}
                            disabled={isRolling}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 bg-slate-100 transition-colors text-sm"
                        >
                            Spin Again
                        </button>
                        <button 
                            onClick={confirmSurprise}
                            disabled={isRolling}
                            className="flex-[2] py-3 bg-brand-green text-white rounded-xl font-bold text-lg shadow-[0_4px_0_0_#15803d] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            Let's Go!
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
