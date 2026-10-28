import { AudioSettings } from '../types';

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private screenStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isTestingMic: boolean = false;
  private testLoopbackGain: GainNode | null = null;

  public onVolumeChange?: (volume: number) => void;
  public onSpeakingChange?: (speaking: boolean) => void;
  public isSpeaking: boolean = false;

  // Real-time DSP Audio Nodes
  private highPassFilter: BiquadFilterNode | null = null;
  private notchFilter: BiquadFilterNode | null = null;
  private clarityFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private settings: AudioSettings = {
    inputDeviceId: 'default',
    outputDeviceId: 'default',
    inputVolume: 100,
    outputVolume: 100,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    noiseReductionMode: 'ai_cleaner',
    audioPreset: 'esports',
    inputMode: 'activity',
    pushToTalkKey: 'Space',
    sensitivityThreshold: 15,
    screenShareResolution: '1080p',
    screenShareFrameRate: 60,
  };

  constructor(initialSettings?: Partial<AudioSettings>) {
    if (initialSettings) {
      this.settings = { ...this.settings, ...initialSettings };
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.micGain && newSettings.inputVolume !== undefined) {
      this.micGain.gain.value = newSettings.inputVolume / 100;
    }
    this.applyDspPipeline();
  }

  public setPreset(preset: 'esports' | 'ai_cleaner' | 'strong' | 'natural') {
    switch (preset) {
      case 'esports':
        this.updateSettings({
          audioPreset: 'esports',
          noiseReductionMode: 'ai_cleaner',
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sensitivityThreshold: 14,
        });
        break;
      case 'ai_cleaner':
        this.updateSettings({
          audioPreset: 'ai_cleaner',
          noiseReductionMode: 'ai_cleaner',
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sensitivityThreshold: 18,
        });
        break;
      case 'strong':
        this.updateSettings({
          audioPreset: 'strong',
          noiseReductionMode: 'strong',
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sensitivityThreshold: 22,
        });
        break;
      case 'natural':
        this.updateSettings({
          audioPreset: 'natural',
          noiseReductionMode: 'standard',
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: false,
          sensitivityThreshold: 10,
        });
        break;
    }
  }

  public async getAvailableDevices(): Promise<{ inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return { inputs: [], outputs: [] };
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter(d => d.kind === 'audioinput');
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      return { inputs, outputs };
    } catch (err) {
      console.warn('Error enumerating devices:', err);
      return { inputs: [], outputs: [] };
    }
  }

  private applyDspPipeline() {
    if (!this.highPassFilter || !this.notchFilter || !this.clarityFilter || !this.compressor) return;

    const mode = this.settings.noiseReductionMode;

    if (mode === 'off') {
      // Bypass filters
      this.highPassFilter.frequency.value = 20; // inaudible
      this.notchFilter.Q.value = 0.001;
      this.clarityFilter.gain.value = 0;
      this.compressor.threshold.value = 0;
    } else if (mode === 'standard') {
      // Gentle rumble cut
      this.highPassFilter.frequency.value = 65;
      this.notchFilter.frequency.value = 60;
      this.notchFilter.Q.value = 2;
      this.clarityFilter.gain.value = 1.0;
      this.compressor.threshold.value = -18;
      this.compressor.ratio.value = 2.5;
    } else if (mode === 'ai_cleaner') {
      // Esports Vocal Clarity DSP:
      // Cuts desk bumps & fan rumble below 85Hz, removes 50/60Hz AC hum, boosts 3.2kHz vocal harmonics for clear callouts
      this.highPassFilter.frequency.value = 85;
      this.notchFilter.frequency.value = 60;
      this.notchFilter.Q.value = 6;
      this.clarityFilter.frequency.value = 3200;
      this.clarityFilter.gain.value = 3.5; // +3.5dB clarity for tournament calls
      this.compressor.threshold.value = -24;
      this.compressor.ratio.value = 4.0;
      this.compressor.knee.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
    } else if (mode === 'strong') {
      // Aggressive noise reduction: cuts up to 120Hz mechanical noise & fans
      this.highPassFilter.frequency.value = 120;
      this.notchFilter.frequency.value = 60;
      this.notchFilter.Q.value = 10;
      this.clarityFilter.frequency.value = 3000;
      this.clarityFilter.gain.value = 2.0;
      this.compressor.threshold.value = -28;
      this.compressor.ratio.value = 6.0;
      this.compressor.knee.value = 6;
      this.compressor.attack.value = 0.002;
      this.compressor.release.value = 0.18;
    }
  }

  public async startMicrophone(deviceId?: string): Promise<MediaStream | null> {
    try {
      this.stopMicrophone();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId && deviceId !== 'default' ? { exact: deviceId } : undefined,
          echoCancellation: this.settings.echoCancellation,
          noiseSuppression: this.settings.noiseSuppression,
          autoGainControl: this.settings.autoGainControl,
        },
        video: false,
      };

      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create audio processing nodes
      this.micSource = this.audioCtx.createMediaStreamSource(this.micStream);
      this.micGain = this.audioCtx.createGain();
      this.micGain.gain.value = this.settings.inputVolume / 100;

      // Real DSP nodes
      this.highPassFilter = this.audioCtx.createBiquadFilter();
      this.highPassFilter.type = 'highpass';

      this.notchFilter = this.audioCtx.createBiquadFilter();
      this.notchFilter.type = 'notch';

      this.clarityFilter = this.audioCtx.createBiquadFilter();
      this.clarityFilter.type = 'peaking';
      this.clarityFilter.frequency.value = 3200;
      this.clarityFilter.Q.value = 1.2;

      this.compressor = this.audioCtx.createDynamicsCompressor();

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      // Connect DSP chain:
      // micSource -> highPass -> notch -> clarity -> compressor -> micGain -> analyser
      this.micSource.connect(this.highPassFilter);
      this.highPassFilter.connect(this.notchFilter);
      this.notchFilter.connect(this.clarityFilter);
      this.clarityFilter.connect(this.compressor);
      this.compressor.connect(this.micGain);
      this.micGain.connect(this.analyser);

      this.applyDspPipeline();
      this.startVolumeMonitoring();

      return this.micStream;
    } catch (err) {
      console.error('Failed to access microphone:', err);
      return null;
    }
  }

  public stopMicrophone() {
    this.stopVolumeMonitoring();
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.highPassFilter) {
      this.highPassFilter.disconnect();
      this.highPassFilter = null;
    }
    if (this.notchFilter) {
      this.notchFilter.disconnect();
      this.notchFilter = null;
    }
    if (this.clarityFilter) {
      this.clarityFilter.disconnect();
      this.clarityFilter = null;
    }
    if (this.compressor) {
      this.compressor.disconnect();
      this.compressor = null;
    }
    if (this.micGain) {
      this.micGain.disconnect();
      this.micGain = null;
    }
    if (this.testLoopbackGain) {
      this.testLoopbackGain.disconnect();
      this.testLoopbackGain = null;
    }
    this.isTestingMic = false;
  }

  public setMute(muted: boolean) {
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
    if (muted && this.isSpeaking) {
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
    }
  }

  private startVolumeMonitoring() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkVolume = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Convert to 0-100 percentage
      const volumeLevel = Math.min(100, Math.round((average / 128) * 100));

      this.onVolumeChange?.(volumeLevel);

      // Speaking threshold logic
      const shouldSpeak = volumeLevel > this.settings.sensitivityThreshold;
      if (shouldSpeak !== this.isSpeaking) {
        this.isSpeaking = shouldSpeak;
        this.onSpeakingChange?.(shouldSpeak);
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }

  private stopVolumeMonitoring() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // Real Mic Test Mode: loops microphone back to headphones/speaker with visualizer
  public async startMicTest(onWaveformData?: (data: Uint8Array) => void): Promise<boolean> {
    if (!this.micStream) {
      const stream = await this.startMicrophone(this.settings.inputDeviceId);
      if (!stream) return false;
    }
    if (!this.audioCtx || !this.micGain) return false;

    this.isTestingMic = true;
    this.testLoopbackGain = this.audioCtx.createGain();
    this.testLoopbackGain.gain.value = 0.5; // loopback volume

    this.micGain.connect(this.testLoopbackGain);
    this.testLoopbackGain.connect(this.audioCtx.destination);

    if (onWaveformData && this.analyser) {
      const waveArray = new Uint8Array(this.analyser.fftSize);
      const drawLoop = () => {
        if (!this.isTestingMic || !this.analyser) return;
        this.analyser.getByteTimeDomainData(waveArray);
        onWaveformData(waveArray);
        requestAnimationFrame(drawLoop);
      };
      drawLoop();
    }

    return true;
  }

  public stopMicTest() {
    this.isTestingMic = false;
    if (this.testLoopbackGain) {
      this.testLoopbackGain.disconnect();
      this.testLoopbackGain = null;
    }
  }

  // Screen Sharing via getDisplayMedia
  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      this.stopScreenShare();

      let frameRate = this.settings.screenShareFrameRate || 60;
      let width = 1920;
      let height = 1080;

      if (this.settings.screenShareResolution === '720p') {
        width = 1280;
        height = 720;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate },
          displaySurface: 'monitor',
        },
        audio: true, // captures system audio if supported by browser
      });

      this.screenStream = stream;

      // Handle user clicking native browser "Stop sharing" bar
      stream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      return stream;
    } catch (err) {
      console.warn('Screen share canceled or not supported:', err);
      return null;
    }
  }

  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
  }

  public getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  public getMicStream(): MediaStream | null {
    return this.micStream;
  }
}
