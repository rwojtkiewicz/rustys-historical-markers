import { useState, useEffect, useRef, useCallback } from 'react';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  voiceName?: string | null;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
  id?: string; // Optional unique marker ID for deduplication
}

export interface SpeechQueueItem {
  id?: string;
  text: string;
  options?: TTSOptions;
}

export function useTTS() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState<string>('');
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [queueLength, setQueueLength] = useState<number>(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechQueueRef = useRef<SpeechQueueItem[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const currentlySpeakingIdRef = useRef<string | null>(null);
  const playedMarkerIdsRef = useRef<Set<string>>(new Set());

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

  // Stop current speech and purge entire queue
  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = [];
    isSpeakingRef.current = false;
    currentlySpeakingIdRef.current = null;
    setQueueLength(0);
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentCharIndex(0);
    setCurrentText('');
  }, []);

  // Internal execution of a speech item
  const playItem = useCallback(
    (item: SpeechQueueItem) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!item.text || item.text.trim().length === 0) return;

      const utterance = new SpeechSynthesisUtterance(item.text);
      utteranceRef.current = utterance;

      const opts = item.options || {};
      utterance.rate = opts.rate ?? 1.0;
      utterance.pitch = opts.pitch ?? 1.0;

      // Select matching voice
      if (voices.length > 0) {
        let selectedVoice: SpeechSynthesisVoice | undefined;
        if (opts.voiceName) {
          selectedVoice = voices.find((v) => v.name === opts.voiceName);
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

      // Mark as speaking and record played ID
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentText(item.text);
      setCurrentCharIndex(0);
      currentlySpeakingIdRef.current = item.id || null;
      if (item.id) {
        playedMarkerIdsRef.current.add(item.id);
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          setCurrentCharIndex(e.charIndex);
          if (opts.onBoundary) opts.onBoundary(e.charIndex);
        }
      };

      const handleSpeechComplete = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentCharIndex(0);
        currentlySpeakingIdRef.current = null;

        if (opts.onEnd) {
          try {
            opts.onEnd();
          } catch (err) {
            console.error('Error in onEnd callback:', err);
          }
        }

        // Sequential Playback: Check if another marker is waiting in the speech queue
        if (speechQueueRef.current.length > 0) {
          const nextItem = speechQueueRef.current.shift()!;
          setQueueLength(speechQueueRef.current.length);
          // Brief 400ms natural pause before beginning the next queued historical marker
          setTimeout(() => {
            playItem(nextItem);
          }, 400);
        }
      };

      utterance.onend = handleSpeechComplete;

      utterance.onerror = (e) => {
        const errType = e.error || 'unknown';
        if (errType === 'canceled' || errType === 'interrupted') {
          console.debug('TTS utterance ended/interrupted');
        } else {
          console.warn('TTS utterance notice:', errType);
        }
        handleSpeechComplete();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
        handleSpeechComplete();
      }
    },
    [voices]
  );

  // Public speak method with active check, queuing, and deduplication
  const speak = useCallback(
    (text: string, options: TTSOptions = {}) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported on this browser');
        return;
      }

      if (!text || text.trim().length === 0) return;

      const markerId = options.id;

      // 1. Prevent Duplicates: Check if marker is already currently speaking, queued, or already played
      if (markerId) {
        if (
          currentlySpeakingIdRef.current === markerId ||
          playedMarkerIdsRef.current.has(markerId) ||
          speechQueueRef.current.some((q) => q.id === markerId)
        ) {
          console.debug(`Marker [${markerId}] is already active, queued, or previously played. Ignoring duplicate.`);
          return;
        }
      }

      // 2. Check Active State: Is speech synthesis currently speaking?
      const isCurrentlyActive =
        isSpeakingRef.current ||
        (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking);

      if (isCurrentlyActive) {
        // 3. Queue Pending Marker: Add to speechQueue instead of calling cancel()
        speechQueueRef.current.push({
          id: markerId,
          text,
          options,
        });
        setQueueLength(speechQueueRef.current.length);
        console.debug(
          `Added marker [${markerId || 'unnamed'}] to Sequential Speech Queue (Position: ${speechQueueRef.current.length})`
        );
        return;
      }

      // 4. If idle, play immediately
      playItem({ id: markerId, text, options });
    },
    [playItem]
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

  const clearPlayedHistory = useCallback(() => {
    playedMarkerIdsRef.current.clear();
  }, []);

  return {
    voices,
    isSpeaking,
    isPaused,
    currentText,
    currentCharIndex,
    queueLength,
    speak,
    pause,
    resume,
    stop,
    clearPlayedHistory,
  };
}
