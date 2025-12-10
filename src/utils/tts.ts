
import { synthesizeSpeech } from '../services/geminiService';

// Helper to convert Base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to wrap PCM data in a WAV container
// Gemini TTS returns 24000Hz, 1 channel, 16-bit PCM
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): Blob {
  const headerLength = 44;
  const dataLength = pcmData.length;
  const buffer = new ArrayBuffer(headerLength + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  // file length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(8, 'WAVE');
  // format chunk identifier
  writeString(12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  // write the PCM samples
  const pcmArray = new Uint8Array(buffer, headerLength);
  pcmArray.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

// NEW: Fetch audio URL without playing (for preloading)
export async function fetchSmartAudioUrl(text: string): Promise<string | null> {
  try {
    const audioContent = await synthesizeSpeech(text);
    if (audioContent) {
      const pcmBytes = base64ToUint8Array(audioContent);
      const wavBlob = pcmToWav(pcmBytes);
      return URL.createObjectURL(wavBlob);
    }
    return null;
  } catch (e) {
    console.warn("Smart TTS Fetch Failed:", e);
    return null;
  }
}

export async function speakTextSmart(text: string, onEnd?: () => void, preloadedUrl?: string): Promise<HTMLAudioElement | SpeechSynthesisUtterance> {
  // 1. Browser TTS Fallback Function
  const fallbackToBrowserTTS = () => {
    window.speechSynthesis.cancel(); 

    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    const femaleArabic = voices.find(
      v =>
        v.lang.startsWith("ar") &&
        (v.name.includes("Female") ||
         v.name.includes("Google") ||
         v.name.includes("Salma") ||
         v.name.includes("Laila") ||
         v.name.includes("Zahra"))
    );

    if (femaleArabic) utter.voice = femaleArabic;
    else {
        const anyArabic = voices.find(v => v.lang.startsWith("ar"));
        if (anyArabic) utter.voice = anyArabic;
    }

    utter.lang = "ar-EG";
    utter.rate = 0.9;
    utter.pitch = 1.0;
    utter.text = text
      .replace(/،/g, " ... ")
      .replace(/\. /g, ".  ")
      .replace(/-/g, " - ")
      .replace(/\*/g, "");

    if (onEnd) {
      utter.onend = onEnd;
      utter.onerror = (e) => {
        console.error("Browser TTS Error:", e);
        onEnd();
      };
    }

    window.speechSynthesis.speak(utter);
    return utter;
  };

  try {
    // 2. Use Preloaded URL or Fetch New
    let wavUrl = preloadedUrl;
    
    if (!wavUrl) {
        wavUrl = await fetchSmartAudioUrl(text) || undefined;
    }

    if (wavUrl) {
      const audio = new Audio(wavUrl);
      
      if (onEnd) {
        audio.onended = () => {
            onEnd();
            // If we created the URL here (not preloaded), we should revoke it
            if (!preloadedUrl) URL.revokeObjectURL(wavUrl!); 
        };
        audio.onerror = (e) => {
          console.error("Audio Object Error:", e);
          fallbackToBrowserTTS();
        };
      }

      try {
        await audio.play();
        return audio;
      } catch (playError) {
        console.warn("Audio Playback Blocked, falling back:", playError);
        return fallbackToBrowserTTS();
      }
    } else {
      return fallbackToBrowserTTS();
    }

  } catch (e) {
    console.warn("Smart TTS Failed, falling back...", e);
    return fallbackToBrowserTTS();
  }
}
