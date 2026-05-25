'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Mic } from 'lucide-react';

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
  const preferred = ['Daniel', 'Arthur', 'Google UK English Male', 'Microsoft George', 'Microsoft Ryan'];
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
  cx: number,
  cy: number,
  t: number,
  state: VoiceState,
  amplitude: number,
) {
  const ARMS = 3;
  const TURNS = 2.8;
  const POINTS = 120;

  // Speed per state
  const rotSpeed = state === 'thinking' ? 1.4 : state === 'speaking' ? 0.6 : state === 'listening' ? 0.35 : 0.18;

  // Pulse scale per state
  const breathe = state === 'listening'
    ? 1 + 0.12 * Math.sin(t * 3.5)
    : state === 'speaking'
    ? 1 + (0.08 + amplitude * 0.18) * Math.sin(t * 5)
    : state === 'thinking'
    ? 1 + 0.06 * Math.sin(t * 8)
    : 1 + 0.04 * Math.sin(t * 1.2);

  const maxR = 155 * breathe;
  const minR = 18;

  // Outer ambient glow
  const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR + 30);
  ambient.addColorStop(0, 'rgba(37,99,235,0.08)');
  ambient.addColorStop(0.5, 'rgba(37,99,235,0.04)');
  ambient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, maxR + 30, 0, Math.PI * 2);
  ctx.fillStyle = ambient;
  ctx.fill();

  // Spiral arms
  for (let arm = 0; arm < ARMS; arm++) {
    const armOffset = (arm / ARMS) * Math.PI * 2;

    ctx.beginPath();
    for (let i = 0; i <= POINTS; i++) {
      const p = i / POINTS;
      const theta = p * Math.PI * 2 * TURNS + armOffset + t * rotSpeed;
      const r = minR + p * (maxR - minR);

      // Wave distortion when speaking
      const wave = state === 'speaking'
        ? Math.sin(p * 8 + t * 6) * amplitude * 12
        : 0;

      const x = cx + (r + wave) * Math.cos(theta);
      const y = cy + (r + wave) * Math.sin(theta);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Color shifts by state
    const baseAlpha = state === 'idle' ? 0.45 : 0.75;
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
      grad.addColorStop(0, `rgba(29,78,216,0.25)`);
      grad.addColorStop(0.5, `rgba(96,165,250,0.45)`);
      grad.addColorStop(1, `rgba(147,197,253,0.15)`);
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth = state === 'listening' ? 1.8 + amplitude * 1.5 : state === 'speaking' ? 1.6 : 1.4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Trailing particles along each arm
    const PARTICLE_COUNT = 18;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = (i / PARTICLE_COUNT) * 0.85 + 0.1;
      const theta = p * Math.PI * 2 * TURNS + armOffset + t * rotSpeed;
      const r = minR + p * (maxR - minR);
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);

      const opacity = (0.3 + p * 0.7) * (state === 'idle' ? 0.5 : 0.9);
      const radius = p * (state === 'listening' ? 2.8 : 2.2);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(147,197,253,${opacity})`;
      ctx.fill();
    }
  }

  // Center orb
  const orbSize = state === 'listening' ? 28 + amplitude * 10 : state === 'thinking' ? 22 : 24;
  const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbSize);
  orb.addColorStop(0, 'rgba(219,234,254,0.95)');
  orb.addColorStop(0.3, 'rgba(147,197,253,0.8)');
  orb.addColorStop(0.7, 'rgba(96,165,250,0.5)');
  orb.addColorStop(1, 'rgba(37,99,235,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, orbSize, 0, Math.PI * 2);
  ctx.fillStyle = orb;
  ctx.fill();

  // Inner orb core
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(239,246,255,0.95)';
  ctx.fill();
}

/* ─── Main component ─── */
export default function VoiceChat({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const recognitionRef = useRef<any>(null);
  const amplitudeRef = useRef(0);
  const stateRef = useRef<VoiceState>('idle');

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [supported, setSupported] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Keep stateRef in sync
  const setState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setVoiceState(s);
  }, []);

  /* ─── Canvas animation loop ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * devicePixelRatio;
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

      // Amplitude decay
      amplitudeRef.current *= 0.92;

      ctx.clearRect(0, 0, w, h);

      // Background radial gradient
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8);
      bg.addColorStop(0, 'rgba(5,8,25,1)');
      bg.addColorStop(0.5, 'rgba(3,5,18,1)');
      bg.addColorStop(1, 'rgba(2,3,12,1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      drawSpiral(ctx, cx, cy, t, stateRef.current, amplitudeRef.current);

      rafRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /* ─── Speak response ─── */
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();

    const clean = stripMarkdown(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    const voice = getBestVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'en-GB';
    utterance.pitch = 0.86;
    utterance.rate = 0.9;
    utterance.volume = 1;

    // Pulse amplitude while speaking
    const pulseInterval = setInterval(() => {
      amplitudeRef.current = 0.4 + Math.random() * 0.6;
    }, 120);

    utterance.onend = () => {
      clearInterval(pulseInterval);
      amplitudeRef.current = 0;
      setState('idle');
      setDisplayText('');
      // Automatically start listening again after speaking
      setTimeout(() => startListening(), 600);
    };

    utterance.onerror = () => {
      clearInterval(pulseInterval);
      setState('idle');
    };

    setState('speaking');
    speechSynthesis.speak(utterance);
  }, [setState]);

  /* ─── Call AI ─── */
  const askAI = useCallback(async (userText: string, history: Msg[]) => {
    setState('thinking');
    setDisplayText('');

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
      setDisplayText('Sorry, I had trouble connecting. Please try again.');
      setTimeout(() => { setDisplayText(''); startListening(); }, 2500);
    }
  }, [setState, speak]);

  /* ─── Start listening ─── */
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    if (stateRef.current === 'thinking' || stateRef.current === 'speaking') return;

    const r = new SR();
    r.lang = 'en-GB';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setState('listening');
      setTranscript('');
    };

    r.onresult = (e: any) => {
      const interim = Array.from(e.results)
        .map((res: any) => res[0].transcript)
        .join('');
      setTranscript(interim);
      amplitudeRef.current = Math.min(1, interim.length / 40);

      if (e.results[e.results.length - 1].isFinal) {
        const final = e.results[e.results.length - 1][0].transcript.trim();
        if (final) {
          setTranscript(final);
          setMessages(prev => {
            askAI(final, prev);
            return prev;
          });
        }
      }
    };

    r.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        setState('idle');
      }
    };

    r.onend = () => {
      if (stateRef.current === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current = r;
    try { r.start(); } catch { /* already started */ }
  }, [setState, askAI]);

  /* ─── Mount + auto-start ─── */
  useEffect(() => {
    setMounted(true);
    // Load voices
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }
    // Small delay then start listening
    const t = setTimeout(() => startListening(), 800);
    return () => clearTimeout(t);
  }, [startListening]);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    };
  }, []);

  /* ─── State labels ─── */
  const stateLabel = {
    idle: 'Tap to speak',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Stu is speaking',
  }[voiceState];

  const stateColour = {
    idle: '#60a5fa',
    listening: '#93c5fd',
    thinking: '#3b82f6',
    speaking: '#7dd3fc',
  }[voiceState];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Canvas fills full screen */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Close */}
      <button
        onClick={() => { recognitionRef.current?.stop(); speechSynthesis.cancel(); onClose(); }}
        style={{
          position: 'absolute', top: 24, right: 24,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', zIndex: 10,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
      >
        <X size={16} color="rgba(255,255,255,0.6)" />
      </button>

      {/* Wordmark */}
      <div style={{
        position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center',
        fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.15em', textTransform: 'uppercase', zIndex: 10,
        fontFamily: 'Georgia, serif',
      }}>
        Stu
      </div>

      {/* Centre content — positioned relative to canvas */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0',
        pointerEvents: 'none',
      }}>
        {/* Spacer for the spiral (canvas handles the visual) */}
        <div style={{ height: 320 }} />

        {/* State label */}
        <div style={{
          fontSize: '13px', fontWeight: 500,
          color: stateColour,
          letterSpacing: '0.06em',
          opacity: 0.85,
          transition: 'color 0.4s ease',
          fontFamily: 'system-ui, sans-serif',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {voiceState === 'listening' && (
            <span style={{
              display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
              background: '#60a5fa',
              animation: 'voiceBlink 1s ease-in-out infinite',
            }} />
          )}
          {stateLabel}
        </div>

        {/* Transcript / response text */}
        <div style={{
          maxWidth: 520,
          textAlign: 'center',
          minHeight: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {voiceState === 'listening' && transcript && (
            <p style={{
              fontSize: '17px', color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.65, fontFamily: 'system-ui, sans-serif',
              fontWeight: 400, margin: 0,
            }}>
              {transcript}
            </p>
          )}
          {(voiceState === 'thinking' || voiceState === 'speaking') && displayText && (
            <p style={{
              fontSize: '17px', color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.7, fontFamily: 'Georgia, serif',
              fontWeight: 400, margin: 0,
              fontStyle: 'italic',
            }}>
              {displayText}
            </p>
          )}
          {voiceState === 'idle' && messages.length === 0 && (
            <p style={{
              fontSize: '14px', color: 'rgba(255,255,255,0.2)',
              lineHeight: 1.6, fontFamily: 'system-ui, sans-serif',
              margin: 0,
            }}>
              Ask Stu anything about UK law
            </p>
          )}
        </div>
      </div>

      {/* Tap-to-speak button — shown when idle */}
      {voiceState === 'idle' && (
        <button
          onClick={startListening}
          style={{
            position: 'absolute', bottom: 60,
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(37,99,235,0.15)',
            border: '1px solid rgba(96,165,250,0.3)',
            cursor: 'pointer', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(37,99,235,0.28)';
            e.currentTarget.style.borderColor = 'rgba(96,165,250,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(37,99,235,0.15)';
            e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)';
          }}
        >
          <Mic size={22} color="rgba(147,197,253,0.9)" />
        </button>
      )}

      {/* Conversation count pill */}
      {messages.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 28,
          fontSize: '11px', color: 'rgba(255,255,255,0.2)',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.04em',
          zIndex: 10,
        }}>
          {Math.floor(messages.length / 2)} exchange{messages.length > 2 ? 's' : ''} · say anything to continue
        </div>
      )}

      {!supported && (
        <div style={{
          position: 'absolute', bottom: 80,
          padding: '12px 20px', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
          fontSize: '13px', color: '#fca5a5', zIndex: 10,
        }}>
          Voice input is not supported in this browser.
        </div>
      )}

      <style>{`
        @keyframes voiceBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
