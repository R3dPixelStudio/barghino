import { createStore } from 'zustand/vanilla';
import { compositionFor, type Locale } from '@/shared/config/locale';

export type Quality = 'low' | 'medium' | 'high';
export type Stage = 0 | 1 | 2;
export type ExperienceState = {
  locale: Locale;
  composition: ReturnType<typeof compositionFor>;
  powered: boolean;
  motionPaused: boolean;
  reducedMotion: boolean;
  quality: Quality;
  stage: Stage;
  setLocale: (locale: Locale) => void;
  setPowered: (powered: boolean) => void;
  setMotionPaused: (paused: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setQuality: (quality: Quality) => void;
  setStage: (stage: Stage) => void;
};

export function createExperienceStore(locale: Locale) {
  return createStore<ExperienceState>()((set) => ({
    locale,
    composition: compositionFor(locale),
    powered: false,
    motionPaused: false,
    // Conservative until the browser reports the user's preference.
    reducedMotion: true,
    quality: 'medium',
    stage: 0,
    setLocale: (next) => set({ locale: next, composition: compositionFor(next) }),
    setPowered: (powered) => set({ powered }),
    setMotionPaused: (motionPaused) => set({ motionPaused }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setQuality: (quality) => set({ quality }),
    setStage: (stage) => set({ stage }),
  }));
}

export type ExperienceStore = ReturnType<typeof createExperienceStore>;
