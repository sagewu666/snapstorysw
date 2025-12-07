import React, { useState, useMemo } from 'react';
import { Story, LearnedWord, Badge } from '../types';
import { BADGES } from '../constants';
import { Grid, Award, Lock, Zap, Map as MapIcon, Search } from 'lucide-react';
import { playClick } from '../utils/soundUtils';

interface ExplorerPassportProps {
  stories: Story[];
}

export const ExplorerPassport: React.FC<ExplorerPassportProps> = ({ stories }) => {
  const [activeTab, setActiveTab] = useState<'stickers' | 'badges'>('stickers');

  // Aggregate all words from all stories
  const allStickers = useMemo(() => {
    const stickers: LearnedWord[] = [];
    const seenIds = new Set();
    
    stories.forEach(story => {
      if (story.learnedWords) {
        story.learnedWords.forEach(word => {
            if (!seenIds.has(word.id)) {
                stickers.push(word);
                seenIds.add(word.id);
            }
        });
      }
    });
    // Reverse to show newest first
    return stickers.reverse();
  }, [stories]);

  const earnedBadges = useMemo(() => {
    return BADGES.filter(badge => badge.condition(stories, allStickers.length));
  }, [stories, allStickers]);

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-white border-b-4 border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm z-10">
            <div>
                <h2 className="text-3xl md:text-4xl font-black text-brand-blue flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-yellow rounded-2xl rotate-[-6deg] flex items-center justify-center text-brand-blue shadow-sm border-2 border-brand-orange">
                        <MapIcon size={28} strokeWidth={3} />
                    </div>
                    Explorer Passport
                </h2>
                <p className="text-slate-500 font-medium pl-1">Track your journey and collection!</p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-4">
                <div className="bg-orange-50 border-2 border-orange-100 px-4 py-2 rounded-2xl flex flex-col items-center">
                    <span className="text-2xl font-black text-brand-orange">{allStickers.length}</span>
                    <span className="text-xs font-bold text-orange-300 uppercase">Stickers</span>
                </div>
                <div className="bg-purple-50 border-2 border-purple-100 px-4 py-2 rounded-2xl flex flex-col items-center">
                    <span className="text-2xl font-black text-brand-purple">{earnedBadges.length}</span>
                    <span className="text-xs font-bold text-purple-300 uppercase">Badges</span>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
            
            {/* --- STICKER ALBUM VIEW (DISPLAY ONLY) --- */}
            {activeTab === 'stickers' && (
                <>
                    {allStickers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 opacity-50">
                            <Search size={64} className="text-slate-300 mb-4" />
                            <p className="text-xl font-bold text-slate-400">No stickers yet!</p>
                            <p className="text-slate-400">Go on a quest to find items.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                            {allStickers.map((item) => (
                                <div 
                                    key={item.id}
                                    className="bg-white p-2 rounded-xl shadow-sm border-2 border-slate-100 flex flex-col opacity-90"
                                >
                                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-1">
                                        <img src={item.imageUrl} alt={item.word} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="block text-center font-bold text-slate-400 text-xs capitalize truncate px-1">
                                        {item.word}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* --- BADGES VIEW --- */}
            {activeTab === 'badges' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {BADGES.map(badge => {
                        const isUnlocked = earnedBadges.find(b => b.id === badge.id);
                        return (
                            <div 
                                key={badge.id}
                                className={`relative p-6 rounded-3xl border-4 flex items-center gap-4 transition-all ${
                                    isUnlocked 
                                    ? 'bg-white border-white shadow-lg' 
                                    : 'bg-slate-100 border-slate-200 opacity-70 grayscale'
                                }`}
                            >
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-inner border-4 border-white/30 shrink-0 ${
                                    isUnlocked ? badge.color : 'bg-slate-300'
                                }`}>
                                    {badge.icon}
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {badge.label}
                                    </h3>
                                    <p className="text-sm font-bold text-slate-400 leading-tight">
                                        {badge.description}
                                    </p>
                                    {!isUnlocked && (
                                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mt-2 bg-slate-200 inline-flex px-2 py-1 rounded-full">
                                            <Lock size={12} /> LOCKED
                                        </div>
                                    )}
                                    {isUnlocked && (
                                        <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-2 bg-green-100 inline-flex px-2 py-1 rounded-full">
                                            <Zap size={12} /> UNLOCKED
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Bottom Tab Navigation */}
        <div className="bg-white border-t-4 border-slate-100 shrink-0 z-20 pb-4 pt-4 px-4 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="flex gap-2 justify-center max-w-md mx-auto bg-slate-100 p-2 rounded-full">
                <button 
                    onClick={() => { playClick(); setActiveTab('stickers'); }}
                    className={`flex-1 py-3 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'stickers' 
                        ? 'bg-brand-blue text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-200/50'
                    }`}
                >
                    <Grid size={20} /> Sticker Album
                </button>
                <button 
                    onClick={() => { playClick(); setActiveTab('badges'); }}
                    className={`flex-1 py-3 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'badges' 
                        ? 'bg-brand-yellow text-brand-blue shadow-md' 
                        : 'text-slate-400 hover:bg-slate-200/50'
                    }`}
                >
                    <Award size={20} /> Achievements
                </button>
            </div>
        </div>
    </div>
  );
};