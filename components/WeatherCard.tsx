import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { View } from '@react-three/drei';
import clsx from 'clsx';
import { CloudRain, Droplets, Wind, Sunrise, Sunset, Sun, Loader2, Layers, Cloud, LayoutDashboard } from 'lucide-react';
import { Cloud3D } from './Cloud3D';
import { CityWeather, CloudSystemConfig, CustomGradient } from '../types';
import { getMoonPhase, getMoonPhaseDetails } from '../constants';

interface WeatherCardProps {
  data: CityWeather;
  index: number;
  isDemo?: boolean;
  customCloudConfig?: CloudSystemConfig;
  customData?: Partial<CityWeather>;
  customGradient?: CustomGradient;
  showLayers?: boolean;
  disableEntryAnimation?: boolean;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const MoonPhaseIcon = ({ phase, size = 42 }: { phase: number; size?: number }) => {
  const r = 45;
  const c = 50;
  const p = phase % 1;
  const isWaxing = p <= 0.5;
  const isLeftLit = !isWaxing;
  const sweepOuter = isLeftLit ? 0 : 1;
  const xRadius = Math.abs(r * Math.cos(2 * Math.PI * p));
  let sweepInner = 0;
  if (p < 0.25) sweepInner = 1;
  else if (p < 0.5) sweepInner = 0;
  else if (p < 0.75) sweepInner = 1;
  else sweepInner = 0;

  const path = `M ${c} ${c - r} A ${r} ${r} 0 0 ${sweepOuter} ${c} ${c + r} A ${xRadius} ${r} 0 0 ${sweepInner} ${c} ${c - r}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-md">
      <circle cx="50" cy="50" r="45" fill="#334155" stroke="#475569" strokeWidth="1" opacity="0.9" />
      <path d={path} fill="#f8fafc" filter="url(#glow)" />
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
};

interface WeatherEffectsProps {
  type: 'rain' | 'snow' | 'fog' | 'none';
  obstacles: Obstacle[];
  active: boolean;
  windSpeed?: number;
  isDay?: boolean;
}

const WeatherEffects = ({ type, obstacles, active, windSpeed = 10, isDay = true }: WeatherEffectsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const windSpeedRef = useRef(windSpeed);

  useEffect(() => { windSpeedRef.current = windSpeed; }, [windSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (!active || type === 'none') return;

    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Use a ref to track the resize frame ID for cleanup
    let resizeFrameId: number;

    const updateDimensions = () => {
       if (!canvas || !container || !ctx) return;
       const rect = container.getBoundingClientRect();
       const newWidth = rect.width;
       const newHeight = rect.height;
       
       // Only update if dimensions changed significantly to avoid float jitter loops
       if (Math.abs(newWidth - width) > 1 || Math.abs(newHeight - height) > 1 || canvas.width !== newWidth * dpr) {
         width = newWidth;
         height = newHeight;
         canvas.width = width * dpr;
         canvas.height = height * dpr;
         ctx.scale(dpr, dpr);
       }
    };

    const resizeObserver = new ResizeObserver(() => {
      // Debounce via requestAnimationFrame
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(updateDimensions);
    });

    resizeObserver.observe(container);
    
    // Initial setup
    updateDimensions();

    let particles: any[] = [];

    const createParticle = (initial: boolean = false) => {
      const x = Math.random() * width;
      const yStart = initial ? Math.random() * height : -50;
      const z = 0.2 + Math.random() * 0.8;

      const windDrift = (windSpeedRef.current / 10);

      if (type === 'rain') {
        const baseFallSpeed = 20;
        const speedVar = 10;
        return {
          x,
          y: yStart,
          z,
          vy: (baseFallSpeed + Math.random() * speedVar) * z,
          vx: (windDrift * 2) * z,
          len: (15 + Math.random() * 15) * z,
          width: Math.max(0.5, 2 * z),
          opacity: 0.2 + 0.5 * z,
          type: 'rain'
        };
      } else if (type === 'snow') {
        const baseFallSpeed = 1.5;
        return {
          x,
          y: yStart,
          z,
          vy: (baseFallSpeed + Math.random()) * z,
          vx: (windDrift * 0.8) * z,
          r: (1.5 + Math.random() * 3) * z,
          swayOffset: Math.random() * Math.PI * 2,
          swaySpeed: 1 + Math.random(),
          swayAmp: (0.5 + Math.random()) * 20,
          opacity: 0.3 + 0.6 * z,
          type: 'snow'
        };
      } else if (type === 'fog') {
        const speed = (windSpeedRef.current / 30) + 0.1;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: speed * (0.5 + Math.random()),
          r: 40 + Math.random() * 60,
          opacity: 0.02 + Math.random() * 0.03,
          sway: Math.random() * 100,
          type: 'fog'
        };
      }
      return {};
    };

    const particleCount = type === 'rain' ? 120 : (type === 'snow' ? 80 : 30);
    for (let i = 0; i < particleCount; i++) particles.push(createParticle(true));

    let animationFrameId: number;
    const loop = () => {
      // Clear with current dimensions
      ctx.clearRect(0, 0, width, height);
      const time = Date.now() * 0.001;

      const windDrift = windSpeedRef.current / 10;

      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];

        if (type === 'rain') {
          p.vx = (windDrift * 2) * p.z;
          p.y += p.vy;
          p.x += p.vx;

          if (p.y > height + p.len) {
            p.y = -p.len - Math.random() * 50;
            p.x = Math.random() * width;
          }
          else if (p.vx > 0 && p.x > width) {
            p.x = -20;
          }
          else if (p.vx < 0 && p.x < -20) {
            p.x = width + 20;
          }

          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(200, 230, 255, ${p.opacity})`;
          ctx.lineWidth = p.width;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.5, p.y + p.len);
          ctx.stroke();

        } else if (type === 'snow') {
          p.vx = (windDrift * 0.8) * p.z;
          const sway = Math.sin(time * p.swaySpeed + p.swayOffset) * (p.swayAmp * p.z * 0.05);
          p.y += p.vy;
          p.x += p.vx + sway;

          if (p.y > height + p.r) {
            p.y = -p.r - Math.random() * 50;
            p.x = Math.random() * width;
          }
          else if (p.vx > 0 && p.x > width + 50) {
            p.x = -50;
          }
          else if (p.vx < 0 && p.x < -50) {
            p.x = width + 50;
          }

          ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

        } else if (type === 'fog') {
          p.x += p.vx;
          p.y += Math.sin(time * 0.5 + p.sway) * 0.3;
          if (p.x > width + p.r * 2) {
            p.x = -p.r * 2;
            p.y = Math.random() * height;
          }
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          const c = isDay ? '255,255,255' : '200,210,230';
          grad.addColorStop(0, `rgba(${c}, ${p.opacity})`);
          grad.addColorStop(1, `rgba(${c}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      resizeObserver.disconnect();
      if (resizeFrameId) window.cancelAnimationFrame(resizeFrameId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type, active, isDay]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 rounded-3xl overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

const EXP_ROT_X = 40;
const EXP_ROT_Y = -15;

interface LayerLabelProps {
  text: string;
  z: number;
  icon: any;
  colorClass: string;
  dx?: number;
  dy?: number;
  x: number;
  y: number;
  isDay: boolean;
}

const LayerLabel = ({ text, z, icon: Icon, colorClass, dx = 0, dy = -100, x, y, isDay }: LayerLabelProps) => {
  const [offset, setOffset] = useState({ x: dx, y: dy });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setOffset({ x: dx, y: dy });
  }, [dx, dy]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const scale = 0.7;
      const dragDx = (e.clientX - dragStart.current.x) / scale;
      const dragDy = (e.clientY - dragStart.current.y) / scale;
      setOffset({ x: initialOffset.current.x + dragDx, y: initialOffset.current.y + dragDy });
    };
    const handleMouseUp = () => { setIsDragging(false); document.body.style.cursor = 'default'; };
    if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging]);

  const startDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialOffset.current = { ...offset };
    document.body.style.cursor = 'grabbing';
  };

  // Solid colors for readability
  const bgClass = isDay
    ? "bg-white border-slate-200 text-slate-900 shadow-slate-200/50"
    : "bg-slate-950 border-white/10 text-white shadow-black/50";

  const iconBgClass = isDay ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/10";

  return (
    <div className="absolute w-0 h-0" style={{ top: `${y}%`, left: `${x}%`, transform: `rotateY(${-EXP_ROT_Y}deg) rotateX(${-EXP_ROT_X}deg)`, zIndex: 1000 + z, pointerEvents: 'none', transformStyle: 'preserve-3d' }}>
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 group cursor-crosshair pointer-events-auto">
        <div className={`w-2 h-2 rounded-full ${colorClass.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] ring-1 ring-white/40 z-10 relative`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${colorClass.replace('text-', 'bg-')} opacity-20 animate-ping pointer-events-none`} />
      </div>
      <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ zIndex: -1 }}>
        <line x1={0} y1={0} x2={offset.x} y2={offset.y} stroke="currentColor" className={clsx("stroke-[1.5px]", colorClass.replace('text-', 'stroke-').replace('400', '500'))} strokeOpacity="0.5" strokeDasharray="3 2" />
        <circle cx={offset.x} cy={offset.y} r="1.5" fill="currentColor" className={colorClass} opacity="0.6" />
      </svg>
      <div
        onMouseDown={startDrag}
        className={clsx(
          "absolute flex items-center gap-3 px-3.5 py-2 rounded-lg border shadow-xl transition-transform cursor-grab active:cursor-grabbing select-none pointer-events-auto group/badge",
          bgClass,
          isDragging ? "scale-105 ring-1 ring-blue-500/50" : "hover:scale-105"
        )}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) translate(-50%, -50%)`, minWidth: 'max-content' }}
      >
        <div className={`flex items-center justify-center w-7 h-7 rounded-md ${iconBgClass} ${colorClass} border`}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-0 text-left">
          <span className="text-xs font-bold tracking-tight">{text}</span>
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-bold uppercase tracking-wider ${colorClass} opacity-90`}>Layer {(z / 100).toFixed(0)}</span>
            <span className="text-[8px] opacity-60 font-mono">Z: {z}px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Weather Card Component.
 * Displays detailed weather information for a specific location.
 * Features 3D cloud rendering, precipitation effects, and an "exploded" view
 * to visualize the different rendering layers.
 */
const WeatherCard: React.FC<WeatherCardProps> = ({ data, index, isDemo = false, customCloudConfig, customData, customGradient, showLayers, disableEntryAnimation = false }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isExploded, setIsExploded] = useState(false);
  const activeShowLayers = showLayers !== undefined ? showLayers : isExploded;
  const isControlled = showLayers !== undefined;

  const weatherData = useMemo(() => {
    if (!customData) return data;
    return { ...data, ...customData, placeholderData: { ...data.placeholderData, ...(customData.placeholderData || {}) }, theme: customData.theme || data.theme };
  }, [data, customData]);

  const [isLoading, setIsLoading] = useState(!isDemo);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardContainerRef, { margin: "100px 0px 100px 0px" });

  const moonPhase = useMemo(() => getMoonPhase(new Date()), []);
  const { name: moonPhaseName, illumination: moonIllumination } = useMemo(() => getMoonPhaseDetails(moonPhase), [moonPhase]);

  useEffect(() => {
    if (!isInView) return;
    const updateTime = () => {
      try { setCurrentTime(new Intl.DateTimeFormat('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: weatherData.timezone }).format(new Date())); } catch (e) { setCurrentTime('Local Time'); }
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [weatherData.timezone, isInView]);

  useEffect(() => { if (isDemo) { setIsLoading(false); return; } setIsLoading(false); }, [isDemo]);

  const { placeholderData } = weatherData;
  const currentTempF = Math.round((placeholderData.temp_c * 9 / 5) + 32);

  const weatherEffectType = useMemo(() => {
    const s = weatherData.placeholderData.icon_slug;
    if (s.includes('snow') || s.includes('blizzard')) return 'snow';
    if (s.includes('rain') || s.includes('drizzle') || s.includes('thunder') || s.includes('showers')) return 'rain';
    if (s.includes('fog')) return 'fog';
    return 'none';
  }, [weatherData.placeholderData.icon_slug]);

  const hasActiveWeatherEffect = weatherEffectType !== 'none';
  const containerStyle = customGradient ? { background: `linear-gradient(to bottom right, ${customGradient.from}, ${customGradient.via}, ${customGradient.to})` } : {};
  const layerTransition = { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  // Helper to isolate styles that might break 3D context (like backdrop-filter)
  const getLayerBackgroundStyle = (type: 'ui' | 'clouds' | 'precip' | 'base', isDay: boolean) => {
    const borderColor = isDay ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)';

    if (type === 'ui') {
      return {
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
        border: `1px solid ${borderColor}`,
        backgroundColor: isDay ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)' // Safari support
      };
    }
    if (type === 'precip') {
      return {
        border: '1px dashed rgba(255,255,255,0.15)',
        backgroundColor: 'transparent',
        boxShadow: 'none'
      };
    }
    if (type === 'clouds') {
      return {
        border: '1px solid rgba(255,255,255,0.15)',
        backgroundColor: isDay ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)'
      };
    }
    if (type === 'base') {
      return { border: '1px solid rgba(255,255,255,0.3)' };
    }
    return {};
  };

  const getCloudFrameColors = () => weatherData.isDay ? { bg: 'bg-amber-100/5', border: 'border-amber-200/30', accent: 'border-amber-300/60' } : { bg: 'bg-indigo-500/5', border: 'border-indigo-400/30', accent: 'border-indigo-400/60' };
  const cloudFrame = getCloudFrameColors();

  const animationProps = disableEntryAnimation
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 } };

  const statContainerClass = weatherData.isDay
    ? "bg-black/10 hover:bg-black/20"
    : "bg-slate-950/50 hover:bg-slate-950/60 shadow-inner";

  return (
    <motion.div ref={cardContainerRef} {...animationProps} transition={{ duration: 0.5, delay: disableEntryAnimation ? 0 : index * 0.1 }} className="relative h-full" style={{ perspective: activeShowLayers ? '2000px' : 'none', transformStyle: activeShowLayers ? 'preserve-3d' : 'flat', zIndex: activeShowLayers ? 50 : 1 }}>
      <motion.div className={clsx("weather-card-container relative w-full h-full rounded-3xl border border-white/20 shadow-2xl bg-gradient-to-br flex flex-col justify-between", "transition-all duration-500", activeShowLayers ? "overflow-visible" : "overflow-hidden", !customGradient && weatherData.theme.from, !customGradient && weatherData.theme.via, !customGradient && weatherData.theme.to)} style={{ ...containerStyle, transformStyle: 'preserve-3d' }} animate={{ rotateX: activeShowLayers ? EXP_ROT_X : 0, rotateY: activeShowLayers ? EXP_ROT_Y : 0, scale: activeShowLayers ? 0.6 : 1, y: activeShowLayers ? 120 : -20 }} transition={layerTransition}>

        {/* Base Layer Background */}
        {activeShowLayers && (
          <div className="absolute inset-0 opacity-20 pointer-events-none rounded-3xl" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px', zIndex: 0, ...getLayerBackgroundStyle('base', weatherData.isDay) }} />
        )}
        {activeShowLayers && (<LayerLabel text="Base Gradient" z={0} icon={Layers} colorClass="text-blue-400" x={0} y={100} dx={-200} dy={150} isDay={weatherData.isDay} />)}

        {/* Clouds Layer */}
        <motion.div ref={viewRef} className={clsx("absolute inset-0 w-full h-full pointer-events-none rounded-3xl", activeShowLayers ? "overflow-visible" : "overflow-hidden")} style={{ zIndex: 0, transformStyle: activeShowLayers ? 'preserve-3d' : 'flat' }} animate={{ translateZ: activeShowLayers ? 150 : 0 }} transition={layerTransition}>
          {/* Visual Background for Clouds Layer */}
          {activeShowLayers && (
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={getLayerBackgroundStyle('clouds', weatherData.isDay)} />
          )}

          {isInView && (<View track={viewRef}><Cloud3D weatherCode={weatherData.placeholderData.icon_slug} isDay={weatherData.isDay} moonPhase={moonPhase} config={customCloudConfig} showCelestial={!activeShowLayers} /></View>)}

          {activeShowLayers && (<div className={`absolute inset-0 rounded-3xl pointer-events-none border ${cloudFrame.border} ${cloudFrame.bg}`}><div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg ${cloudFrame.accent}`} /><div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg ${cloudFrame.accent}`} /><div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg ${cloudFrame.accent}`} /><div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-lg ${cloudFrame.accent}`} /></div>)}
          {activeShowLayers && (<LayerLabel text="Volumetric Clouds" z={150} icon={Cloud} colorClass={weatherData.isDay ? "text-amber-400" : "text-sky-400"} x={100} y={100} dx={200} dy={150} isDay={weatherData.isDay} />)}
        </motion.div>

        {/* Precipitation Layer */}
        {hasActiveWeatherEffect && (
          <motion.div className={clsx("absolute inset-0 pointer-events-none rounded-3xl", activeShowLayers ? "overflow-visible" : "overflow-hidden")} style={{ zIndex: 20, transformStyle: activeShowLayers ? 'preserve-3d' : 'flat' }} animate={{ translateZ: activeShowLayers ? 350 : 0 }} transition={layerTransition}>
            {/* Visual Background for Precip Layer */}
            {activeShowLayers && (
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={getLayerBackgroundStyle('precip', weatherData.isDay)} />
            )}

            <WeatherEffects type={weatherEffectType} obstacles={[]} active={isInView} windSpeed={weatherData.placeholderData.wind_kph} isDay={weatherData.isDay} />
            {activeShowLayers && (<LayerLabel text={weatherEffectType === 'snow' ? 'Snowfall' : 'Precipitation'} z={350} icon={Droplets} colorClass="text-purple-400" x={0} y={0} dx={-200} dy={-150} isDay={weatherData.isDay} />)}
          </motion.div>
        )}

        {/* UI Layer */}
        <motion.div
          className={clsx("relative h-full", activeShowLayers ? "overflow-visible" : "overflow-hidden")}
          style={{
            zIndex: 30,
            // Removed backdrop-filter and borders from here to preserve 3D context
            transformStyle: activeShowLayers ? 'preserve-3d' : 'flat'
          }}
          animate={{ translateZ: activeShowLayers ? 600 : 0 }}
          transition={layerTransition}
        >
          {/* Background Visuals - Isolated to prevent 3D flattening */}
          {activeShowLayers && (
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={getLayerBackgroundStyle('ui', weatherData.isDay)} />
          )}

          {activeShowLayers && (<LayerLabel text="UI Interface" z={600} icon={LayoutDashboard} colorClass="text-amber-400" x={100} y={0} dx={200} dy={-150} isDay={weatherData.isDay} />)}
          {!isControlled && (<div className="absolute top-6 right-6 z-50"><button onClick={(e) => { e.stopPropagation(); setIsExploded(!isExploded); }} className={clsx("p-2 rounded-full backdrop-blur-md transition-all duration-300 border pointer-events-auto", activeShowLayers ? "bg-white/20 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-white/20" : "bg-black/10 border-white/5 text-slate-400 hover:bg-black/30 hover:text-white hover:scale-110")} title={activeShowLayers ? "Collapse Layers" : "Inspect Layers"}><Layers size={16} /></button></div>)}

          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1 drop-shadow-md">
                <div className="text-sm font-semibold opacity-100 tracking-wide drop-shadow-lg text-white/90">{currentTime}</div>
                <div className="text-lg font-bold tracking-tight leading-tight max-w-[140px] drop-shadow-xl text-white">{weatherData.city}, {weatherData.country}</div>
                <div className="flex items-center gap-2 mt-1 h-5">{isLoading && <Loader2 className="animate-spin w-3 h-3 opacity-50" />}{isDemo && !isLoading && (<div className="flex items-center text-amber-200 text-[10px] bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-500/30 backdrop-blur-md"><span>Studio Mode</span></div>)}</div>
              </div>
            </div>

            <div className="flex flex-col justify-center mb-4 drop-shadow-lg flex-grow">
              <div className="text-7xl font-bold tracking-tighter relative z-10 drop-shadow-2xl">{currentTempF}°</div>
              <div className="text-xl font-semibold opacity-100 mt-1 flex items-center gap-2 text-white drop-shadow-lg">{placeholderData.condition}</div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="relative">
                {weatherData.isDay ? (
                  <div className={clsx("backdrop-blur-md rounded-2xl p-3 flex justify-between items-center border border-white/10 shadow-lg", statContainerClass)}>
                    <div className="text-center"><Sunrise size={18} className="mx-auto mb-1 opacity-90 text-yellow-200 drop-shadow-md" /><div className="text-[10px] opacity-80">{weatherData.sunrise}</div></div>
                    <div className="text-center px-2"><Sun size={14} className="mx-auto mb-1 opacity-60 drop-shadow-md" /><div className="text-xs opacity-90 font-medium">{weatherData.dayLength}</div></div>
                    <div className="text-center"><Sunset size={18} className="mx-auto mb-1 opacity-90 text-orange-200 drop-shadow-md" /><div className="text-[10px] opacity-80">{weatherData.sunset}</div></div>
                  </div>
                ) : (
                  <div className={clsx("backdrop-blur-md rounded-2xl p-3 flex items-center justify-between border border-white/10 shadow-lg", statContainerClass)}>
                    <div className="flex items-center gap-3 w-full"><MoonPhaseIcon phase={moonPhase} size={36} /><div className="flex flex-col"><span className="text-xs font-semibold text-blue-100 drop-shadow-md">{moonIllumination}% Illumination</span><span className="text-[10px] opacity-60 uppercase tracking-wider text-white/70">{moonPhaseName}</span></div></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={clsx("backdrop-blur-md rounded-xl p-3 flex items-center border border-white/10 shadow-sm col-span-2 transition-colors", statContainerClass)}><CloudRain size={20} className="mr-3 text-blue-200 drop-shadow-md" /><div className="text-sm font-medium flex flex-col"><span className="text-xs opacity-70">Precipitation</span><span className="drop-shadow-sm font-semibold">{weatherData.precipChance}% Chance</span></div></div>
                <div className={clsx("flex items-center justify-center backdrop-blur-md rounded-xl p-2 border border-white/10 shadow-sm", statContainerClass)} title="Humidity"><Droplets size={14} className="mr-2 opacity-70 drop-shadow-sm" /><span className="text-xs drop-shadow-sm font-semibold">{placeholderData.humidity}%</span></div>
                <div className={clsx("flex items-center justify-center backdrop-blur-md rounded-xl p-2 border border-white/10 shadow-sm", statContainerClass)} title="Wind Speed"><Wind size={14} className="mr-2 opacity-70 drop-shadow-sm" /><span className="text-xs drop-shadow-sm font-semibold">{placeholderData.wind_kph} km/h</span></div>
              </div>

              <div className="flex justify-between gap-1">
                {weatherData.forecast.map((day, i) => (
                  <div key={i} className={clsx("flex-1 backdrop-blur-sm transition-all duration-200 rounded-xl p-2 text-center border border-white/5 cursor-pointer group hover:bg-white/10", statContainerClass)}><div className="text-[10px] font-medium opacity-70 mb-1 drop-shadow-sm">{day.day}</div><div className="text-xl mb-1 group-hover:scale-110 transition-transform drop-shadow-sm">{day.icon}</div><div className="text-xs font-semibold drop-shadow-sm">{day.high}°</div><div className="text-[10px] opacity-50 drop-shadow-sm">{day.low}°</div></div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default WeatherCard;