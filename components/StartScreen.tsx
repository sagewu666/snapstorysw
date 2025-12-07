
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { playClick, playFanfare } from '../utils/soundUtils';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const handleStart = () => {
    playClick();
    playFanfare();
    onStart();
  };

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex flex-col items-center justify-center relative overflow-hidden text-white p-6">
      {/* Background Animated Elements */}
      <div className="absolute top-10 left-10 text-white/20 animate-bounce-slow text-6xl">☁️</div>
      <div className="absolute bottom-20 right-10 text-white/20 animate-pulse text-6xl">✨</div>
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        
        {/* Logo Container */}
        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center mb-8 rotate-3 hover:rotate-6 transition-transform duration-500 border-4 border-white/50">
           <img 
             src="https://cdn-icons-png.flaticon.com/512/3069/3069172.png" 
             alt="Panda" 
             className="w-24 h-24 md:w-32 md:h-32 object-contain"
           />
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-md">
          Snap<span className="text-yellow-300">Story</span>
        </h1>
        <p className="text-xl md:text-2xl font-medium text-blue-100 mb-10 max-w-xs leading-relaxed">
          The magical world where 
          <br/>
          <span className="font-bold text-white">photos become stories!</span>
        </p>

        <button 
          onClick={handleStart}
          className="w-full py-5 bg-yellow-400 text-yellow-900 rounded-full font-black text-2xl shadow-[0_6px_0_0_#b45309] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-3 group"
        >
          <Sparkles className="group-hover:rotate-12 transition-transform" />
          START PLAYING
          <ArrowRight strokeWidth={4} />
        </button>

        <div className="mt-8 text-sm font-bold text-blue-200 uppercase tracking-widest opacity-80">
          For Kids Ages 3-12
        </div>
      </div>
    </div>
  );
};
