import { AudioSettings } from './types';

/**
 * 100% procedural Web Audio API sound & Egyptian maqam oud synthesizer.
 * Zero external audio files required.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = {
    muted: false,
    music: 0.45,
    sfx: 0.75,
    voices: 0.7,
    ambience: 0.55,
  };
  private musicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private stepIdx = 0;

  // Maqam Hijaz frequencies (D4, Eb4, F#4, G4, A4, Bb4, C5, D5)
  private readonly hijazNotes = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];
  private readonly melodyPattern = [0, 2, 3, 4, 3, 2, 1, 0, 4, 5, 6, 4, 3, 2, 1, 0];

  public updateSettings(settings: AudioSettings): void {
    this.settings = { ...settings };
  }

  private ensureContext(): AudioContext | null {
    if (this.settings.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
    this.startLoops();
  }

  public startLoops(): void {
    if (this.musicTimer === null && typeof window !== 'undefined') {
      this.musicTimer = window.setInterval(() => {
        if (this.settings.muted || this.settings.music <= 0.02) return;
        const ctx = this.ensureContext();
        if (!ctx || ctx.state !== 'running') return;
        const noteIdx = this.melodyPattern[this.stepIdx % this.melodyPattern.length];
        this.stepIdx += 1;
        this.playOudPluck(this.hijazNotes[noteIdx], this.settings.music * 0.08);
      }, 620);
    }

    if (this.ambienceTimer === null && typeof window !== 'undefined') {
      this.ambienceTimer = window.setInterval(() => {
        if (this.settings.muted || this.settings.ambience <= 0.02) return;
        const ctx = this.ensureContext();
        if (!ctx || ctx.state !== 'running') return;
        // Subtle distant coffeehouse glass clink / murmur puff
        if (Math.random() < 0.45) {
          this.playGlassClink(this.settings.ambience * 0.045);
        }
      }, 2800);
    }
  }

  public stopLoops(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ambienceTimer !== null) {
      clearInterval(this.ambienceTimer);
      this.ambienceTimer = null;
    }
  }

  private playOudPluck(freq: number, gainVal: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 0.5, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.55);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.65);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.7);
    osc2.stop(now + 0.7);
  }

  private playGlassClink(gainScale = 0.08): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const base = 1850 + (Math.random() - 0.5) * 280;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.15, now + 0.09);

    gain.gain.setValueAtTime(gainScale * this.settings.sfx, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playPour(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.settings.sfx <= 0.02) return;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(1600, now + 0.32);
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14 * this.settings.sfx, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  public playStir(): void {
    this.playGlassClink(0.11);
  }

  public playCashRegister(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.settings.sfx <= 0.02) return;
    const now = ctx.currentTime;
    [1318.5, 1760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.14 * this.settings.sfx, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.27);
    });
  }

  public playDoor(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.settings.sfx <= 0.02) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.16);
    gain.gain.setValueAtTime(0.1 * this.settings.sfx, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playReward(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.settings.sfx <= 0.02) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.11 * this.settings.sfx, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.28);
    });
  }

  public playVoiceChime(pitchOffset = 1): void {
    const ctx = this.ensureContext();
    if (!ctx || this.settings.voices <= 0.02) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340 * pitchOffset, now);
    osc.frequency.linearRampToValueAtTime(420 * pitchOffset, now + 0.08);
    gain.gain.setValueAtTime(0.07 * this.settings.voices, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }
}

export const soundEngine = new SoundEngine();
