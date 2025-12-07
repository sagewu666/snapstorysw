
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StartScreen } from './components/StartScreen'; // Import StartScreen
import { ThemeSelection } from './components/ThemeSelection';
import { CameraQuest } from './components/CameraQuest';
import { StoryBook } from './components/StoryBook';
import { StoryModeSelection } from './components/StoryModeSelection';
import { KidProfileSelector } from './components/KidProfileSelector';
import { ExplorerPassport } from './components/ExplorerPassport';
import { WordMemoryGym } from './components/WordMemoryGym';
import { StoryQuiz } from './components/StoryQuiz';
import { VocabularyList } from './components/VocabularyList'; 
import { StoryLibrary } from './components/StoryLibrary';
import { AppView, LearnedWord, Theme, Story, KidProfile, WordMastery } from './types';
import { generateStoryContent, generateIllustration } from './services/geminiService';
import { audioManager } from './services/audioManager';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false); // New State
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [kidProfile, setKidProfile] = useState<KidProfile | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [targetItemCount, setTargetItemCount] = useState<number>(3);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  
  // Persisted Data (In memory for now)
  const [stories, setStories] = useState<Story[]>([]);
  const [wordMastery, setWordMastery] = useState<WordMastery>({});

  // --- AUDIO CLEANUP ON VIEW CHANGE ---
  useEffect(() => {
    // Whenever the view changes, stop all audio immediately
    audioManager.stopAll();
  }, [currentView, hasStarted]);

  const handleStartQuest = (theme: Theme, count: number) => {
    setSelectedTheme(theme);
    setTargetItemCount(count);
    setCurrentView(AppView.CAMERA_QUEST);
  };

  const handleQuestComplete = (words: LearnedWord[]) => {
    setLearnedWords(words);
    setCurrentView(AppView.STORY_MODE_SELECT);
  };

  const handleStoryModeSelect = async (userPrompt?: string) => {
    if (!selectedTheme || !kidProfile) return;
    setCurrentView(AppView.STORY_SETUP); // Loading view
    
    // Generate Story
    const storyData = await generateStoryContent(learnedWords, selectedTheme, kidProfile, userPrompt);
    
    // Generate Cover Image (First page visual)
    const coverImage = await generateIllustration(storyData.pages[0].text, "storybook style", storyData.mainCharacterVisual);
    if (coverImage) {
        storyData.pages[0].imageUrl = coverImage;
    }

    const newStory: Story = {
        id: Date.now().toString(),
        title: storyData.title,
        themeId: selectedTheme.id,
        date: new Date().toISOString(),
        pages: storyData.pages,
        wordsUsed: learnedWords.map(w => w.word),
        learnedWords: learnedWords 
    };

    setCurrentStory(newStory);
    setStories(prev => [newStory, ...prev]);
    setCurrentView(AppView.STORY_READER);

    // Background generate remaining images
    generateRemainingImages(newStory, storyData.mainCharacterVisual);
  };

  const generateRemainingImages = async (story: Story, charVisual: string) => {
      const newPages = [...story.pages];
      for (let i = 1; i < newPages.length; i++) {
          const img = await generateIllustration(newPages[i].text, "storybook style", charVisual);
          if (img) {
              newPages[i].imageUrl = img;
              // Update state to trigger re-render if viewing
              setCurrentStory(prev => prev ? { ...prev, pages: newPages } : null);
              setStories(prev => prev.map(s => s.id === story.id ? { ...s, pages: newPages } : s));
          }
      }
  };

  const handleUpdateMastery = (wordId: string, success: boolean) => {
      setWordMastery(prev => {
          const current = prev[wordId] || { level: 0, lastReviewed: 0 };
          let newLevel = current.level;
          if (success) newLevel = Math.min(5, newLevel + 1);
          
          return {
              ...prev,
              [wordId]: { level: newLevel, lastReviewed: Date.now() }
          };
      });
  };

  const handleOpenLibraryStory = (story: Story) => {
      setCurrentStory(story);
      setCurrentView(AppView.STORY_READER);
  };

  const handleWordAddedToStory = (newWord: LearnedWord) => {
      if (!currentStory) return;

      const updatedStory = {
          ...currentStory,
          learnedWords: [...(currentStory.learnedWords || []), newWord],
          wordsUsed: [...(currentStory.wordsUsed || []), newWord.word]
      };

      setCurrentStory(updatedStory);
      setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
  };

  // --- RENDER HELPERS ---
  
  // 1. Show Start Screen First
  if (!hasStarted) {
    return <StartScreen onStart={() => setHasStarted(true)} />;
  }

  // 2. Show Profile Selector Second
  if (!kidProfile) {
      return (
          <Layout 
            onHome={() => {}} onCalendar={() => {}} onPassport={() => {}} onMemory={() => {}} onVocab={() => {}}
            isProfileSetup={true} 
          >
              <KidProfileSelector onComplete={(profile) => setKidProfile(profile)} />
          </Layout>
      );
  }

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
      case AppView.THEME_SELECTION:
        return <ThemeSelection onSelectTheme={handleStartQuest} />;
      
      case AppView.CAMERA_QUEST:
        return selectedTheme ? (
            <CameraQuest 
                targetCount={targetItemCount} 
                theme={selectedTheme} 
                onComplete={handleQuestComplete}
                onBack={() => setCurrentView(AppView.HOME)} // Pass onBack logic to component
            />
        ) : null;

      case AppView.STORY_MODE_SELECT:
        return selectedTheme ? (
            <StoryModeSelection theme={selectedTheme} onSelectMode={handleStoryModeSelect} />
        ) : null;

      case AppView.STORY_SETUP:
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-pulse">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold text-brand-blue">Painting your story...</h2>
                <p className="text-slate-400">Our magic pencils are working!</p>
            </div>
        );

      case AppView.STORY_READER:
        return currentStory ? (
            <StoryBook 
                story={currentStory} 
                kidProfile={kidProfile}
                onWordAdded={handleWordAddedToStory}
                onFinish={() => {
                   setCurrentView(AppView.STORY_QUIZ);
                }} 
            />
        ) : null;

      case AppView.STORY_QUIZ:
         return currentStory && currentStory.learnedWords ? (
             <StoryQuiz 
                words={currentStory.learnedWords} 
                onComplete={() => setCurrentView(AppView.PASSPORT)} 
             />
         ) : null;

      case AppView.PASSPORT:
        return <ExplorerPassport stories={stories} />;
      
      case AppView.VOCAB_LIST:
        return <VocabularyList stories={stories} />;

      case AppView.WORD_MEMORY:
        return <WordMemoryGym stories={stories} mastery={wordMastery} onUpdateMastery={handleUpdateMastery} />;
      
      case AppView.CALENDAR:
        return <StoryLibrary stories={stories} onSelectStory={handleOpenLibraryStory} />;

      default:
        return <ThemeSelection onSelectTheme={handleStartQuest} />;
    }
  };

  // Determine Layout Variant
  const layoutVariant = (currentView === AppView.CAMERA_QUEST || currentView === AppView.STORY_READER || currentView === AppView.STORY_QUIZ) 
    ? 'immersive' 
    : 'standard';

  return (
    <Layout 
        onHome={() => setCurrentView(AppView.HOME)}
        onCalendar={() => setCurrentView(AppView.CALENDAR)}
        onPassport={() => setCurrentView(AppView.PASSPORT)}
        onMemory={() => setCurrentView(AppView.WORD_MEMORY)}
        onVocab={() => setCurrentView(AppView.VOCAB_LIST)}
        onBack={currentView !== AppView.HOME ? () => setCurrentView(AppView.HOME) : undefined}
        variant={layoutVariant} // Use immersive for Camera/Story
    >
        {renderContent()}
    </Layout>
  );
};

export default App;
