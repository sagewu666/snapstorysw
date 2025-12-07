
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Story, LearnedWord } from '../types';
import { Search, Volume2, X, Grid, Filter, Mic, Square, Play, RotateCw } from 'lucide-react';
import { audioManager } from '../services/audioManager';
import { playClick, playPop, playBubble, playPing, playDelete } from '../utils/soundUtils';

interface VocabularyListProps {
  stories: Story[];
}

export const VocabularyList: React.FC<VocabularyListProps> = ({ stories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<LearnedWord | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Extract unique words from all stories
  const allWords = useMemo(() => {
    const uniqueWords: LearnedWord[] = [];
    const seenIds = new Set();
    
    stories.forEach(story => {
      if (story.learnedWords) {
        story.learnedWords.forEach(word => {
          // Deduplicate based on word ID or text
          if (!seenIds.has(word.word.toLowerCase())) {
            uniqueWords.push(word);
            seenIds.add(word.word.toLowerCase());
          }
        });
      }
    });
    // Sort alphabetically
    return uniqueWords.sort((a, b) => a.word.localeCompare(b.word));
  }, [stories]);

  const filteredWords = allWords.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cleanup on unmount or modal close
  useEffect(() => {
      return () => {
          if (userAudioUrl) {
              URL.revokeObjectURL(userAudioUrl);
          }
          stopRecordingStreams();
      };
  }, [selectedCard]); // Reset when card changes

  const stopRecordingStreams = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
  };

  const handlePlayAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    // REMOVED PLAYTOGGLE SOUND HERE
    audioManager.speak(text); // High quality voice
  };

  const handleCardClick = (word: LearnedWord) => {
      playPop(); // OPEN CARD
      setSelectedCard(word);
      // Reset recording state
      setUserAudioUrl(null);
      setIsRecording(false);
      setIsPlayingUserAudio(false);
      audioManager.speak(word.word);
  };

  const handleCloseCard = () => {
      playClick(); // CLOSE CARD
      setSelectedCard(null);
      // Explicitly reset audio on close
      setUserAudioUrl(null);
      setIsRecording(false);
      setIsPlayingUserAudio(false);
  };

  // --- RECORDING LOGIC ---

  const startRecording = async () => {
      try {
          audioManager.stopAll(); // Silence AI voice
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
              // Robust blob creation
              const mimeType = mediaRecorder.mimeType || '';
              const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
              const url = URL.createObjectURL(audioBlob);
              setUserAudioUrl(url);
              
              // AUTO PLAYBACK
              setTimeout(() => playUserAudio(url), 100);
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Error accessing microphone:", err);
          alert("We need microphone permission to record your voice!");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          playPing();
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          stopRecordingStreams();
      }
  };

  const playUserAudio = (urlToPlay?: string) => {
      const url = urlToPlay || userAudioUrl;
      if (!url) return;
      
      // Removed PlayToggle
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
              console.error("User Audio Playback Error", e);
              setIsPlayingUserAudio(false);
          });
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 bg-white border-b border-slate-100 flex flex-col gap-4 shrink-0 shadow-sm z-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-brand-blue flex items-center gap-3">
                        <div className="w-12 h-12 bg-pink-100 rounded-2xl rotate-3 flex items-center justify-center text-pink-500 shadow-sm border-2 border-pink-200">
                            <Grid size={28} strokeWidth={3} />
                        </div>
                        Word Cards
                    </h2>
                    <p className="text-slate-500 font-medium pl-1">Your collection: {allWords.length} words</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search your words..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-blue focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-slate-600 placeholder:text-slate-400"
                />
            </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 scrollbar-hide">
            {allWords.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-center opacity-60 mt-10">
                    <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                        <Filter size={40} className="text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-400 mb-2">No words yet!</h3>
                    <p className="text-slate-400 max-w-xs mx-auto">Start a new story to find objects and build your collection.</p>
                 </div>
            ) : filteredWords.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold">
                    No words match "{searchTerm}"
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                    {filteredWords.map((word) => (
                        <button 
                            key={word.id}
                            onClick={() => handleCardClick(word)}
                            className="bg-white rounded-2xl shadow-sm border-b-4 border-slate-100 hover:border-brand-blue hover:-translate-y-1 hover:shadow-lg transition-all group overflow-hidden flex flex-col"
                        >
                            <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                                <img src={word.imageUrl} alt={word.word} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div 
                                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-brand-blue hover:text-white"
                                    onClick={(e) => handlePlayAudio(e, word.word)}
                                >
                                    <Volume2 size={16} />
                                </div>
                            </div>
                            <div className="p-3 w-full text-center bg-white">
                                <h3 className="font-black text-slate-700 capitalize text-lg truncate">{word.word}</h3>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Detail Modal - High Z-Index */}
        {selectedCard && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-pop-in">
                <div className="bg-white rounded-[2.5rem] w-full max-w-sm md:max-w-md shadow-2xl relative border-8 border-white overflow-hidden flex flex-col max-h-[90dvh]">
                    
                    {/* Close Button */}
                    <button 
                        onClick={handleCloseCard}
                        className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Image Area */}
                    <div className="h-56 md:h-72 bg-slate-100 shrink-0 relative">
                        <img src={selectedCard.imageUrl} className="w-full h-full object-cover" alt={selectedCard.word} />
                        
                        {/* Word Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
                             <h2 className="text-4xl font-black text-white capitalize tracking-tight drop-shadow-md">{selectedCard.word}</h2>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 md:p-8 text-center flex-1 overflow-y-auto bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:16px_16px]">
                        
                        {/* Definition Bubble */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 inline-block w-full">
                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-1">Definition</p>
                            <p className="text-slate-700 font-medium text-lg leading-relaxed">"{selectedCard.definition}"</p>
                        </div>

                        {/* --- ACTIONS CONTAINER --- */}
                        <div className="space-y-3">
                            {/* 1. Official Audio Button */}
                            <button 
                                onClick={(e) => handlePlayAudio(e, selectedCard.word)}
                                className="w-full py-3 bg-brand-orange text-white rounded-2xl font-bold text-lg shadow-[0_4px_0_0_#c2410c] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 hover:brightness-110"
                            >
                                <Volume2 size={24} /> Listen
                            </button>

                            {/* 2. Recording Area */}
                            <div className="bg-slate-100 rounded-2xl p-2 flex items-center gap-2 border border-slate-200 mt-4">
                                
                                {isRecording ? (
                                    <button 
                                        onClick={stopRecording}
                                        className="w-14 h-14 bg-red-500 text-white rounded-xl shadow-md flex items-center justify-center animate-pulse"
                                    >
                                        <Square size={24} fill="currentColor" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={startRecording}
                                        className="w-14 h-14 bg-white text-red-500 border-2 border-red-100 rounded-xl shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
                                    >
                                        <Mic size={28} />
                                    </button>
                                )}

                                <div className="flex-1 text-left pl-2">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-0.5">Voice Studio</div>
                                    <div className="text-slate-700 font-bold flex items-center gap-2 h-6">
                                        {isRecording ? (
                                            <span className="text-red-500 animate-pulse">Recording...</span>
                                        ) : isPlayingUserAudio ? (
                                            <span className="text-brand-blue flex items-center gap-1">
                                                <Volume2 size={16} className="animate-bounce" /> Playing...
                                            </span>
                                        ) : userAudioUrl ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <RotateCw size={14} /> Re-record
                                            </span>
                                        ) : (
                                            "Tap Mic to Say it!"
                                        )}
                                    </div>
                                </div>

                                {/* Replay Button (Only if recorded) */}
                                {userAudioUrl && !isRecording && (
                                    <button 
                                        onClick={() => playUserAudio()}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                            isPlayingUserAudio 
                                            ? 'bg-brand-blue text-white shadow-inner' 
                                            : 'bg-blue-100 text-brand-blue hover:bg-blue-200'
                                        }`}
                                    >
                                        {isPlayingUserAudio ? <Volume2 size={20} /> : <Play size={20} fill="currentColor" />}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
