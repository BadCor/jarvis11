import React, { useEffect, useRef } from 'react';
import { JarvisPhase } from '../types/jarvis';

interface VoiceOrbProps {
  phase: JarvisPhase;
  onClick: () => void;
  statusText?: string;
  transcript?: string;
}

interface Dot {
  x: number;
  y: number;
  z: number;
  p: number;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  phase,
  onClick,
  statusText,
  transcript,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const N = 480;
    let dots: Dot[] = [];

    const initDots = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = Array.from({ length: N }, () => {
        const z = Math.random() * 2 - 1;
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.max(0, 1 - z * z));
        return {
          x: r * Math.cos(a),
          y: z,
          z: r * Math.sin(a),
          p: Math.random() * Math.PI * 2,
        };
      });
    };

    initDots();
    window.addEventListener('resize', initDots);

    let t = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) return;

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.38;

      ctx.clearRect(0, 0, w, h);

      // Speed depends on phase
      const speed = phase === 'listening' ? 0.016 : phase === 'processing' ? 0.025 : phase === 'speaking' ? 0.012 : 0.006;
      t += speed;

      // Glow backdrop
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
      if (phase === 'listening') {
        glow.addColorStop(0, 'rgba(41, 216, 255, 0.28)');
        glow.addColorStop(0.5, 'rgba(10, 55, 90, 0.18)');
        glow.addColorStop(1, 'transparent');
      } else if (phase === 'speaking') {
        glow.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
        glow.addColorStop(0.6, 'rgba(8, 48, 80, 0.2)');
        glow.addColorStop(1, 'transparent');
      } else {
        glow.addColorStop(0, 'rgba(20, 65, 105, 0.22)');
        glow.addColorStop(0.7, 'rgba(5, 20, 35, 0.08)');
        glow.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = glow;
      ctx.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2);

      // Rotating concentric HUD rings in listening/speaking modes
      if (phase === 'listening' || phase === 'speaking') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.8);
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.15, 0, Math.PI * 1.4);
        ctx.strokeStyle = 'rgba(41, 216, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        ctx.stroke();

        ctx.rotate(-t * 1.6);
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.25, 0, Math.PI * 0.9);
        ctx.strokeStyle = 'rgba(120, 235, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // 3D Particles Sphere
      const a = t * 0.65;
      const co = Math.cos(a);
      const si = Math.sin(a);

      for (const d of dots) {
        // 3D Y-axis rotation
        const X = d.x * co - d.z * si;
        const Z = d.x * si + d.z * co;
        const Y = d.y;

        const depthScale = 0.65 + ((Z + 1) / 2) * 0.55;
        const px = cx + X * R * depthScale;
        const py = cy + Y * R * depthScale;

        // Wave pulsing
        const pulse = Math.sin(t * 2.5 + d.p) * (phase === 'speaking' ? 0.6 : 0.25);
        const radius = depthScale * (1.1 + pulse);
        const alpha = Math.min(1, Math.max(0.15, 0.25 + ((Z + 1) / 2) * 0.7));

        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, radius), 0, Math.PI * 2);

        if (phase === 'listening') {
          ctx.fillStyle = `rgba(140, 240, 255, ${alpha})`;
        } else if (phase === 'speaking') {
          ctx.fillStyle = `rgba(180, 250, 255, ${alpha})`;
        } else if (phase === 'processing') {
          ctx.fillStyle = `rgba(100, 220, 255, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(80, 185, 245, ${alpha * 0.85})`;
        }
        ctx.fill();
      }

      // Central core icon or glow
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = phase === 'listening' 
        ? 'rgba(41, 216, 255, 0.12)' 
        : 'rgba(15, 45, 75, 0.25)';
      ctx.fill();
      ctx.strokeStyle = phase === 'listening' ? '#29d8ff' : 'rgba(41, 216, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Stylized "J" monogram inside core
      ctx.fillStyle = phase === 'listening' ? '#ffffff' : '#bcecff';
      ctx.font = `bold ${Math.round(R * 0.28)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('J', cx, cy + 1);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', initDots);
    };
  }, [phase]);

  const getPhaseLabel = () => {
    switch (phase) {
      case 'listening':
        return 'Слушаю вас, сэр… Говорите команду';
      case 'processing':
        return 'Обработка команды…';
      case 'speaking':
        return 'Отвечаю…';
      case 'disabled':
        return 'Голосовой модуль отключен';
      default:
        return 'Ожидание · Нажмите или скажите «Джарвис»';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-full px-2">
      {/* Interactive Orb Container - scaled for mobile & desktop */}
      <div
        onClick={onClick}
        className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 cursor-pointer group transition-transform duration-200 active:scale-95 hover:scale-[1.02] touch-manipulation"
        title="Нажмите для голосовой команды или скажите «Джарвис»"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block rounded-full"
        />

        {/* Subtle hover ring */}
        <div className="absolute inset-0 rounded-full border border-[#29D8FF]/20 pointer-events-none group-hover:border-[#29D8FF]/60 transition-colors" />
      </div>

      {/* Status indicator caption */}
      <div className="mt-3 sm:mt-4 text-center max-w-sm sm:max-w-md px-2">
        <p className={`text-xs sm:text-sm md:text-base font-medium tracking-wide transition-colors ${
          phase === 'listening'
            ? 'text-[#29D8FF] hud-glow-text font-semibold animate-pulse'
            : phase === 'speaking'
            ? 'text-[#76ECFF]'
            : 'text-[#8CA3B8]'
        }`}>
          {statusText || getPhaseLabel()}
        </p>

        {transcript && (
          <div className="mt-1.5 max-w-xs sm:max-w-md mx-auto px-3 py-1 rounded-lg bg-[#071320]/80 border border-[#29D8FF]/20 text-[11px] sm:text-xs text-[#E2F5FF] font-mono truncate">
            › «{transcript}»
          </div>
        )}
      </div>
    </div>
  );
};
