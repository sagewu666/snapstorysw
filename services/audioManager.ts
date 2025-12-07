
import { generateSpeech } from './geminiService';

export class AudioManager {
  private static instance: AudioManager;
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  
  private audioCache: Map<string, string> = new Map();
  private currentPlayId: number = 0;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    return this.audioCtx;
  }

  public stopAll() {
    this.currentPlayId++;

    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {}
      this.currentSource = null;
    }
    
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
  }

  public playBrowserTTS(text: string) {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      
      try {
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9; 
          utterance.pitch = 1.1; 
          
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => 
             (v.name.includes('Google') && v.lang.includes('en-US')) || 
             (v.lang.includes('en') && v.name.includes('Female'))
          ) || voices.find(v => v.lang.includes('en')) || voices[0];
          
          if (preferredVoice) utterance.voice = preferredVoice;
          
          window.speechSynthesis.speak(utterance);
      } catch (e) {
          console.error("Browser TTS failed", e);
      }
  }

  public async playGeminiAudio(base64Audio: string, playId: number): Promise<void> {
    if (playId !== this.currentPlayId) return;

    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    try {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const float32Array = new Float32Array(len / 2);
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < len / 2; i++) {
            float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32Array.length, 24000); 
        buffer.getChannelData(0).set(float32Array);

        if (playId !== this.currentPlayId) return;

        if (window.speechSynthesis) window.speechSynthesis.cancel();

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        
        this.currentSource = source;
        source.start();
        
        source.onended = () => {
            if (this.currentSource === source) {
                this.currentSource = null;
            }
        };
    } catch (e) {
        console.error("Audio Decode Error", e);
    }
  }

  public async speak(text: string) {
    if (!text) return;
    
    // Ensure Context is Active (Browser Policy)
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
       ctx.resume().catch(() => {});
    }

    this.stopAll();
    const myPlayId = this.currentPlayId;

    // 1. Try Cache
    if (this.audioCache.has(text)) {
        try {
            await this.playGeminiAudio(this.audioCache.get(text)!, myPlayId);
            return;
        } catch(e) {}
    } 
    
    // 2. Try Fetching (Increased Timeout to 15000ms)
    try {
        const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 15000)
        );

        const base64 = await Promise.race([
            generateSpeech(text),
            timeoutPromise
        ]);

        if (myPlayId !== this.currentPlayId) return;

        if (base64) {
            this.audioCache.set(text, base64 as string); 
            await this.playGeminiAudio(base64 as string, myPlayId);
            return;
        } 
    } catch (e) {
        // Fallback
    }

    if (myPlayId !== this.currentPlayId) return;

    // 3. Fallback to Browser
    this.playBrowserTTS(text);
  }
}

export const audioManager = AudioManager.getInstance();
