
export enum AppView {
  HOME = 'HOME',
  THEME_SELECTION = 'THEME_SELECTION',
  CAMERA_QUEST = 'CAMERA_QUEST',
  VOCAB_REVIEW = 'VOCAB_REVIEW',
  KID_PROFILE = 'KID_PROFILE',
  STORY_MODE_SELECT = 'STORY_MODE_SELECT',
  STORY_SETUP = 'STORY_SETUP',
  STORY_READER = 'STORY_READER',
  STORY_QUIZ = 'STORY_QUIZ',
  CALENDAR = 'CALENDAR',
  PASSPORT = 'PASSPORT',
  WORD_MEMORY = 'WORD_MEMORY',
  VOCAB_LIST = 'VOCAB_LIST'
}

export enum ThemeCategory {
  COLOR = 'Color',
  SHAPE = 'Shape',
  MATERIAL = 'Material',
  SPACE = 'Space',
  FUNCTION = 'Function',
  SURPRISE = 'Surprise'
}

export interface Theme {
  id: string;
  label: string;
  category: ThemeCategory;
  icon: string;
  description: string;
  promptContext: string;
  color: string;
}

export interface LearnedWord {
  id: string;
  word: string;
  definition: string; // New field for simple English definition
  imageUrl: string;
  originalImage: string;
  timestamp: number;
  visualDetail: string;
}

export interface StoryPage {
  pageNumber: number;
  text: string;
  imageUrl?: string;
  fallbackImagePrompt?: string;
}

export interface Story {
  id: string;
  title: string;
  themeId: string;
  date: string;
  pages: StoryPage[];
  wordsUsed: string[];
  learnedWords?: LearnedWord[]; // Added to store full objects for Sticker Album
}

export interface UserProgress {
  totalWords: number;
  storiesCreated: number;
  streakDays: number;
}

export interface KidProfile {
  ageGroup: '3-5' | '6-8' | '9-12';
  englishLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  condition: (stories: Story[], totalWords: number) => boolean;
  color: string;
}

export interface WordMastery {
  [wordId: string]: {
    level: number; // 0 to 5 stars
    lastReviewed: number;
  }
}
