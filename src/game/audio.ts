/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CourtSurface, ShotType } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private crowdAmbienceNode: AudioBufferSourceNode | null = null;
  private crowdAmbienceGain: GainNode | null = null;

  private isMuted: boolean = false;
  private masterVol: number = 0.85;
  private sfxVol: number = 0.9;
  private crowdVol: number = 0.7;
  private voiceVol: number = 0.95;

  private speechSynth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynth = window.speechSynthesis;
      this.initVoice();
    }
  }

  private initVoice() {
    if (!this.speechSynth) return;
    const loadVoices = () => {
      const voices = this.speechSynth?.getVoices() || [];
      // Prefer crisp British or American English voice for tennis umpire feel
      const enVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('UK') ||
            v.name.includes('US'))
      );
      this.selectedVoice = enVoice || voices.find((v) => v.lang.startsWith('en')) || null;
    };

    loadVoices();
    if (this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = loadVoices;
    }
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.crowdGain = this.ctx.createGain();
      this.crowdGain.gain.setValueAtTime(this.crowdVol, this.ctx.currentTime);
      this.crowdGain.connect(this.masterGain);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(this.voiceVol, this.ctx.currentTime);
      this.voiceGain.connect(this.masterGain);

      this.startAmbience();
    } catch {
      // Audio not supported or blocked
    }
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, sfx: number, crowd: number, voice: number, muted: boolean) {
    this.masterVol = master;
    this.sfxVol = sfx;
    this.crowdVol = crowd;
    this.voiceVol = voice;
    this.isMuted = muted;

    if (this.ctx && this.masterGain && this.sfxGain && this.crowdGain && this.voiceGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(muted ? 0 : master, now);
      this.sfxGain.gain.setValueAtTime(sfx, now);
      this.crowdGain.gain.setValueAtTime(crowd, now);
      this.voiceGain.gain.setValueAtTime(voice, now);
    }
  }

  /**
   * Procedural stadium background ambient murmur loop
   */
  private startAmbience() {
    if (!this.ctx || !this.crowdGain) return;

    try {
      // Generate 4 seconds of gentle pink/brown noise
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 0.15; // low volume
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Bandpass filter to sound like distant stadium crowd murmur
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(380, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.crowdAmbienceGain = this.ctx.createGain();
      this.crowdAmbienceGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.crowdAmbienceGain);
      this.crowdAmbienceGain.connect(this.crowdGain);

      noise.start();
      this.crowdAmbienceNode = noise;
    } catch {
      // ignore
    }
  }

  /**
   * Procedural Racket Hit Sound with distinct textures based on shot type and power
   */
  public playRacketHit(shotType: ShotType | 'opponent', power: number = 0.8) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const clampedPower = Math.max(0.3, Math.min(1.2, power));

    // 1. Transient strike click (racket string snap)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();

    // 2. Body resonance of racket frame and ball compression
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();

    // 3. String mesh high harmonic buzz
    const meshFilter = this.ctx.createBiquadFilter();

    let startFreq = 340;
    let endFreq = 95;
    let duration = 0.14;

    if (shotType === 'smash') {
      startFreq = 480;
      endFreq = 80;
      duration = 0.22;
    } else if (shotType === 'topspin') {
      startFreq = 380;
      endFreq = 120;
      duration = 0.16;
    } else if (shotType === 'slice') {
      startFreq = 290;
      endFreq = 140;
      duration = 0.13;
    } else if (shotType === 'lob') {
      startFreq = 260;
      endFreq = 130;
      duration = 0.18;
    } else if (shotType === 'serve') {
      startFreq = 520;
      endFreq = 85;
      duration = 0.25;
    }

    // Pitch sweep
    bodyOsc.type = shotType === 'smash' || shotType === 'serve' ? 'triangle' : 'sine';
    bodyOsc.frequency.setValueAtTime(startFreq * clampedPower, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    bodyGain.gain.setValueAtTime(0.7 * clampedPower, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Snap transient (high pitch pulse)
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(950 * clampedPower, now);
    snapOsc.frequency.exponentialRampToValueAtTime(150, now + 0.035);

    snapGain.gain.setValueAtTime(0.55 * clampedPower, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    // String mesh noise
    meshFilter.type = 'highpass';
    meshFilter.frequency.setValueAtTime(800, now);

    bodyOsc.connect(bodyGain);
    snapOsc.connect(snapGain);
    bodyGain.connect(this.sfxGain);
    snapGain.connect(this.sfxGain);

    bodyOsc.start(now);
    snapOsc.start(now);
    bodyOsc.stop(now + duration + 0.05);
    snapOsc.stop(now + 0.05);
  }

  /**
   * Procedural Court Bounce Sound tailored to Grass, Hard, or Clay
   */
  public playCourtBounce(surface: CourtSurface = 'hard', speed: number = 20) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const normSpeed = Math.min(1.4, Math.max(0.3, speed / 22));

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'grass') {
      // Soft, muffled low-mid organic thump
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160 * normSpeed, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);
      gain.gain.setValueAtTime(0.35 * normSpeed, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (surface === 'clay') {
      // Earthy, textured thud with slight scrape
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180 * normSpeed, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.11);
      gain.gain.setValueAtTime(0.42 * normSpeed, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else {
      // Hard court: sharp, resonant punch
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220 * normSpeed, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
      gain.gain.setValueAtTime(0.5 * normSpeed, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Net cord clip sound
   */
  public playNetCord() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Crowd cheering / applause burst on winning shot, ace, or game end
   */
  public playCrowdApplause(intensity: 'light' | 'cheer' | 'roar' = 'cheer') {
    if (!this.ctx || !this.crowdGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const duration = intensity === 'roar' ? 3.5 : intensity === 'cheer' ? 2.2 : 1.2;
    const peakGain = intensity === 'roar' ? 0.45 : intensity === 'cheer' ? 0.3 : 0.18;

    // Synthesize noise buffer for realistic applause
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Stochastic bursts representing individual claps
      const clap = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 3 : 0;
      data[i] = (Math.random() * 2 - 1) * 0.4 + clap;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(0.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.crowdGain);

    noise.start(now);
    noise.stop(now + duration + 0.1);
  }

  /**
   * Crowd gasp on near miss / dramatic let
   */
  public playCrowdGasp() {
    if (!this.ctx || !this.crowdGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.crowdGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  /**
   * Umpire Voice Announcement via Speech Synthesis or professional chime fallback
   */
  public announceScore(phrase: string) {
    if (this.isMuted) return;

    if (this.speechSynth && !this.isMuted) {
      try {
        this.speechSynth.cancel(); // Stop any pending utterances
        const utterance = new SpeechSynthesisUtterance(phrase);
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        utterance.rate = 1.05; // Crisp tournament umpire pacing
        utterance.pitch = 0.98;
        utterance.volume = this.voiceVol * (this.isMuted ? 0 : 1);
        this.speechSynth.speak(utterance);
        return;
      } catch {
        // Fallback to chime
      }
    }

    // Fallback electronic scoreboard chime
    this.playScoreChime();
  }

  public playScoreChime() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  /**
   * Menu button click
   */
  public playMenuClick() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Victory Fanfare
   */
  public playVictoryFanfare() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.18 }, // G5
      { f: 1046.5, d: 0.55 }, // C6
    ];

    let t = now;
    melody.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + note.d + 0.05);

      t += note.d * 0.85;
    });

    this.playCrowdApplause('roar');
  }
}

export const sound = new SoundEngine();
