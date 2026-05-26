'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

/* ─── Types ─── */
type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';
interface Msg { role: 'user' | 'assistant'; content: string; }

interface Props {
  onClose: () => void;
}

/* ─── Voice selection ─── */
function getBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  const preferred = [
    'Daniel', 'Arthur', 'Google UK English Male',
    'Microsoft George Online', 'Microsoft Ryan Online', 'Microsoft George', 'Microsoft Ryan',
  ];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  return voices.find(v => v.lang === 'en-GB') ?? voices.find(v => v.lang.startsWith('en')) ?? null;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ─── Canvas spiral renderer ─── */
function drawSpiral(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  t: number,
  state: VoiceState,
  amplitude: number,
  isDark: boolean,
) {
  const ARMS = 3;
  const TURNS = 3.2;
  const POINTS = 140;

  const rotSpeed = state === 'thinking' ? 1.6 : state === 'speaking' ? 0.7 : state === 'listening' ? 0.4 : 0.2;

  const amp = Math.min(1, amplitude);
  const breathe = state === 'listening'
    ? 1 + (0.08 + amp * 0.14) * Math.sin(t * 4)
    : state === 'speaking'
    ? 1 + (0.06 + amp * 0.22) * Math.sin(t * 5.5)
    : state === 'thinking'
    ? 1 + 0.07 * Math.sin(t * 9)
    : 1 + 0.03 * Math.sin(t * 1.4);

  const maxR = Math.min(cx, cy) * 0.68 * breathe;
  const minR = 16;

  // Ambient glow
  const glowAlpha = isDark ? 0.1 : 0.06;
  const ambientColor = isDark ? '37,99,235' : '29,78,216';
  const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR + 40);
  ambient.addColorStop(0, `rgba(${ambientColor},${glowAlpha * 1.5})`);
  ambient.addColorStop(0.5, `rgba(${ambientColor},${glowAlpha})`);
  ambient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, maxR + 40, 0, Math.PI * 2);
  ctx.fillStyle = ambient;
  ctx.fill();

  // Arms
  for (let arm = 0; arm < ARMS; arm++) {
    const armOffset = (arm / ARMS) * Math.PI * 2;

    // Main arm path
    ctx.beginPath();
    for (let i = 0; i <= POINTS; i++) {
      const p = i / POINTS;
      const theta = p * Math.PI * 2 * TURNS + armOffset + t * rotSpeed;
      const r = minR + p * (maxR - minR);
      const wave = state === 'speaking' ? Math.sin(p * 10 + t * 7) * amp * 14 : 0;
      const x = cx + (r + wave) * Math.cos(theta);
      const y = cy + (r + wave) * Math.sin(theta);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }

    const baseAlpha = isDark
      ? (state === 'idle' ? 0.4 : 0.8)
      : (state === 'idle' ? 0.3 : 0.65);

    const grad = ctx.createLinearGradient(cx - maxR, cy - maxR, cx + maxR, cy + maxR);
    if (state === 'thinking') {
      grad.addColorStop(0, `rgba(29,78,216,${baseAlpha * 0.5})`);
      grad.addColorStop(0.5, `rgba(37,99,235,${baseAlpha})`);
      grad.addColorStop(1, `rgba(147,197,253,${baseAlpha * 0.4})`);
    } else if (state === 'speaking') {
      grad.addColorStop(0, `rgba(56,189,248,${baseAlpha * 0.6})`);
      grad.addColorStop(0.5, `rgba(96,165,250,${baseAlpha})`);
      grad.addColorStop(1, `rgba(186,230,253,${baseAlpha * 0.5})`);
    } else if (state === 'listening') {
      grad.addColorStop(0, `rgba(37,99,235,${baseAlpha * 0.7})`);
      grad.addColorStop(0.5, `rgba(96,165,250,${baseAlpha})`);
      grad.addColorStop(1, `rgba(147,197,253,${baseAlpha * 0.5})`);
    } else {
      grad.addColorStop(0, `rgba(29,78,216,${baseAlpha * 0.6})`);
      grad.addColorStop(0.5, `rgba(96,165,250,${baseAlpha})`);
      grad.addColorStop(1, `rgba(147,197,253,${baseAlpha * 0.3})`);
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth = state === 'listening' ? 1.6 + amp * 2.2
      : state === 'speaking' ? 1.8 + amp * 1.6
      : 1.4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Particles
    const COUNT = 22;
    for (let i = 0; i < COUNT; i++) {
      const p = (i / COUNT) * 0.85 + 0.1;
      const theta = p * Math.PI * 2 * TURNS + armOffset + t * rotSpeed;
      const r = minR + p * (maxR - minR);
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      const opacity = (0.25 + p * 0.75) * (state === 'idle' ? 0.45 : 0.9);
      const radius = p * (state === 'listening' ? 3.2 + amp * 1.5 : 2.4);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(147,197,253,${opacity})`;
      ctx.fill();
    }
  }

  // Center orb
  const orbSize = state === 'listening' ? 26 + amp * 14 : state === 'speaking' ? 28 + amp * 10 : state === 'thinking' ? 20 : 22;
  const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbSize);
  orb.addColorStop(0, 'rgba(219,234,254,0.98)');
  orb.addColorStop(0.3, 'rgba(147,197,253,0.85)');
  orb.addColorStop(0.7, 'rgba(96,165,250,0.5)');
  orb.addColorStop(1, 'rgba(37,99,235,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, orbSize, 0, Math.PI * 2);
  ctx.fillStyle = orb;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(239,246,255,0.98)';
  ctx.fill();
}

/* ─── Main component ─── */
export default function VoiceChat({ onClose }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const recognitionRef = useRef<any>(null);
  const amplitudeRef = useRef(0);
  const stateRef = useRef<VoiceState>('idle');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interimRef = useRef('');
  const isListeningRef = useRef(false);

  // Web Audio API for real microphone amplitude
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [supported, setSupported] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [lastUserMsg, setLastUserMsg] = useState('');

  const setState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setVoiceState(s);
  }, []);

  /* ─── Real mic amplitude via Web Audio API ─── */
  const startAudioAnalysis = useCallback(async () => {
    if (audioCtxRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      audioDataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    } catch {
      // Mic permission denied — fall back to synthetic amplitude
    }
  }, []);

  /* ─── Canvas animation loop ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);

    function loop() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      const cx = w / 2;
      const cy = h / 2;
      const t = (Date.now() - startTimeRef.current) / 1000;

      // Real mic amplitude
      if (analyserRef.current && audioDataRef.current && stateRef.current === 'listening') {
        analyserRef.current.getByteFrequencyData(audioDataRef.current);
        const slice = audioDataRef.current.slice(0, 20);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        amplitudeRef.current = Math.min(1, avg / 80);
      } else if (stateRef.current === 'speaking') {
        // Synthetic pulse while TTS plays
        amplitudeRef.current = 0.3 + Math.sin(t * 8) * 0.2 + Math.random() * 0.15;
      } else if (stateRef.current === 'thinking') {
        amplitudeRef.current = 0.15 + Math.sin(t * 4) * 0.1;
      } else {
        amplitudeRef.current *= 0.9;
      }

      ctx.clearRect(0, 0, w, h);

      // Theme-aware background
      if (isDark) {
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.85);
        bg.addColorStop(0, 'rgba(5,8,25,1)');
        bg.addColorStop(0.5, 'rgba(3,5,18,1)');
        bg.addColorStop(1, 'rgba(2,3,12,1)');
        ctx.fillStyle = bg;
      } else {
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.85);
        bg.addColorStop(0, 'rgba(240,245,255,1)');
        bg.addColorStop(0.5, 'rgba(235,242,255,1)');
        bg.addColorStop(1, 'rgba(228,236,255,1)');
        ctx.fillStyle = bg;
      }
      ctx.fillRect(0, 0, w, h);

      drawSpiral(ctx, cx, cy, t, stateRef.current, amplitudeRef.current, isDark);
      rafRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  /* ─── TTS speak ─── */
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const clean = stripMarkdown(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);

    // Try to get voice — retry if voices not loaded yet
    const trySetVoice = () => {
      const voice = getBestVoice();
      if (voice) utterance.voice = voice;
    };
    trySetVoice();
    setTimeout(trySetVoice, 200);

    utterance.lang = 'en-GB';
    utterance.pitch = 0.84;
    utterance.rate = 0.88;
    utterance.volume = 1;

    setState('speaking');

    utterance.onend = () => {
      setState('idle');
      setDisplayText('');
      if (!muted) setTimeout(() => startListeningFn(), 700);
    };
    utterance.onerror = () => { setState('idle'); };

    speechSynthesis.speak(utterance);
  }, [setState, muted]); // eslint-disable-line

  /* ─── Call AI ─── */
  const askAI = useCallback(async (userText: string, history: Msg[]) => {
    setState('thinking');
    setDisplayText('');
    setLastUserMsg(userText);

    const newHistory: Msg[] = [...history, { role: 'user', content: userText }];
    setMessages(newHistory);

    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
      });
      if (!res.ok) throw new Error('API error');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setDisplayText(full);
      }

      const assistantMsg: Msg = { role: 'assistant', content: full };
      setMessages(prev => [...prev, assistantMsg]);
      speak(full);
    } catch {
      setState('idle');
      setDisplayText('Connection issue — tap the mic to try again.');
      setTimeout(() => setDisplayText(''), 3000);
    }
  }, [setState, speak]);

  /* ─── Start listening ─── */
  const startListeningFn = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    if (stateRef.current === 'thinking' || stateRef.current === 'speaking') return;
    if (isListeningRef.current) return;

    // Stop any existing recognition
    try { recognitionRef.current?.abort(); } catch {}

    const r = new SR();
    r.lang = 'en-GB';
    r.continuous = true;        // Keep mic open — don't auto-stop
    r.interimResults = true;
    r.maxAlternatives = 1;

    isListeningRef.current = true;

    r.onstart = () => {
      setState('listening');
      setTranscript('');
      interimRef.current = '';
    };

    r.onresult = (e: any) => {
      // Collect all results
      let interimText = '';
      let finalText = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      const current = (finalText || interimText).trim();
      if (current) {
        interimRef.current = current;
        setTranscript(current);
      }

      // Clear previous silence timer and set a new one
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (current) {
        silenceTimerRef.current = setTimeout(() => {
          const captured = interimRef.current.trim();
          if (captured && stateRef.current === 'listening') {
            isListeningRef.current = false;
            try { r.stop(); } catch {}
            setMessages(prev => {
              askAI(captured, prev);
              return prev;
            });
          }
        }, 1500); // Submit after 1.5s silence
      }
    };

    r.onerror = (e: any) => {
      isListeningRef.current = false;
      if (e.error === 'no-speech') {
        // Restart silently if no speech detected
        if (stateRef.current === 'listening') {
          setTimeout(() => startListeningFn(), 300);
        }
      } else if (e.error !== 'aborted') {
        setState('idle');
      }
    };

    r.onend = () => {
      isListeningRef.current = false;
      if (stateRef.current === 'listening') {
        // Restart automatically if we're still in listening state
        setTimeout(() => startListeningFn(), 200);
      }
    };

    recognitionRef.current = r;
    try { r.start(); } catch {}
  }, [setState, askAI]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    isListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    setState('idle');
    setTranscript('');
    interimRef.current = '';
  }, [setState]);

  /* ─── Mount + auto-start ─── */
  useEffect(() => {
    setMounted(true);
    // Preload voices
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }
    // Start mic audio analysis
    startAudioAnalysis();
    // Auto-start listening
    const t = setTimeout(() => startListeningFn(), 600);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  /* ─── Cleanup ─── */
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      isListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch {}
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      try { audioCtxRef.current?.close(); } catch {}
    };
  }, []);

  /* ─── Theme-aware colours ─── */
  const textPrimary = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(9,9,11,0.85)';
  const textSecondary = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(9,9,11,0.45)';
  const textMuted = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(9,9,11,0.2)';
  const closeBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const closeBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const closeIcon = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(9,9,11,0.45)';
  const wordmarkColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(9,9,11,0.2)';

  const stateLabel = {
    idle: 'Tap to speak',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking',
  }[voiceState];

  const stateColour = {
    idle: isDark ? '#60a5fa' : '#2563eb',
    listening: isDark ? '#93c5fd' : '#3b82f6',
    thinking: isDark ? '#3b82f6' : '#1d4ed8',
    speaking: isDark ? '#7dd3fc' : '#0ea5e9',
  }[voiceState];

  const handleClose = () => {
    stopListening();
    speechSynthesis.cancel();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    onClose();
  };

  const handleMicClick = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'idle') {
      startListeningFn();
    }
  };

  const handleMute = () => {
    if (!muted) {
      speechSynthesis.cancel();
      if (voiceState === 'speaking') setState('idle');
    }
    setMuted(m => !m);
  };

  const exchangeCount = Math.floor(messages.length / 2);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}
    >
      {/* Full-screen canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', zIndex: 10,
      }}>
        {/* Wordmark */}
        <div style={{
          fontSize: '13px', fontWeight: 700,
          color: wordmarkColor,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          fontFamily: 'Georgia, serif',
        }}>
          Stu
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mute toggle */}
          <button
            onClick={handleMute}
            title={muted ? 'Unmute' : 'Mute voice'}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: muted ? 'rgba(37,99,235,0.2)' : closeBg,
              border: `1px solid ${muted ? 'rgba(96,165,250,0.4)' : closeBorder}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {muted
              ? <MicOff size={14} color="rgba(96,165,250,0.9)" />
              : <Mic size={14} color={closeIcon} />}
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: closeBg, border: `1px solid ${closeBorder}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <X size={15} color={closeIcon} />
          </button>
        </div>
      </div>

      {/* ── Centre content ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      }}>
        {/* Space for spiral */}
        <div style={{ height: '300px' }} />

        {/* State label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          fontSize: '12px', fontWeight: 600,
          color: stateColour, letterSpacing: '0.08em', textTransform: 'uppercase',
          opacity: 0.9, transition: 'color 0.3s ease',
          fontFamily: 'system-ui, sans-serif',
          marginBottom: '18px',
        }}>
          {voiceState === 'listening' && (
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: stateColour,
              animation: 'voiceBlink 1.1s ease-in-out infinite',
            }} />
          )}
          {voiceState === 'thinking' && (
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: stateColour, opacity: 0.7,
              animation: 'voiceSpin 1s linear infinite',
            }} />
          )}
          {stateLabel}
        </div>

        {/* Text display — transcript, AI response, or hint */}
        <div style={{
          width: 'min(540px, 90vw)', minHeight: 96,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 16px',
        }}>
          {voiceState === 'listening' && transcript && (
            <p style={{
              fontSize: '18px', color: textPrimary,
              lineHeight: 1.65, fontFamily: 'system-ui, sans-serif',
              fontWeight: 400, margin: 0,
              transition: 'color 0.2s',
            }}>
              {transcript}
            </p>
          )}
          {(voiceState === 'thinking' || voiceState === 'speaking') && displayText && (
            <p style={{
              fontSize: '18px', color: textPrimary,
              lineHeight: 1.7, fontFamily: 'Georgia, serif',
              fontWeight: 400, margin: 0, fontStyle: 'italic',
              transition: 'color 0.2s',
            }}>
              {displayText}
            </p>
          )}
          {voiceState === 'idle' && messages.length === 0 && (
            <p style={{
              fontSize: '14px', color: textMuted,
              lineHeight: 1.65, fontFamily: 'system-ui, sans-serif',
              margin: 0,
            }}>
              Ask anything about UK law — contracts, disputes, employment, property
            </p>
          )}
          {voiceState === 'idle' && messages.length > 0 && lastUserMsg && (
            <p style={{
              fontSize: '13px', color: textSecondary,
              lineHeight: 1.6, fontFamily: 'system-ui, sans-serif',
              margin: 0,
            }}>
              "{lastUserMsg}"
            </p>
          )}
        </div>
      </div>

      {/* ── Mic button (centre bottom) ── */}
      <button
        onClick={handleMicClick}
        disabled={voiceState === 'thinking' || voiceState === 'speaking'}
        style={{
          position: 'absolute', bottom: 56,
          width: 68, height: 68, borderRadius: '50%',
          background: voiceState === 'listening'
            ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.12)')
            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
          border: voiceState === 'listening'
            ? '1.5px solid rgba(96,165,250,0.55)'
            : `1.5px solid ${closeBorder}`,
          cursor: (voiceState === 'thinking' || voiceState === 'speaking') ? 'default' : 'pointer',
          zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
          opacity: (voiceState === 'thinking' || voiceState === 'speaking') ? 0.35 : 1,
        }}
      >
        {voiceState === 'listening'
          ? <MicOff size={24} color="rgba(147,197,253,0.9)" />
          : <Mic size={24} color={isDark ? 'rgba(147,197,253,0.75)' : 'rgba(37,99,235,0.6)'} />}
      </button>

      {/* ── Footer info ── */}
      <div style={{
        position: 'absolute', bottom: 20,
        display: 'flex', alignItems: 'center', gap: '16px',
        fontSize: '11px', color: textMuted,
        fontFamily: 'system-ui, sans-serif', letterSpacing: '0.04em',
        zIndex: 10,
      }}>
        {exchangeCount > 0 && (
          <span>{exchangeCount} exchange{exchangeCount !== 1 ? 's' : ''}</span>
        )}
        {voiceState === 'listening' && (
          <span>tap mic to stop</span>
        )}
        {voiceState === 'idle' && exchangeCount === 0 && (
          <span>tap mic · speak · tap to stop</span>
        )}
      </div>

      {!supported && (
        <div style={{
          position: 'absolute', bottom: 100,
          padding: '12px 20px', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
          fontSize: '13px', color: '#fca5a5', zIndex: 10,
        }}>
          Voice input requires Chrome or Edge.
        </div>
      )}

      <style>{`
        @keyframes voiceBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.85); }
        }
        @keyframes voiceSpin {
          0% { transform: rotate(0deg) scale(1); opacity: 0.7; }
          50% { transform: rotate(180deg) scale(1.3); opacity: 1; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
