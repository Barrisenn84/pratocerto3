/**
 * Synthesizes a pleasant, gentle meal reminder chime using Web Audio API.
 * Does not require external audio files and works across all modern browsers.
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Notes for an uplifting, soft major chime (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, time: 0, duration: 0.18 }, // C5
      { freq: 659.25, time: 0.12, duration: 0.18 }, // E5
      { freq: 783.99, time: 0.24, duration: 0.22 }, // G5
      { freq: 1046.5, time: 0.36, duration: 0.38 }, // C6
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
    masterGain.connect(ctx.destination);

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      // Smooth attack and decay envelope
      noteGain.gain.setValueAtTime(0, ctx.currentTime + time);
      noteGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + time + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration + 0.05);
    });

    // Close context after playback completes
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 1000);
  } catch (err) {
    console.debug('Could not play synthesized notification sound:', err);
  }
}
