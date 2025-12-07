
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Gentle Tap (Soft Sine)
export const playClick = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Very pure sine wave, short envelope
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
        
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        osc.start(t);
        osc.stop(t + 0.05);
    } catch(e) {}
};

export const playToggle = () => playClick();

// Soft "Pop" (Bubble sound, very pleasant)
export const playPop = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(500, t + 0.08);
        
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        
        osc.start(t);
        osc.stop(t + 0.08);
    } catch(e) {}
};

export const playBubble = () => playPop();

// Gentle "Ding" (Not piercing)
export const playPing = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(660, t); // E5
        
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        
        osc.start(t);
        osc.stop(t + 0.6);
    } catch(e) {}
};

// Magic Sparkle (Subtle)
export const playMagic = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);

        // A nice major chord arpeggio, very fast
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.connect(gain);
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.start(t + i * 0.05);
            osc.stop(t + 0.5);
        });
    } catch(e) {}
};

// Shutter: Short, crisp click (No white noise)
export const playShutter = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine'; // Sine is softer than square/saw
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        osc.start(t);
        osc.stop(t + 0.05);

    } catch(e) {}
};

// Delete: Low "Bloop" (Not an error buzz)
export const playDelete = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.1);
        
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.1);
        
        osc.start(t);
        osc.stop(t + 0.1);
    } catch(e) {}
}

// Success: Major Chord (Happy)
export const playSuccess = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        
        const playToned = (freq: number, start: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.05, t + start);
            gain.gain.exponentialRampToValueAtTime(0.001, t + start + 0.4);
            
            osc.start(t + start);
            osc.stop(t + start + 0.4);
        };
        
        // C Major Arpeggio
        playToned(523.25, 0);   // C5
        playToned(659.25, 0.1); // E5
        playToned(783.99, 0.2); // G5
        playToned(1046.50, 0.3); // C6
    } catch(e) {}
};

// Error: Dull "Thud" (No buzzing)
export const playError = () => {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Low pitch sine wave pitch drop = "Bonk"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.1);
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.1);
        
        osc.start(t);
        osc.stop(t + 0.1);
    } catch(e) {}
};

export const playFanfare = () => playSuccess();

export const playPageTurn = () => {
    // Subtle "Swish"
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine'; // Use sine for smoother sound
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(400, t + 0.1);
        
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        osc.start(t);
        osc.stop(t + 0.1);
    } catch(e) {}
};
