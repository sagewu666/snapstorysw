
import React, { useState, useEffect } from 'react';
import { LearnedWord } from '../types';
import { CheckCircle, XCircle, Volume2, Trophy, ArrowRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playClick, playSuccess, playError, playFanfare, playPop } from '../utils/soundUtils';
import { audioManager } from '../services/audioManager';

interface StoryQuizProps {
  words: LearnedWord[];
  onComplete: () => void;
}

export const StoryQuiz: React.FC<StoryQuizProps> = ({ words, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // The current target word to find
  const currentTarget = words[currentIndex];

  useEffect(() => {
    // Play audio when question appears (High Quality)
    if (!showSuccess) {
        audioManager.speak(`Where is the ${currentTarget.word}?`);
    }
  }, [currentIndex, showSuccess, currentTarget]);

  const handleSelect = (wordId: string) => {
    if (isCorrect === true) return; // Prevent clicking after success

    setSelectedAnswer(wordId);
    
    if (wordId === currentTarget.id) {
        // Correct!
        setIsCorrect(true);
        playSuccess(); // Sound Effect
        audioManager.speak("That's right!"); // Friendly Voice
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            disableForReducedMotion: true
        });

        // Delay to go to next or finish
        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
            } else {
                playFanfare(); // Sound
                setShowSuccess(true);
                audioManager.speak("Excellent work! You found all the words!");
            }
        }, 2000);

    } else {
        // Incorrect
        setIsCorrect(false);
        playError(); // Sound Effect
        audioManager.speak("Oops, try again!"); // Friendly Voice
        setTimeout(() => {
            setSelectedAnswer(null);
            setIsCorrect(null);
        }, 1200);
    }
  };

  if (showSuccess) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 animate-pop-in text-center">
              <div className="w-32 h-32 bg-brand-yellow rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce-slow">
                  <Trophy size={64} className="text-brand-orange" />
              </div>
              <h2 className="text-4xl font-black text-brand-blue mb-4">Quiz Passed!</h2>
              <p className="text-xl text-slate-500 mb-8 max-w-md">
                  You know all the words from your story. You are a true Word Master!
              </p>
              <button 
                  onClick={() => { playClick(); onComplete(); }}
                  className="px-12 py-5 bg-brand-green text-white rounded-full font-bold text-2xl shadow-[0_8px_20px_rgba(22,163,74,0.4)] hover:scale-105 transition-all flex items-center gap-3"
              >
                  Collect Badge & Save <ArrowRight strokeWidth={3} />
              </button>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-2 bg-slate-200 w-full shrink-0">
            <div 
                className="h-full bg-brand-blue transition-all duration-500" 
                style={{ width: `${(currentIndex / words.length) * 100}%` }}
            />
        </div>

        {/* Header Question */}
        <div className="p-6 md:p-8 text-center shrink-0">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 mb-4">
                <HelpCircle size={16} className="text-brand-purple" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Question {currentIndex + 1} of {words.length}
                </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-2">
                Where is <span className="text-brand-blue underline decoration-brand-yellow decoration-4 underline-offset-4">{currentTarget.word}</span>?
            </h2>
            
            <button 
                onClick={() => { playClick(); audioManager.speak(currentTarget.word); }}
                className="mt-2 p-3 bg-brand-orange text-white rounded-full shadow-md hover:scale-110 transition-transform"
            >
                <Volume2 size={24} />
            </button>
        </div>

        {/* Image Grid Options */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto pb-8">
                {words.map((option) => {
                    // Logic to determine visual state
                    const isSelected = selectedAnswer === option.id;
                    const isWrong = isSelected && isCorrect === false;
                    const isRight = isSelected && isCorrect === true;

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleSelect(option.id)}
                            disabled={isCorrect === true} // Disable all when answer is revealed
                            className={`relative aspect-square rounded-3xl overflow-hidden border-4 shadow-sm transition-all duration-300 transform 
                                ${isRight ? 'border-brand-green ring-4 ring-green-100 scale-105 z-10' : ''}
                                ${isWrong ? 'border-red-400 animate-pulse' : ''}
                                ${!isSelected && !isRight ? 'border-white hover:border-brand-blue hover:shadow-xl hover:-translate-y-1' : ''}
                            `}
                        >
                            <img 
                                src={option.imageUrl} 
                                alt="Option" 
                                className={`w-full h-full object-cover transition-all ${isRight ? 'brightness-110' : ''}`} 
                            />
                            
                            {/* Overlay Feedback Icons */}
                            {isRight && (
                                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center animate-pop-in">
                                    <CheckCircle size={64} className="text-white drop-shadow-md" />
                                </div>
                            )}
                            {isWrong && (
                                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                    <XCircle size={64} className="text-white drop-shadow-md" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
