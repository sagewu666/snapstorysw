
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, RefreshCw, Loader2, ArrowRight, Volume2, Mic, X, Star, Trash2, AlertCircle, ChevronLeft, Square, Play, RotateCw } from 'lucide-react';
import { LearnedWord, Theme } from '../types';
import { identifyObject, generateSpeech } from '../services/geminiService';
import { playClick, playSuccess, playError, playPop, playFanfare, playDelete, playPing, playToggle } from '../utils/soundUtils';
import { audioManager } from '../services/audioManager';

interface CameraQuestProps {
  targetCount: number;
  theme: Theme;
  onComplete: (words: LearnedWord[]) => void;
  onBack?: () => void;
}

export const CameraQuest: React.FC<CameraQuestProps> = ({ targetCount, theme, onComplete, onBack }) => {
  const [items, setItems] = useState<LearnedWord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewItem, setPreviewItem] = useState<LearnedWord | null>(null);
  const [validationError, setValidationError] = useState<{ feedback: string, image: string, title?: string } | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      return () => {
          if (userAudioUrl) URL.revokeObjectURL(userAudioUrl);
          stopRecordingStreams();
      };
  }, [previewItem]);

  const stopRecordingStreams = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // CRITICAL FIX: Resume AudioContext immediately on user interaction (file selection)
    // This ensures that when playAudio() is called later (async), the context is already running.
    audioManager.getAudioContext().resume().catch(() => {});

    const file = e.target.files?.[0];
    if (!file) return;

    // REMOVED: playShutter(); (Silent capture as requested)
    
    setIsProcessing(true);
    setValidationError(null);

    setUserAudioUrl(null);
    setIsRecording(false);
    setIsPlayingUserAudio(false);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const result = await identifyObject(base64, theme);
      
      if (!result.matchesTheme) {
          playError();
          setIsProcessing(false);
          setValidationError({
              title: "Not Quite!",
              feedback: result.feedback || `That doesn't look like ${theme.label}! Try again.`,
              image: base64
          });
          playAudio(result.feedback || `That is not ${theme.label}. Try again.`);
          return;
      }

      const isDuplicate = items.some(item => item.word.toLowerCase() === result.word.toLowerCase());

      if (isDuplicate) {
          playError();
          setIsProcessing(false);
          const duplicateMsg = `You already have a ${result.word}! Let's find a different ${theme.description}.`;
          setValidationError({
              title: "Already Collected!",
              feedback: duplicateMsg,
              image: base64
          });
          playAudio(`You already collected this card. Please snap a different ${theme.description}.`);
          return;
      }

      const newItem: LearnedWord = {
        id: Date.now().toString(),
        word: result.word,
        definition: result.definition,
        imageUrl: base64,
        originalImage: base64,
        timestamp: Date.now(),
        visualDetail: result.visualDetail
      };

      setItems(prev => [...prev, newItem]);
      setPreviewItem(newItem);
      setIsProcessing(false);
      
      // AUTO PLAY: "You found a [Word]!"
      playAudio(`You found a ${result.word}!`);
    };
    reader.readAsDataURL(file);
  };

  const triggerCamera = () => {
    playClick();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const playAudio = async (text: string) => {
    audioManager.speak(text);
  };

  const startRecording = async () => {
      try {
          audioManager.stopAll();
          if (userAudioElementRef.current) {
              userAudioElementRef.current.pause();
              setIsPlayingUserAudio(false);
          }

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

  const stopRecording = () => {
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
      if (playPromise !== undefined) {
          playPromise.catch(e => {
              console.error("Playback error", e);
              setIsPlayingUserAudio(false);
          });
      }
  };

  const deleteItem = (id: string) => {
      playDelete(); // DELETE SOUND
      setItems(prev => prev.filter(i => i.id !== id));
      if (previewItem?.id === id) {
          setPreviewItem(null);
          setUserAudioUrl(null);
          setIsRecording(false);
      }
  };

  const closePreview = () => {
      playSuccess(); // KEEP IT SOUND (Positive)
      setPreviewItem(null);
      setUserAudioUrl(null);
      setIsRecording(false);
  };

  const closeValidationError = () => {
      playClick();
      setValidationError(null);
  };

  if (items.length >= targetCount && !previewItem && !isProcessing && !validationError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-pop-in bg-slate-50 pt-[env(safe-area-inset-top)]">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Check size={48} strokeWidth={4} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Quest Complete!</h2>
        <p className="text-lg text-slate-500 mb-8">You found all {targetCount} items!</p>
        <button 
          onClick={() => { playFanfare(); onComplete(items); }}
          className="px-8 py-4 bg-brand-blue text-white rounded-full font-bold text-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3"
        >
          Create Story <ArrowRight />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      
      {/* Immersive Header */}
      <div className="flex justify-between items-center px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 shrink-0 bg-white border-b border-slate-100 z-10 shadow-sm">
        <div className="flex items-center gap-3 w-1/3">
             {onBack && (
                 <button onClick={() => { playClick(); onBack(); }} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                     <ChevronLeft size={24} />
                 </button>
             )}
        </div>
        <div className="flex flex-col items-center justify-center w-1/3">
             <div className="flex items-center gap-2">
                 <span className="text-2xl">{theme.icon}</span>
                 <h2 className="text-sm font-bold text-slate-800 leading-tight hidden md:block">{theme.label}</h2>
             </div>
        </div>
        <div className="flex justify-end w-1/3">
            <div className="bg-brand-orange/10 px-3 py-1 rounded-full whitespace-nowrap border border-brand-orange/20">
            <span className="text-lg font-black text-brand-orange">{items.length}</span>
            <span className="text-brand-orange/50 text-sm font-bold"> / {targetCount}</span>
            </div>
        </div>
      </div>

      {/* Main Camera Area */}
      <div className="flex-1 min-h-0 p-3 flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex-1 w-full bg-slate-200 rounded-[2rem] border-4 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden group active:bg-slate-300 transition-colors shadow-inner" onClick={triggerCamera}>
            <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            />

            {isProcessing ? (
            <div className="text-center z-10">
                <Loader2 size={48} className="animate-spin text-brand-blue mb-4 mx-auto" />
                <p className="text-lg font-bold text-slate-600 bg-white/80 px-4 py-1 rounded-full backdrop-blur-sm">Identifying...</p>
            </div>
            ) : (
            <div className="text-center cursor-pointer flex flex-col items-center pointer-events-none">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 text-brand-blue animate-pulse">
                     <Camera size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-600 tracking-tight">Tap to Snap</h3>
                <p className="text-slate-400 font-medium mt-1">Find: {theme.label}</p>
            </div>
            )}
        </div>
        
        {items.length > 0 && (
            <div className="h-20 mt-3 flex gap-2 overflow-x-auto px-1 shrink-0 scrollbar-hide items-center justify-center">
                {items.map((item) => (
                <div key={item.id} onClick={() => { playPop(); setPreviewItem(item); }} className="min-w-[60px] w-14 h-14 bg-white rounded-xl shadow-md border border-slate-100 relative animate-pop-in shrink-0 p-0.5 cursor-pointer">
                    <img src={item.imageUrl} alt={item.word} className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm border border-white">
                    <Check size={8} strokeWidth={4} />
                    </div>
                </div>
                ))}
            </div>
        )}
      </div>

      {/* --- VALIDATION ERROR MODAL --- */}
      {validationError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6 animate-shake">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl relative flex flex-col items-center p-8 text-center border-8 border-red-50">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500 shrink-0">
                    <AlertCircle size={40} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">{validationError.title || "Not Quite!"}</h2>
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg mb-6 rotate-2 bg-slate-100">
                    <img src={validationError.image} className="w-full h-full object-cover" alt="Captured item" />
                </div>
                <div className="bg-red-50 p-4 rounded-2xl w-full border border-red-100 mb-8">
                     <p className="text-red-600 font-bold text-xl leading-snug">"{validationError.feedback}"</p>
                </div>
                <button 
                    onClick={closeValidationError}
                    className="w-full py-4 bg-brand-orange text-white rounded-2xl font-bold text-xl shadow-[0_6px_0_0_#c2410c] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw size={24} /> Try Again
                </button>
            </div>
          </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewItem && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-pop-in">
           <div className="bg-white rounded-[2.5rem] w-full max-w-xs md:max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90dvh] border-8 border-white">
              
              <div className="h-56 bg-slate-100 relative shrink-0">
                  <img src={previewItem.imageUrl} className="w-full h-full object-cover" alt="Captured" />
                  <button 
                        onClick={() => { playClick(); playAudio(previewItem.word); }} 
                        className="absolute bottom-4 right-4 p-3 bg-brand-yellow rounded-full text-brand-blue shadow-lg hover:scale-110 transition-transform"
                    >
                        <Volume2 size={24} />
                    </button>
              </div>

              <div className="p-4 md:p-6 text-center flex flex-col items-center overflow-y-auto flex-1">
                  <h2 className="text-3xl font-black text-brand-blue capitalize mb-1 tracking-tight">{previewItem.word}</h2>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed mb-4 bg-slate-50 p-3 rounded-2xl w-full border border-slate-100">
                      "{previewItem.definition}"
                  </p>

                  <div className="bg-slate-100 rounded-2xl p-2 flex items-center gap-2 border border-slate-200 mb-4 w-full">
                        {isRecording ? (
                            <button 
                                onClick={stopRecording}
                                className="w-12 h-12 bg-red-500 text-white rounded-xl shadow-md flex items-center justify-center animate-pulse shrink-0"
                            >
                                <Square size={20} fill="currentColor" />
                            </button>
                        ) : (
                            <button 
                                onClick={startRecording}
                                className="w-12 h-12 bg-white text-red-500 border-2 border-red-100 rounded-xl shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
                            >
                                <Mic size={24} />
                            </button>
                        )}

                        <div className="flex-1 text-left pl-1 min-w-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Voice Studio</div>
                            <div className="text-slate-700 font-bold flex items-center gap-1 text-sm truncate">
                                {isRecording ? (
                                    <span className="text-red-500 animate-pulse">Recording...</span>
                                ) : isPlayingUserAudio ? (
                                    <span className="text-brand-blue flex items-center gap-1">
                                        <Volume2 size={14} className="animate-bounce" /> Playing...
                                    </span>
                                ) : userAudioUrl ? (
                                    <span className="text-green-600 flex items-center gap-1 truncate">
                                        <RotateCw size={12} /> Re-record
                                    </span>
                                ) : (
                                    "Tap Mic to Say it!"
                                )}
                            </div>
                        </div>

                        {userAudioUrl && !isRecording && (
                            <button 
                                onClick={() => { playClick(); playUserAudio(); }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                    isPlayingUserAudio 
                                    ? 'bg-brand-blue text-white shadow-inner' 
                                    : 'bg-blue-100 text-brand-blue hover:bg-blue-200'
                                }`}
                            >
                                {isPlayingUserAudio ? <Volume2 size={16} /> : <Play size={16} fill="currentColor" />}
                            </button>
                        )}
                  </div>

                  <div className="flex gap-3 w-full mt-auto">
                      <button 
                        onClick={() => deleteItem(previewItem.id)}
                        className="p-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-colors border border-red-100"
                      >
                         <Trash2 size={24} />
                      </button>
                      
                      <button 
                        onClick={closePreview}
                        className="flex-1 py-4 bg-brand-green text-white rounded-2xl font-bold text-xl shadow-[0_4px_0_0_#166534] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                      >
                        Keep It! <Check size={24} strokeWidth={3} />
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
