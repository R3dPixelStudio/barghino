// Frame-frequency values deliberately live outside Zustand's React subscriptions.
export type MotionChannel = { scroll: number };
export function createMotionChannel(): MotionChannel {
  return { scroll: 0 };
}
