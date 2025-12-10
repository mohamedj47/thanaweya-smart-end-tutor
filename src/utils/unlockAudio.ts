export let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

export function unlockAudio() {
  // Singleton pattern for AudioContext
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  // If already unlocked, do nothing
  if (audioUnlocked || !audioCtx) return;

  const unlock = () => {
    if (!audioCtx) return;

    // Create a silent buffer to wake up the audio engine
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    
    // Play the silent buffer
    if (source.start) {
      source.start(0);
    } else if ((source as any).noteOn) {
      (source as any).noteOn(0);
    }

    // Resume the context if suspended
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        audioUnlocked = true;
      });
    } else {
      audioUnlocked = true;
    }

    // Remove listeners once triggered
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("keydown", unlock);
    document.removeEventListener("mousedown", unlock);
  };

  // Attach to all possible interaction events
  document.addEventListener("click", unlock);
  document.addEventListener("touchstart", unlock);
  document.addEventListener("keydown", unlock);
  document.addEventListener("mousedown", unlock);
}
