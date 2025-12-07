
import { Theme, ThemeCategory, Badge } from './types';

export const THEMES: Theme[] = [
  // --- Colors ---
  { id: 'c_red', label: 'Red World', category: ThemeCategory.COLOR, icon: '🔴', description: 'red things', promptContext: 'The story takes place in a volcano kingdom where everything is hot and red.', color: 'bg-red-500' },
  { id: 'c_blue', label: 'Blue Ocean', category: ThemeCategory.COLOR, icon: '🔵', description: 'blue things', promptContext: 'The story happens underwater in a magical blue coral reef.', color: 'bg-blue-500' },
  { id: 'c_green', label: 'Green Forest', category: ThemeCategory.COLOR, icon: '🟢', description: 'green things', promptContext: 'A nature adventure in a deep, whispering emerald forest.', color: 'bg-green-500' },
  { id: 'c_yellow', label: 'Yellow Sunshine', category: ThemeCategory.COLOR, icon: '🟡', description: 'yellow things', promptContext: 'A happy story in a land made of sunlight, lemons, and gold.', color: 'bg-yellow-400' },

  // --- Shapes ---
  { id: 's_round', label: 'Round Planet', category: ThemeCategory.SHAPE, icon: '⚪', description: 'round things', promptContext: 'The characters love to roll, bounce, and spin. No sharp corners allowed!', color: 'bg-orange-400' },
  { id: 's_square', label: 'Box City', category: ThemeCategory.SHAPE, icon: '⬛', description: 'square things', promptContext: 'Everything is built from sturdy blocks. A story about building and stacking.', color: 'bg-indigo-500' },
  { id: 's_triangle', label: 'Pointy Peaks', category: ThemeCategory.SHAPE, icon: '🔺', description: 'triangle things', promptContext: 'An adventure climbing sharp mountains and pointy pyramids.', color: 'bg-pink-500' },

  // --- Materials ---
  { id: 'm_soft', label: 'Soft Cloud', category: ThemeCategory.MATERIAL, icon: '☁️', description: 'soft things', promptContext: 'A gentle bedtime story in a world made of cotton candy and clouds.', color: 'bg-sky-300' },
  { id: 'm_hard', label: 'Rock Solid', category: ThemeCategory.MATERIAL, icon: '🗿', description: 'hard things', promptContext: 'A tough adventure with strong, unbreakable characters.', color: 'bg-stone-500' },
  { id: 'm_shiny', label: 'Shiny Metal', category: ThemeCategory.MATERIAL, icon: '✨', description: 'shiny things', promptContext: 'A sci-fi robot adventure or a quest for sparkling treasure.', color: 'bg-slate-400' },
  { id: 'm_wood', label: 'Wooden Woods', category: ThemeCategory.MATERIAL, icon: '🪵', description: 'wooden things', promptContext: 'A rustic story about carving, building, and nature spirits.', color: 'bg-amber-700' },

  // --- Space (Room) ---
  { id: 'sp_kitchen', label: 'Chef Quest', category: ThemeCategory.SPACE, icon: '🍳', description: 'things in the kitchen', promptContext: 'A cooking adventure where ingredients come to life.', color: 'bg-red-400' },
  { id: 'sp_desk', label: 'Desk Explorer', category: ThemeCategory.SPACE, icon: '✏️', description: 'things on a desk', promptContext: 'A story about stationary heroes (pencils, erasers) saving the day.', color: 'bg-blue-400' },
  { id: 'sp_bedroom', label: 'Dream Land', category: ThemeCategory.SPACE, icon: '🛌', description: 'things in the bedroom', promptContext: 'A magical journey that happens when the lights go out.', color: 'bg-purple-400' },
  { id: 'sp_bathroom', label: 'Bubble Bath', category: ThemeCategory.SPACE, icon: '🛁', description: 'things in the bathroom', promptContext: 'A splashy adventure with bubbles, water, and rubber ducks.', color: 'bg-cyan-400' },

  // --- Function ---
  { id: 'f_sound', label: 'Noisy Band', category: ThemeCategory.FUNCTION, icon: '📢', description: 'things that make noise', promptContext: 'A musical story where the objects form a rock band.', color: 'bg-violet-500' },
  { id: 'f_light', label: 'Light Up', category: ThemeCategory.FUNCTION, icon: '💡', description: 'things that give light', promptContext: 'A story about chasing away the darkness.', color: 'bg-yellow-300' },
  { id: 'f_open', label: 'Open Up', category: ThemeCategory.FUNCTION, icon: '📦', description: 'things that open', promptContext: 'A mystery story where every object hides a secret inside.', color: 'bg-emerald-500' },
];

// Specific themes for "Surprise Me" to pick from
export const SURPRISE_THEMES: Theme[] = [
  { id: 'sur_happy', label: 'Happy Vibes', category: ThemeCategory.SURPRISE, icon: '😄', description: 'things that make you smile', promptContext: 'A heartwarming story about spreading joy to sad characters.', color: 'bg-yellow-400' },
  { id: 'sur_magic', label: 'Magic Items', category: ThemeCategory.SURPRISE, icon: '🪄', description: 'things that look magical', promptContext: 'The objects found have secret spells and wizard powers.', color: 'bg-purple-600' },
  { id: 'sur_tiny', label: 'Tiny World', category: ThemeCategory.SURPRISE, icon: '🐜', description: 'tiny things', promptContext: 'The main character shrinks to the size of an ant.', color: 'bg-lime-500' },
  { id: 'sur_heavy', label: 'Heavy Lifter', category: ThemeCategory.SURPRISE, icon: '🏋️', description: 'heavy things', promptContext: 'A story about giants and super strength.', color: 'bg-stone-600' },
  { id: 'sur_speed', label: 'Speed Racer', category: ThemeCategory.SURPRISE, icon: '🏎️', description: 'things that look fast', promptContext: 'A high-speed racing story.', color: 'bg-red-600' },
  { id: 'sur_tool', label: 'Fix It!', category: ThemeCategory.SURPRISE, icon: '🔧', description: 'tools', promptContext: 'A story about fixing a broken machine.', color: 'bg-orange-500' },
];

export const BADGES: Badge[] = [
  { 
    id: 'first_snap', 
    label: 'Photographer', 
    description: 'Create your first story', 
    icon: '📸', 
    color: 'bg-blue-400',
    condition: (stories) => stories.length >= 1 
  },
  { 
    id: 'novice_writer', 
    label: 'Storyteller', 
    description: 'Create 3 stories', 
    icon: '✍️', 
    color: 'bg-purple-400',
    condition: (stories) => stories.length >= 3 
  },
  { 
    id: 'word_collector', 
    label: 'Word Collector', 
    description: 'Collect 10 different items', 
    icon: '🎒', 
    color: 'bg-orange-400',
    condition: (_, totalWords) => totalWords >= 10 
  },
  { 
    id: 'master_explorer', 
    label: 'Master Explorer', 
    description: 'Collect 25 different items', 
    icon: '👑', 
    color: 'bg-yellow-400',
    condition: (_, totalWords) => totalWords >= 25 
  },
  { 
    id: 'theme_hunter', 
    label: 'Theme Hunter', 
    description: 'Try 5 different themes', 
    icon: '🌈', 
    color: 'bg-green-400',
    condition: (stories) => {
       const uniqueThemes = new Set(stories.map(s => s.themeId));
       return uniqueThemes.size >= 5;
    }
  }
];
