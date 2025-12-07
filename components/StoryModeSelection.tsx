
import React, { useState } from 'react';
import { Sparkles, Pencil, ArrowRight } from 'lucide-react';
import { Theme } from '../types';
import { playClick, playSuccess } from '../utils/soundUtils';

interface StoryModeSelectionProps {
  theme: Theme;
  onSelectMode: (userPrompt: string | undefined) => void;
}

export const StoryModeSelection: React.FC<StoryModeSelectionProps> = ({ theme, onSelectMode }) => {
  const [mode, setMode] = useState<'auto' | 'manual' | null>(null);
  const [userText, setUserText] = useState('');

  const handleStart = () => {
    playSuccess();
    if (mode === 'auto') {
      onSelectMode(undefined);
    } else {
      onSelectMode(userText);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide">
      <div className="min-h-full flex flex-col items-center p-4 md:p-12 animate-pop-in pb-32">
        <div className="text-center mb-6 md:mb-10 shrink-0 mt-4">
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-2">Who is the Author?</h2>
          <p className="text-base md:text-xl text-slate-500">How do you want to create your story?</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-4xl mb-6 md:mb-10 flex-shrink-0">
          {/* Auto Mode Card */}
          <button
            onClick={() => { playClick(); setMode('auto'); }}
            className={`flex-1 p-4 md:p-8 rounded-2xl md:rounded-3xl border-4 text-left transition-all relative overflow-hidden group flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 ${
              mode === 'auto'
                ? 'border-brand-blue bg-blue-50 shadow-xl scale-[1.02]'
                : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg'
            }`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 hidden md:block">
              <Sparkles size={120} className="text-brand-blue" />
            </div>
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl md:mb-6 transition-colors shrink-0 ${
               mode === 'auto' ? 'bg-brand-blue text-white' : 'bg-blue-100 text-brand-blue'
            }`}>
              ✨
            </div>
            <div>
                <h3 className="text-lg md:text-2xl font-bold text-slate-800 mb-1 md:mb-2">Magic Story</h3>
                <p className="text-sm md:text-base text-slate-500 font-medium leading-tight">Let AI write a surprise story for you using your items!</p>
            </div>
          </button>

          {/* Manual Mode Card */}
          <button
            onClick={() => { playClick(); setMode('manual'); }}
            className={`flex-1 p-4 md:p-8 rounded-2xl md:rounded-3xl border-4 text-left transition-all relative overflow-hidden group flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 ${
              mode === 'manual'
                ? 'border-brand-purple bg-purple-50 shadow-xl scale-[1.02]'
                : 'border-slate-100 bg-white hover:border-purple-200 hover:shadow-lg'
            }`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 hidden md:block">
              <Pencil size={120} className="text-brand-purple" />
            </div>
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl md:mb-6 transition-colors shrink-0 ${
               mode === 'manual' ? 'bg-brand-purple text-white' : 'bg-purple-100 text-brand-purple'
            }`}>
              ✏️
            </div>
            <div>
                <h3 className="text-lg md:text-2xl font-bold text-slate-800 mb-1 md:mb-2">Co-Writer</h3>
                <p className="text-sm md:text-base text-slate-500 font-medium leading-tight">You write an idea, and AI will finish the story for you.</p>
            </div>
          </button>
        </div>

        {/* Manual Input Area */}
        {mode === 'manual' && (
          <div className="w-full max-w-2xl bg-white p-4 md:p-6 rounded-3xl shadow-sm border-2 border-brand-purple/30 animate-pop-in mb-6 flex-shrink-0">
            <label className="block text-slate-600 font-bold mb-2 ml-2 text-sm md:text-base">Start your story here:</label>
            <textarea
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="e.g., The banana wanted to fly to the moon..."
              className="w-full h-24 md:h-32 p-3 md:p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-purple-100 focus:border-brand-purple outline-none text-base md:text-lg resize-none"
            />
          </div>
        )}

        {/* Action Button */}
        {mode && (
          <div className="w-full flex justify-center mt-auto animate-pop-in">
              <button
                onClick={handleStart}
                disabled={mode === 'manual' && userText.trim().length < 3}
                className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 bg-brand-green text-white rounded-full font-bold text-xl md:text-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 touch-manipulation"
              >
                Create Story <ArrowRight strokeWidth={3} />
              </button>
          </div>
        )}
      </div>
    </div>
  );
};
