import { describe, expect, it } from 'vitest';
import { createExperienceStore } from '@/entities/experience/model/store';
import { resolveLocale } from '@/shared/config/locale';

describe('route locale and scene composition', () => {
  it('connects the system on a fresh visit and allows deliberate isolation', () => {
    const store = createExperienceStore('fa');
    expect(store.getState().powered).toBe(true);
    store.getState().setPowered(false);
    expect(store.getState().powered).toBe(false);
    store.getState().setSignalMode(2);
    expect(store.getState().powered).toBe(true);
    expect(store.getState().signalMode).toBe(2);
  });
  it('rejects unknown and nested paths instead of treating them as Persian', () => {
    expect(resolveLocale()).toBe('fa');
    expect(resolveLocale(['en'])).toBe('en');
    expect(resolveLocale(['de'])).toBeNull();
    expect(resolveLocale(['en', 'arbitrary'])).toBeNull();
  });
  it('atomically mirrors composition while preserving motion preferences', () => {
    const store = createExperienceStore('fa');
    const initial = store.getState().composition;
    store.getState().setMotionPaused(true);
    store.getState().setPowered(true);
    store.getState().setLocale('en');
    const next = store.getState();
    expect(next.composition.direction).toBe('ltr');
    expect(next.composition.cameraX).toBe(-initial.cameraX);
    expect(next.composition.assetYaw).toBe(-initial.assetYaw);
    expect(next.composition.assetX).toBe(-initial.assetX);
    expect(next.motionPaused).toBe(true);
    expect(next.powered).toBe(true);
  });
  it('isolates each rendered application store', () => {
    const fa = createExperienceStore('fa');
    const en = createExperienceStore('en');
    fa.getState().setQuality('low');
    fa.getState().setLocale('en');
    expect(en.getState().quality).toBe('medium');
    expect(en.getState().motionPaused).toBe(false);
  });
});
