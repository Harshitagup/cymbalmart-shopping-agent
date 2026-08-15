/**
 * Tactile Haptic Feedback Utility for Touch & Gesture Interactions
 * Supports Web Vibration API with safe fallback and subtle Web Audio feedback for iOS Safari
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playSubtleClick(frequency: number = 800, duration: number = 0.03, volume: number = 0.05) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors
  }
}

export const isHapticSupported = (): boolean => {
  return typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
};

export const triggerHaptic = (type: HapticType = 'light', enableAudioFallback = true): boolean => {
  let didVibrate = false;

  // 1. Try standard navigator.vibrate
  if (isHapticSupported()) {
    try {
      switch (type) {
        case 'selection':
          didVibrate = navigator.vibrate(10);
          break;
        case 'light':
          didVibrate = navigator.vibrate(18);
          break;
        case 'medium':
          didVibrate = navigator.vibrate(35);
          break;
        case 'heavy':
          didVibrate = navigator.vibrate([45, 25, 45]);
          break;
        case 'success':
          didVibrate = navigator.vibrate([20, 30, 30]);
          break;
        case 'warning':
          didVibrate = navigator.vibrate([40, 50, 40]);
          break;
        default:
          didVibrate = navigator.vibrate(20);
      }
    } catch {
      didVibrate = false;
    }
  }

  // 2. If vibration is not supported or was blocked (e.g. iOS Safari / desktop), provide subtle acoustic feedback
  if (!didVibrate && enableAudioFallback) {
    switch (type) {
      case 'selection':
        playSubtleClick(1200, 0.015, 0.02);
        break;
      case 'light':
        playSubtleClick(900, 0.025, 0.03);
        break;
      case 'medium':
        playSubtleClick(650, 0.04, 0.05);
        break;
      case 'success':
        playSubtleClick(1050, 0.03, 0.06);
        setTimeout(() => playSubtleClick(1400, 0.04, 0.07), 40);
        break;
      case 'warning':
      case 'heavy':
        playSubtleClick(350, 0.06, 0.08);
        break;
    }
  }

  return didVibrate;
};
