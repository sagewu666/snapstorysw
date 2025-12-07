
import React from 'react';
import { Story } from '../types';
import { BookOpen, Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { playClick, playPop } from '../utils/soundUtils';

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
}

export const StoryLibrary: React.FC<StoryLibraryProps> = ({ stories, onSelectStory }) => {
  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 md:p-8 bg-white border-b-4 border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm z-10">
            <div>
                <h2 className="text-3xl md:text-4xl font-black text-brand-blue flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-purple rounded-2xl rotate-3 flex items-center justify-center text-white shadow-sm border-2 border-purple-300">
                        <BookOpen size={28} strokeWidth={3} />
                    </div>
                    My Library
                </h2>
                <p className="text-slate-500 font-medium pl-1">You have written {stories.length} stories!</p>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 scrollbar-hide">
            {stories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center opacity-60 mt-10">
                    <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                        <BookOpen size={40} className="text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-400 mb-2">Library is Empty</h3>
                    <p className="text-slate-400 max-w-xs mx-auto">Create your first story to see it here!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map((story) => (
                        <button 
                            key={story.id}
                            onClick={() => { playPop(); onSelectStory(story); }}
                            className="bg-white rounded-[2rem] shadow-sm border-4 border-slate-100 hover:border-brand-blue hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden flex flex-col text-left h-full"
                        >
                            {/* Cover Image */}
                            <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                                {story.pages[0]?.imageUrl ? (
                                    <img src={story.pages[0].imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-brand-blue font-bold">
                                        No Cover
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1 shadow-sm">
                                    <CalendarIcon size={12} />
                                    {new Date(story.date).toLocaleDateString()}
                                </div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="font-black text-slate-800 text-xl mb-2 line-clamp-2 leading-tight group-hover:text-brand-blue transition-colors">
                                    {story.title}
                                </h3>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {story.wordsUsed.slice(0, 3).map((word, i) => (
                                        <span key={i} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 capitalize">
                                            {word}
                                        </span>
                                    ))}
                                    {story.wordsUsed.length > 3 && (
                                        <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-400">
                                            +{story.wordsUsed.length - 3}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                        <Clock size={14} /> Read Again
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                        <ArrowRight size={16} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
