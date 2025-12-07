
import React, { useState, useEffect, useRef } from 'react';
import { LearnedWord, Story, WordMastery } from '../types';
import { Brain, Star, RotateCw, CheckCircle, XCircle, Volume2, Trophy, Dumbbell, Mic, Square, Play } from 'lucide-react';
import { playClick, playSuccess, playError, playPop } from '../utils/soundUtils';
import { audioManager } from '../services/audioManager';

interface WordMemoryGymProps {
  stories: Story[];
  mastery: WordMastery;
  onUpdateMastery: (wordId: string, success: boolean) => void;
}

export const WordMemoryGym: React.FC<WordMemoryGymProps> = ({ stories, mastery, onUpdateMastery }) => {
  const [mode, setMode] = useState<'menu' | 'quiz'>('menu');
  const [deck, setDeck] = useState<LearnedWord[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Extract unique words
  const allWords = React.useMemo(() => {
    const words: LearnedWord[] = [];
    const seen = new Set();
    stories.forEach(s => {
      if (s.learnedWords) {
        s.learnedWords.forEach(w => {
          if (!seen.has(w.id)) {
            words.push(w);
            seen.add(w.id);
          }
        });
      }
    });
    return words;
  }, [stories]);

  useEffect(() => {
      return () => {
          stopRecordingStreams();
          if (userAudioUrl) URL.revokeObjectURL(userAudioUrl);
      };
  }, [currentCardIndex]);

  const stopRecordingStreams = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
  };

  const startSession = () => {
    playClick();
    const shuffled = [...allWords].sort(() => 0.5 - Math.random());
    setDeck(shuffled.slice(0, 5));
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionScore(0);
    setMode('quiz');
    setUserAudioUrl(null);
    setIsRecording(false);
  };

  const handleFlip = () => {
    playPop();
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
        audioManager.speak(deck[currentCardIndex].word);
        setUserAudioUrl(null);
        setIsRecording(false);
    }
  };

  const handleResponse = (success: boolean) => {
    const word = deck[currentCardIndex];
    onUpdateMastery(word.id, success);
    if (success) {
        setSessionScore(prev => prev + 1);
        playSuccess();
    } else {
        playError();
    }

    if (currentCardIndex < deck.length - 1) {
      setTimeout(() => {
        setIsFlipped(false);
        setUserAudioUrl(null);
        setIsRecording(false);
        setCurrentCardIndex(prev => prev + 1);
      }, 500);
    } else {
      setMode('menu'); 
    }
  };

  // --- RECORDING ---
  const startRecording = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
          audioManager.stopAll();
          playClick();
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = () => {
              const mimeType = mediaRecorder.mimeType || '';
              const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
              const url = URL.createObjectURL(audioBlob);
              setUserAudioUrl(url);
              setTimeout(() => playUserAudio(url), 100);
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Mic error:", err);
          alert("Microphone access needed for recording.");
      }
  };

  const stopRecording = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (mediaRecorderRef.current && isRecording) {
          playPop();
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          stopRecordingStreams();
      }
  };

  const playUserAudio = (urlToPlay?: string) => {
      const url = urlToPlay || userAudioUrl;
      if (!url) return;

      audioManager.stopAll();

      if (userAudioElementRef.current) {
          userAudioElementRef.current.pause();
          userAudioElementRef.current = null;
      }

      const audio = new Audio(url);
      userAudioElementRef.current = audio;
      
      setIsPlayingUserAudio(true);
      audio.onended = () => setIsPlayingUserAudio(false);
      const playPromise = audio.play();
      if (playPromise) playPromise.catch(e => console.error(e));
  };


  if (allWords.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-60">
        <Dumbbell size={64} className="mb-4 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-400">Gym Closed</h2>
        <p className="text-slate-400">Go find some words first!</p>
      </div>
    );
  }

  if (mode === 'menu') {
    return (
      <div className="h-full flex flex-col p-6 md:p-12 overflow-y-auto scrollbar-hide">
        <div className="text-center mb-8 shrink-0">
          <h2 className="text-3xl md:text-4xl font-black text-brand-orange mb-2 flex items-center justify-center gap-3">
            <Brain size={40} /> Brain Dojo
          </h2>
          <p className="text-slate-500 font-medium text-lg">Train your brain and remember your words!</p>
        </div>

        {/* Start Button */}
        <div className="flex justify-center mb-10 shrink-0">
          <button 
            onClick={startSession}
            className="w-full max-w-sm aspect-video bg-gradient-to-br from-brand-orange to-red-400 rounded-[2.5rem] shadow-xl text-white flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform border-4 border-white/20"
          >
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm animate-bounce-slow">
              <Dumbbell size={48} />
            </div>
            <span className="text-3xl font-black">Start Training</span>
            <span className="text-white/80 font-bold bg-black/10 px-4 py-1 rounded-full">5 Word Quiz</span>
          </button>
        </div>

        {/* Mastery Grid */}
        <h3 className="text-xl font-bold text-slate-600 mb-4 flex items-center gap-2 shrink-0">
            <Trophy className="text-brand-yellow" /> Mastery Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {allWords.map(word => {
                const level = mastery[word.id]?.level || 0;
                return (
                    <div key={word.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <img src={word.imageUrl} className="w-16 h-16 rounded-xl object-cover bg-slate-100" alt={word.word} />
                        <div>
                            <p className="font-bold text-slate-700 capitalize">{word.word}</p>
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                        key={star} 
                                        size={14} 
                                        className={star <= level ? "fill-brand-yellow text-brand-yellow" : "text-slate-200"} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    );
  }

  // QUIZ MODE
  const currentCard = deck[currentCardIndex];

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
        {/* Fixed Progress Bar Top */}
        <div className="h-2 bg-slate-200 w-full shrink-0">
            <div 
                className="h-full bg-brand-orange transition-all duration-500" 
                style={{ width: `${((currentCardIndex) / deck.length) * 100}%` }}
            />
        </div>

        {/* SCROLLABLE AREA - Universal Compatibility */}
        {/* We use flex-1 to fill space, but allow overflow for small screens */}
        <div className="flex-1 overflow-y-auto w-full scrollbar-hide bg-slate-50">
            <div className="min-h-full w-full flex flex-col items-center justify-center py-8 px-4 pb-24">
                
                <div className="text-center mb-6 shrink-0">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-1 rounded-full border border-slate-200">
                        Card {currentCardIndex + 1} of {deck.length}
                    </h2>
                </div>

                {/* THE CARD (FIXED SIZE FLOATING MODE) */}
                {/* Fixed w-72 (288px) and h-96 (384px) ensures it never collapses on any screen */}
                <div 
                    className="group w-72 h-96 md:w-80 md:h-[28rem] perspective-1000 cursor-pointer relative shrink-0" 
                    onClick={!isFlipped ? handleFlip : undefined}
                >
                    <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                        
                        {/* FRONT (Image) */}
                        <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-xl border-8 border-white overflow-hidden flex flex-col" style={{ backfaceVisibility: 'hidden' }}>
                            <div className="flex-1 relative">
                                <img src={currentCard.imageUrl} alt="Guess" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
                                        <RotateCw size={18} className="text-slate-500" />
                                        <span className="font-bold text-slate-600 text-sm">Tap to Flip</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BACK (Answer) - Compact Layout */}
                        <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-xl border-8 border-brand-orange overflow-hidden flex flex-col rotate-y-180" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                            
                            {/* Top Content Area */}
                            <div className="flex-1 flex flex-col items-center justify-center p-3 text-center overflow-y-auto">
                                <h3 className="text-3xl font-black text-slate-800 capitalize mb-1 mt-2">{currentCard.word}</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-4 px-1 line-clamp-3">"{currentCard.definition}"</p>
                                
                                {/* Audio & Rec Row */}
                                <div className="flex items-center gap-3 mb-2 shrink-0" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => audioManager.speak(currentCard.word)} className="p-3 bg-brand-yellow/20 text-brand-orange rounded-full hover:scale-110 transition-transform">
                                        <Volume2 size={24} />
                                    </button>

                                    {/* RECORDING UI */}
                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200">
                                        {isRecording ? (
                                            <button onClick={stopRecording} className="w-10 h-10 bg-red-500 rounded-full text-white animate-pulse flex items-center justify-center shadow-md"><Square size={14} fill="currentColor" /></button>
                                        ) : (
                                            <button onClick={startRecording} className="w-10 h-10 bg-white rounded-full text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-50 shadow-sm"><Mic size={20} /></button>
                                        )}
                                        
                                        {userAudioUrl && !isRecording && (
                                            <button onClick={() => playUserAudio()} className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md ${isPlayingUserAudio ? 'bg-brand-blue' : 'bg-blue-300'}`}>
                                                {isPlayingUserAudio ? <Volume2 size={16} /> : <Play size={16} fill="currentColor" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wide shrink-0">
                                    {isRecording ? "Recording..." : userAudioUrl ? "Listen" : "Speak"}
                                </div>
                            </div>

                            {/* BUTTONS INSIDE CARD (Bottom) */}
                            <div className="bg-orange-50 p-3 border-t-2 border-orange-100 grid grid-cols-2 gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                <button 
                                    onClick={() => handleResponse(false)}
                                    className="flex flex-col items-center justify-center gap-1 py-3 bg-white border-2 border-red-100 rounded-xl text-red-400 font-bold hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all shadow-sm group"
                                >
                                    <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-xs">Retry</span>
                                </button>

                                <button 
                                    onClick={() => handleResponse(true)}
                                    className="flex flex-col items-center justify-center gap-1 py-3 bg-brand-green text-white rounded-xl font-bold shadow-md hover:bg-green-600 active:scale-95 transition-all group"
                                >
                                    <CheckCircle size={24} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-xs">Got it!</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
  );
};
