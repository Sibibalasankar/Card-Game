// Sound effects generator using Native Web Audio API
// No assets to download, 100% reliable, runs instantly in all modern browsers

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isEnabled = localStorage.getItem('kazhuthai_sound') !== 'false';
    this.musicInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  toggle(state) {
    this.isEnabled = state;
    localStorage.setItem('kazhuthai_sound', state ? 'true' : 'false');
    if (!state && this.ctx) {
      this.ctx.suspend();
    } else if (state && this.ctx) {
      this.ctx.resume();
    }
  }

  playCardPlay() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Short card paper sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playShuffle() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Simulate shuffling using noise bursts
    const bufferSize = this.ctx.sampleRate * 0.08; // 80ms buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Play 4 quick shuffle bursts
    for (let j = 0; j < 5; j++) {
      const startTime = this.ctx.currentTime + (j * 0.12);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 3;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start(startTime);
      source.stop(startTime + 0.08);
    }
  }

  playTurnWarning() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playVictory() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Rich C-Major Arpeggio (Winner bells!)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const time = this.ctx.currentTime + (idx * 0.08);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

      osc.start(time);
      osc.stop(time + 0.6);
    });
  }

  playLose() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Sad descending chord progression
    const freqs = [311.13, 293.66, 277.18, 220.00]; // Eb4, D4, Db4, A3

    freqs.forEach((freq, idx) => {
      const time = this.ctx.currentTime + (idx * 0.18);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

      osc.start(time);
      osc.stop(time + 0.8);
    });
  }

  playClick() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

export const sounds = new SoundManager();
