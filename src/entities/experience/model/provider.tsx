'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { Locale } from '@/shared/config/locale';
import { createExperienceStore, type ExperienceState, type ExperienceStore } from './store';

const ExperienceContext = createContext<ExperienceStore | null>(null);

export function ExperienceProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [store] = useState(() => createExperienceStore(locale));

  useEffect(() => {
    store.getState().setLocale(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = store.getState().composition.direction;
  }, [locale, store]);

  useEffect(() => {
    try {
      store.getState().setPowered(sessionStorage.getItem('barghino.power') === 'on');
    } catch {
      // Storage can be disabled; the switch still works for this page.
    }
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.powered === previous.powered) return;
      try {
        sessionStorage.setItem('barghino.power', state.powered ? 'on' : 'off');
      } catch {
        // This purely visual preference never gates navigation or content.
      }
    });
    return unsubscribe;
  }, [store]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => store.getState().setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [store]);

  return <ExperienceContext.Provider value={store}>{children}</ExperienceContext.Provider>;
}

export function useExperienceApi() {
  const store = useContext(ExperienceContext);
  if (!store) throw new Error('ExperienceProvider is required.');
  return store;
}

export function useExperience<T>(selector: (state: ExperienceState) => T) {
  return useStore(useExperienceApi(), selector);
}
