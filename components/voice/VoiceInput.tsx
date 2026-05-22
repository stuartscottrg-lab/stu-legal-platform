'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const hasSR = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setSupported(hasSR);
  }, []);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-GB';
    r.continuous = false;
    r.interimResults = false;

    r.onstart = () => setListening(true);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onTranscript(text);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);

    recognitionRef.current = r;
    r.start();
  }, [supported, listening, onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (!supported) return null;

  return (
    <button
      onClick={listening ? stop : start}
      disabled={disabled}
      title={listening ? 'Stop recording' : 'Speak to Stu'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        border: listening ? '2px solid #ef4444' : '1px solid var(--c-border)',
        background: listening ? 'rgba(239,68,68,0.08)' : 'none',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s', position: 'relative',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {listening ? (
        <>
          <Square size={11} color="#ef4444" fill="#ef4444" />
          {/* Pulse rings */}
          <span style={{
            position: 'absolute', inset: -4,
            borderRadius: '50%', border: '2px solid rgba(239,68,68,0.3)',
            animation: 'voicePulse 1.2s ease-out infinite',
          }} />
          <span style={{
            position: 'absolute', inset: -8,
            borderRadius: '50%', border: '2px solid rgba(239,68,68,0.15)',
            animation: 'voicePulse 1.2s ease-out 0.4s infinite',
          }} />
        </>
      ) : (
        <Mic size={13} color="var(--c-text-3)" />
      )}
      <style>{`
        @keyframes voicePulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </button>
  );
}

/* ─── Text-to-speech for Stu's responses ─── */
let stuVoice: SpeechSynthesisVoice | null = null;

function getBestMaleVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  // Priority: Daniel (UK male), then any en-GB male, then en-US male
  const preferred = [
    'Daniel',           // macOS UK English — warm, natural
    'Arthur',           // macOS UK English
    'Malcolm',          // some systems
    'Google UK English Male',
    'Microsoft George', // Windows UK male
    'Microsoft Ryan',   // Windows UK male
  ];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  // Fallback: any en-GB voice
  return voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en')) || null;
}

export function speakText(text: string) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel(); // stop any current speech

  // Strip markdown from text
  const clean = text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);

  if (!stuVoice) stuVoice = getBestMaleVoice();
  if (stuVoice) utterance.voice = stuVoice;

  utterance.lang = 'en-GB';
  utterance.pitch = 0.88;  // slightly lower = warmer, more masculine
  utterance.rate = 0.92;   // slightly slower = more deliberate and considered
  utterance.volume = 0.95;

  speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// Pre-load voices (browsers load them async)
if (typeof window !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => {
    stuVoice = getBestMaleVoice();
  };
}
