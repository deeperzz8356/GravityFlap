class SoundService {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  bgmAudio: HTMLAudioElement | null = null;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5; // Master volume
      }
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    } else if (!this.ctx) {
      this.init();
    }
  }

  playFlip() {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    // Whoop sound (low to high)
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playScore() {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'triangle';
    // High ping
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.setValueAtTime(1200, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playCrash() {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth';
    // Low crunch
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.3);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  playPowerUp() {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    // Magical chime (arpeggio-like slide)
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  playShieldBreak() {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playBGM() {
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/a1.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.3; // Set a reasonable volume
    }
    this.bgmAudio.play().catch(e => console.log("Audio play failed:", e));
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  playMagnet() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.5);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  playGhost() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 1.0);

    // Tremolo effect
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 10;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start(t);
    lfo.stop(t + 1.0);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.0);

    osc.start(t);
    osc.stop(t + 1.0);
  }
}

export const soundService = new SoundService();