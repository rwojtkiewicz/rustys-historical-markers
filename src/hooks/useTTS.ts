import { useState, useEffect, useRef, useCallback } from 'react';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  voiceName?: string | null;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
}

export function useTTS() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState<string>('');
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      if (avail.length > 0) {
        setVoices(avail);
      }
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentCharIndex(0);
  }, []);

  const speak = useCallback(
    (text: string, options: TTSOptions = {}) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported on this browser');
        return;
      }

      if (!text || text.trim().length === 0) return;

      // Prevent redundant speech restart if already speaking the exact same text
      if (isSpeaking && currentText === text) {
        console.debug('Speech already in progress for this text');
        return;
      }

      // Cancel any ongoing speech
      stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      // Match voice with robust fallback
      if (voices.length > 0) {
        let selectedVoice: SpeechSynthesisVoice | undefined;
        if (options.voiceName) {
          selectedVoice = voices.find((v) => v.name === options.voiceName);
        }
        if (!selectedVoice) {
          selectedVoice =
            voices.find((v) => v.lang.startsWith('en') && v.localService) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
        }
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentText(text);
        setCurrentCharIndex(0);
      };

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          setCurrentCharIndex(e.charIndex);
          if (options.onBoundary) options.onBoundary(e.charIndex);
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentCharIndex(0);
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (e) => {
        const errType = e.error || 'unknown';
        // 'canceled' and 'interrupted' are standard events when stop() or a new speak() cancels previous audio
        if (errType === 'canceled' || errType === 'interrupted') {
          console.debug('TTS utterance cancelled or interrupted');
        } else {
          console.warn('TTS utterance notice:', errType);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentCharIndex(0);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
        setIsSpeaking(false);
        setIsPaused(false);
      }
    },
    [voices, stop, isSpeaking, currentText]
  );

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  return {
    voices,
    isSpeaking,
    isPaused,
    currentText,
    currentCharIndex,
    speak,
    pause,
    resume,
    stop,
  };
}
