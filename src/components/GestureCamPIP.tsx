import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Minimize2, Maximize2, Hand, Sparkles, Check, Zap } from 'lucide-react';
import { DetectedGesture } from '../types/jarvis';

interface GestureCamPIPProps {
  onGestureTrigger: (gesture: DetectedGesture) => void;
  isWindowsGesturesActive?: boolean;
  onToggleWindowsGestures?: () => void;
}

export const GestureCamPIP: React.FC<GestureCamPIPProps> = ({
  onGestureTrigger,
  isWindowsGesturesActive,
  onToggleWindowsGestures,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [currentGesture, setCurrentGesture] = useState<DetectedGesture>('none');
  const [confidence, setConfidence] = useState<number>(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);

  const holdRef = useRef<{
    gesture: DetectedGesture;
    startTime: number;
    cooldownUntil: number;
  }>({
    gesture: 'none',
    startTime: 0,
    cooldownUntil: 0,
  });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setIsActive(false);
    setCurrentGesture('none');
    setConfidence(0);
    setHoldProgress(0);
  }, []);

  const startCamera = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
      streamRef.current = stream;
      setIsActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Доступ к веб-камере отклонен';
      setPermissionError(msg);
      setIsActive(false);
    }
  };

  // Attach video stream as soon as videoRef is mounted
  useEffect(() => {
    if (isActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Video play error:', err);
      });
    }
  }, [isActive]);

  // Frame processing loop
  useEffect(() => {
    if (!isActive) return;

    let scanLine = 0;

    const processFrame = () => {
      animRef.current = requestAnimationFrame(processFrame);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 320;
      const h = 240;
      canvas.width = w;
      canvas.height = h;

      ctx.clearRect(0, 0, w, h);

      // Create an offscreen helper to read pixels without disturbing the visible video
      const offscreen = document.createElement('canvas');
      offscreen.width = 160;
      offscreen.height = 120;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      // Draw mirrored video to offscreen for analysis
      offCtx.save();
      offCtx.translate(160, 0);
      offCtx.scale(-1, 1);
      offCtx.drawImage(video, 0, 0, 160, 120);
      offCtx.restore();

      const frameData = offCtx.getImageData(0, 0, 160, 120);
      const pixels = frameData.data;

      let skinCount = 0;
      let minX = 160, maxX = 0, minY = 120, maxY = 0;
      let sumX = 0, sumY = 0;

      // Center focus region
      const startX = 20;
      const endX = 140;
      const startY = 15;
      const endY = 105;

      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const idx = (y * 160 + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          // Calibrated YCbCr / RGB skin detection
          const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
          const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;
          const isSkin = cr >= 130 && cr <= 175 && cb >= 75 && cb <= 130 && r > 50 && g > 30;

          if (isSkin) {
            skinCount++;
            sumX += x;
            sumY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const totalZoneSamples = ((endX - startX) / 2) * ((endY - startY) / 2);
      const coverage = skinCount / Math.max(1, totalZoneSamples);

      let detected: DetectedGesture = 'none';
      let conf = 0;

      // Scale back to 320x240 for rendering
      const scale = 2;
      const boxW = maxX > minX ? (maxX - minX) * scale : 0;
      const boxH = maxY > minY ? (maxY - minY) * scale : 0;
      const centerX = skinCount > 0 ? (sumX / skinCount) * scale : w / 2;
      const centerY = skinCount > 0 ? (sumY / skinCount) * scale : h / 2;

      if (coverage > 0.05 && coverage < 0.75 && boxW > 50 && boxH > 50) {
        const aspect = boxW / Math.max(1, boxH);
        const areaSamples = ((boxW / scale) / 2) * ((boxH / scale) / 2);
        const solidity = skinCount / Math.max(1, areaSamples);

        // Find fingertip peaks in top 35% of bounding box
        const peakYLimit = (minY * scale) + boxH * 0.35;
        const columnTops: number[] = new Array(Math.ceil(w / 8)).fill(h);

        for (let y = minY; y < Math.min(120, minY + (boxH / scale) * 0.4); y += 2) {
          for (let x = minX; x < maxX; x += 2) {
            const idx = (y * 160 + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
            const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;
            if (cr >= 130 && cr <= 175 && cb >= 75 && cb <= 130) {
              const col = Math.floor((x * scale) / 8);
              if (y * scale < columnTops[col]) {
                columnTops[col] = y * scale;
              }
            }
          }
        }

        let fingerPeaks = 0;
        for (let i = 2; i < columnTops.length - 2; i++) {
          const val = columnTops[i];
          if (val < peakYLimit && val < columnTops[i - 1] && val < columnTops[i + 1]) {
            fingerPeaks++;
          }
        }

        // Classify gesture
        if (solidity > 0.7 && aspect > 0.75 && aspect < 1.35 && fingerPeaks <= 1) {
          detected = 'fist'; // ✊ Fist: Mute
          conf = Math.min(98, Math.round(solidity * 110));
        } else if (fingerPeaks === 2 || (aspect < 0.75 && fingerPeaks >= 2 && fingerPeaks <= 3)) {
          detected = 'victory'; // ✌️ Victory: YouTube
          conf = 92;
        } else if (fingerPeaks === 1 || (boxH > 80 && aspect < 0.55)) {
          detected = 'point'; // ☝️ Point: Time
          conf = 88;
        } else if (fingerPeaks >= 4 || (coverage > 0.15 && solidity < 0.65)) {
          detected = 'palm'; // 🖐️ Palm: Unmute / Wake
          conf = Math.min(97, Math.round(coverage * 360));
        } else if (aspect > 0.8 && centerY > (minY * scale) + 30) {
          detected = 'thumb_up'; // 👍 Thumb Up: Discord
          conf = 82;
        }
      }

      setCurrentGesture(detected);
      setConfidence(conf);

      // Gesture Hold Timer
      const now = performance.now();
      const holdTimeRequired = 600; // ms

      if (now < holdRef.current.cooldownUntil) {
        setHoldProgress(0);
      } else if (detected !== 'none' && conf >= 75) {
        if (holdRef.current.gesture !== detected) {
          holdRef.current.gesture = detected;
          holdRef.current.startTime = now;
          setHoldProgress(10);
        } else {
          const elapsed = now - holdRef.current.startTime;
          const prog = Math.min(100, Math.round((elapsed / holdTimeRequired) * 100));
          setHoldProgress(prog);

          if (elapsed >= holdTimeRequired) {
            onGestureTrigger(detected);
            holdRef.current.cooldownUntil = now + 1200;
            holdRef.current.gesture = 'none';
            setHoldProgress(0);
          }
        }
      } else {
        holdRef.current.gesture = 'none';
        setHoldProgress(0);
      }

      // Draw HUD graphics overlay
      scanLine = (scanLine + 2) % h;
      ctx.strokeStyle = 'rgba(41, 216, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanLine);
      ctx.lineTo(w, scanLine);
      ctx.stroke();

      // Cyber target frame
      ctx.strokeStyle = 'rgba(41, 216, 255, 0.25)';
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(startX * scale, startY * scale, (endX - startX) * scale, (endY - startY) * scale);
      ctx.setLineDash([]);

      // Draw bounding box if hand detected
      if (detected !== 'none' && maxX > minX) {
        ctx.strokeStyle = '#29D8FF';
        ctx.lineWidth = 1.5;

        const pad = 8;
        const rx = Math.max(0, minX * scale - pad);
        const ry = Math.max(0, minY * scale - pad);
        const rw = Math.min(w - rx, boxW + pad * 2);
        const rh = Math.min(h - ry, boxH + pad * 2);

        const cl = 12;
        ctx.beginPath();
        ctx.moveTo(rx, ry + cl); ctx.lineTo(rx, ry); ctx.lineTo(rx + cl, ry);
        ctx.moveTo(rx + rw - cl, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + cl);
        ctx.moveTo(rx, ry + rh - cl); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + cl, ry + rh);
        ctx.moveTo(rx + rw - cl, ry + rh); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw, ry + rh - cl);
        ctx.stroke();

        // Center crosshair
        ctx.fillStyle = '#29D8FF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Hold countdown circle
        if (holdProgress > 0) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * holdProgress) / 100);
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    };

    processFrame();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isActive, onGestureTrigger, holdProgress]);

  const getGestureRussianLabel = (g: DetectedGesture) => {
    switch (g) {
      case 'palm': return '🖐️ Открытая ладонь · Включить микрофон';
      case 'fist': return '✊ Кулак · Выключить микрофон';
      case 'victory': return '✌️ Знак V (Победа) · YouTube';
      case 'thumb_up': return '👍 Палец вверх · Discord';
      case 'point': return '☝️ Указательный · Время';
      default: return 'Поместите руку в рамку…';
    }
  };

  return (
    <div className="relative">
      {/* Closed State Toggle Button */}
      {!isActive && (
        <button
          onClick={startCamera}
          className="fixed bottom-24 right-3 sm:right-5 z-40 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 min-h-[40px] py-2 rounded-full bg-[#0B1E33]/90 border border-[#29D8FF]/40 text-xs font-mono text-[#EAF5FF] hover:bg-[#122F50] hover:border-[#29D8FF] active:scale-95 touch-manipulation transition-all shadow-[0_0_20px_rgba(41,216,255,0.25)] cursor-pointer"
          title="Включить камеру жестов"
        >
          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#29D8FF]" />
          <span className="text-[11px] sm:text-xs">Камера жестов</span>
        </button>
      )}

      {/* Active PIP Window with Real Live Video Feed */}
      {isActive && (
        <div
          className={`fixed bottom-24 right-3 sm:right-5 z-40 hud-panel rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl border border-[#29D8FF]/40 bg-[#071322] ${
            isMinimized ? 'w-60 h-12' : 'w-[calc(100vw-1.5rem)] max-w-[280px] sm:max-w-xs sm:w-80'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#09182A] border-b border-[#29D8FF]/20 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-[#29D8FF]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-semibold tracking-wider uppercase font-hud">GESTURE HUD</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#839BB5]">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:text-[#29D8FF] transition-colors cursor-pointer"
                title={isMinimized ? 'Развернуть' : 'Свернуть'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={stopCamera}
                className="p-1 hover:text-red-400 transition-colors cursor-pointer"
                title="Отключить камеру"
              >
                <CameraOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Live Mirrored Video + Cybernetic Overlay Canvas */}
          {!isMinimized && (
            <div className="relative bg-black aspect-[4/3] overflow-hidden">
              {/* Visible Live Video Feed (mirrored for natural gesture response) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100 block opacity-90"
              />

              {/* Overlay Canvas for Hand Tracking Reticle */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Status overlay at bottom of camera */}
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-mono font-medium ${currentGesture !== 'none' ? 'text-[#29D8FF]' : 'text-[#839BB5]'}`}>
                    {getGestureRussianLabel(currentGesture)}
                  </span>
                  {confidence > 0 && (
                    <span className="text-[10px] font-mono text-[#10B981] tabular-nums font-semibold">
                      {confidence}%
                    </span>
                  )}
                </div>

                {/* Hold progress bar */}
                {holdProgress > 0 && (
                  <div className="w-full h-1 bg-[#102438] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] transition-all duration-75 rounded-full"
                      style={{ width: `${holdProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* One-Click Fast Gesture Triggers */}
          {!isMinimized && (
            <div className="p-2.5 bg-[#071322] border-t border-[#29D8FF]/15">
              <div className="text-[10px] font-mono uppercase text-[#839BB5] mb-1.5 flex items-center justify-between">
                <span>Быстрые жесты (1 клик):</span>
                <span className="text-[#29D8FF]">100% тест</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-[11px]">
                <button
                  onClick={() => onGestureTrigger('palm')}
                  className="py-1 px-1 rounded bg-[#0B1E33] border border-[#29D8FF]/20 hover:bg-[#29D8FF]/20 hover:border-[#29D8FF] text-center transition-colors cursor-pointer"
                  title="🖐️ Ладонь · Включить микрофон"
                >
                  🖐️
                </button>
                <button
                  onClick={() => onGestureTrigger('fist')}
                  className="py-1 px-1 rounded bg-[#0B1E33] border border-red-500/20 hover:bg-red-500/20 hover:border-red-500 text-center transition-colors cursor-pointer"
                  title="✊ Кулак · Выключить микрофон"
                >
                  ✊
                </button>
                <button
                  onClick={() => onGestureTrigger('victory')}
                  className="py-1 px-1 rounded bg-[#0B1E33] border border-[#29D8FF]/20 hover:bg-[#29D8FF]/20 hover:border-[#29D8FF] text-center transition-colors cursor-pointer"
                  title="✌️ Знак V · YouTube"
                >
                  ✌️
                </button>
                <button
                  onClick={() => onGestureTrigger('thumb_up')}
                  className="py-1 px-1 rounded bg-[#5865F2]/20 border border-[#5865F2]/40 hover:bg-[#5865F2]/40 text-center transition-colors cursor-pointer"
                  title="👍 Палец вверх · Discord"
                >
                  👍
                </button>
                <button
                  onClick={() => onGestureTrigger('point')}
                  className="py-1 px-1 rounded bg-[#0B1E33] border border-[#29D8FF]/20 hover:bg-[#29D8FF]/20 hover:border-[#29D8FF] text-center transition-colors cursor-pointer"
                  title="☝️ Указательный · Время"
                >
                  ☝️
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {permissionError && (
        <div className="fixed bottom-20 right-5 z-40 p-3 rounded-xl bg-red-950/90 border border-red-500/40 text-xs text-red-200 shadow-xl max-w-xs">
          <p className="font-semibold mb-1">Ошибка доступа к камере</p>
          <p className="text-[11px] text-red-300">{permissionError}</p>
          <button
            onClick={() => setPermissionError(null)}
            className="mt-2 text-[10px] uppercase text-red-400 hover:underline cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
};
