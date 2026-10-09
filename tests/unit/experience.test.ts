import { describe, expect, it } from 'vitest';
import { createExperienceStore } from '@/entities/experience/model/store';
import { resolveLocale } from '@/shared/config/locale';

describe('route locale and scene composition', () => {
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
