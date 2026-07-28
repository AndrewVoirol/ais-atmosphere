
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CloudSystemConfig, CityWeather, CustomGradient } from '../types';
import WeatherCard from './WeatherCard';
import { SAMPLE_CITIES, getTheme } from '../constants';
import { Sliders, Cloud, Sun, Palette, Droplets, Layers, Moon, Sunset, Wind, MousePointer2, Check, Code, Grid as GridIcon, Maximize, RotateCcw, Copy, CheckCircle2, Dices } from 'lucide-react';
import clsx from 'clsx';

// --- Constants & Config ---

const PRESETS: Record<string, any> = {
    'Clear Day': { code: 'clear-day', cloud: 0.1, fog: 0.01, isDay: true, wind: 5, icon: Sun, color: 'text-amber-500' },
    'Partly Cloudy': { code: 'partly-cloudy-day', cloud: 0.4, fog: 0.02, isDay: true, wind: 15, icon: Cloud, color: 'text-blue-400' },
    'Overcast': { code: 'overcast', cloud: 0.9, fog: 0.08, isDay: true, wind: 10, icon: Cloud, color: 'text-slate-400' },
    'Storm': { code: 'thunderstorm', cloud: 1.0, fog: 0.12, isDay: false, wind: 40, icon: Droplets, color: 'text-purple-400' },
    'Foggy': { code: 'fog', cloud: 0.5, fog: 0.25, isDay: true, wind: 2, icon: Wind, color: 'text-slate-300' },
    'Snow': { code: 'snow', cloud: 0.8, fog: 0.15, isDay: true, wind: 20, icon: Droplets, color: 'text-cyan-300' },
};

const GRADIENT_THEMES = {
    'Day': { from: '#3b82f6', via: '#60a5fa', to: '#93c5fd', label: 'Blue Sky' },
    'Sunset': { from: '#f97316', via: '#ef4444', to: '#facc15', label: 'Golden Hour' },
    'Night': { from: '#2e1065', via: '#4c1d95', to: '#1e1b4b', label: 'Deep Space' },
    'Storm': { from: '#4c1d95', via: '#581c87', to: '#1e1b4b', label: 'Electric' },
    'Aurora': { from: '#0f172a', via: '#0d9488', to: '#4ade80', label: 'Aurora' },
};

const CURATED_COLORS = [
    '#ffffff', '#e2e8f0', '#94a3b8', '#64748b', '#0f172a', // Grays
    '#bfdbfe', '#60a5fa', '#3b82f6', '#1e40af', // Blues
    '#fef3c7', '#f59e0b', '#dc2626', // Warm
    '#e9d5ff', '#a855f7', '#581c87' // Purples
];

// --- Helper Components ---

const GradientSlider = ({ value, min, max, step, onChange, gradient, label, icon: Icon, isDarkMode, displayValue }: any) => {
    return (
        <div className="group">
            <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={14} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />}
                    <label className={clsx("text-xs font-semibold uppercase tracking-wider", isDarkMode ? "text-slate-300" : "text-slate-600")}>{label}</label>
                </div>
                <span className={clsx("text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                    {typeof displayValue === 'number' ? displayValue.toFixed(2) : displayValue}
                </span>
            </div>
            <div className="relative h-3 w-full rounded-full shadow-inner ring-1 ring-black/5 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 w-full h-full" style={{ background: gradient }} />
                <input
                    type="range" min={min} max={max} step={step} value={value} onChange={onChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                />
                <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-300 ease-out"
                    style={{ left: `${((displayValue - min) / (max - min)) * 100}%`, transform: 'translateX(-50%)' }}
                />
            </div>
        </div>
    );
};

const LayerVisualizer = ({ config, isDarkMode, showLayers, setShowLayers }: { config: CloudSystemConfig, isDarkMode: boolean, showLayers: boolean, setShowLayers: (v: boolean) => void }) => {
    const hasLow = config.layers.some(l => l.z < -10);
    const hasMid = config.layers.some(l => l.z >= -10 && l.z < -6);
    const hasHigh = config.layers.some(l => l.z >= -6);

    const LayerItem = ({ label, active, z }: any) => (
        <div className={clsx("flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-300",
            active
                ? (isDarkMode ? "bg-blue-600/20 border-blue-500/50" : "bg-blue-100 border-blue-200")
                : (isDarkMode ? "bg-slate-900/90 border-white/5" : "bg-slate-100/90 border-slate-200"),
            !active && "opacity-60"
        )}>
            <div className="flex items-center gap-2">
                <div className={clsx("w-2 h-2 rounded-full transition-colors duration-300", active ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "bg-slate-600")} />
                <span className={clsx("text-xs font-bold", active ? (isDarkMode ? "text-blue-100" : "text-blue-900") : (isDarkMode ? "text-slate-400" : "text-slate-500"))}>{label}</span>
            </div>
            <span className={clsx("text-[9px] font-mono", active ? (isDarkMode ? "text-blue-200/70" : "text-blue-700/60") : "text-slate-600")}>Z:{z}</span>
        </div>
    );

    return (
        <div className="space-y-1 mb-6">
            <div className="flex items-center justify-between mb-2">
                <div className={clsx("text-[10px] uppercase tracking-widest font-bold flex items-center gap-2", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                    <Layers size={10} /> Active Render Layers
                </div>
                <button onClick={() => setShowLayers(!showLayers)} className={clsx("text-[10px] font-bold px-2 py-1 rounded border transition-colors", showLayers ? "bg-blue-500 text-white border-blue-500" : isDarkMode ? "bg-white/5 text-slate-400 border-white/10" : "bg-slate-100 text-slate-500 border-slate-200")}>
                    {showLayers ? 'Exploded' : 'Composite'}
                </button>
            </div>
            <div className="flex flex-col-reverse gap-1">
                <LayerItem label="UI Interface" active={true} z={500} />
                <LayerItem label="Precipitation" active={config.fogDensity > 0.1} z={300} />
                <LayerItem label="Clouds (High)" active={hasHigh} z={-5} />
                <LayerItem label="Clouds (Mid)" active={hasMid} z={-8} />
                <LayerItem label="Clouds (Low)" active={hasLow} z={-12} />
                <LayerItem label="Atmospheric Fog" active={config.fogDensity > 0} z="Global" />
            </div>
        </div>
    );
};

const CanvasToolbar = ({ showGrid, setShowGrid, resetCamera, focusMode, setFocusMode, isDarkMode }: any) => (
    <div className={clsx("absolute top-6 right-6 flex flex-col gap-2 p-1.5 rounded-2xl border shadow-xl backdrop-blur-md z-50",
        isDarkMode ? "bg-slate-900/80 border-white/10" : "bg-white/80 border-slate-200"
    )}>
        <button
            onClick={() => setShowGrid(!showGrid)}
            className={clsx("p-2.5 rounded-xl transition-colors", showGrid ? (isDarkMode ? "bg-white/10 text-white" : "bg-slate-200 text-slate-900") : "text-slate-500 hover:text-slate-700")}
            title="Toggle Grid"
        >
            <GridIcon size={18} />
        </button>
        <button
            onClick={() => setFocusMode(!focusMode)}
            className={clsx("p-2.5 rounded-xl transition-colors", focusMode ? "bg-blue-500 text-white" : "text-slate-500 hover:text-slate-700")}
            title="Focus Mode (Hide UI)"
        >
            <Maximize size={18} />
        </button>
        <div className="h-px w-6 bg-slate-500/20 mx-auto my-0.5" />
        <button
            onClick={resetCamera}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-black/5 transition-colors"
            title="Reset Camera"
        >
            <RotateCcw size={18} />
        </button>
    </div>
);

const CodePanel = ({ config, theme, isDarkMode }: any) => {
    const [copied, setCopied] = useState(false);

    const codeString = JSON.stringify({
        cloudConfig: config,
        theme: theme,
    }, null, 2);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className={clsx("text-sm font-bold uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-slate-600")}>Generated Config</h3>
                <button
                    onClick={handleCopy}
                    className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        copied
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : isDarkMode ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    )}
                >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy JSON'}
                </button>
            </div>
            <div className={clsx("flex-1 rounded-xl border overflow-hidden p-4 font-mono text-[10px] leading-relaxed overflow-y-auto custom-scrollbar",
                isDarkMode ? "bg-black/30 border-white/10 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
            )}>
                <pre>{codeString}</pre>
            </div>
        </div>
    );
};

// --- Main Component ---

interface DesignStudioProps {
    isDarkMode: boolean;
}

/**
 * Design Studio Component.
 * Allows users to customize weather parameters, cloud layers, and themes
 * to create atmospheric scenes. Features a real-time 3D preview.
 */
const DesignStudio: React.FC<DesignStudioProps> = ({ isDarkMode }) => {
    // State
    const [activeTab, setActiveTab] = useState<'design' | 'code'>('design');
    const [activePreset, setActivePreset] = useState('Partly Cloudy');
    const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

    // Cloud Params
    const [cloudCoverage, setCloudCoverage] = useState(0.4);
    const [cloudDensity, setCloudDensity] = useState(0.8);
    const [cloudSpeed, setCloudSpeed] = useState(0.05);
    const [fogDensity, setFogDensity] = useState(0.02);

    // Env Params
    const [isDay, setIsDay] = useState(true);
    const [windSpeed, setWindSpeed] = useState(15);
    const [weatherCode, setWeatherCode] = useState('partly-cloudy-day');
    const [cloudColor, setCloudColor] = useState('#ffffff');
    const [fogColor, setFogColor] = useState('#bfdbfe');

    // Style Params
    const [bgFrom, setBgFrom] = useState('#3b82f6');
    const [bgVia, setBgVia] = useState('#60a5fa');
    const [bgTo, setBgTo] = useState('#93c5fd');
    const [showLayers, setShowLayers] = useState(false);

    // Canvas State
    const [showGrid, setShowGrid] = useState(true);
    const [focusMode, setFocusMode] = useState(false);
    const [cardKey, setCardKey] = useState(0);

    // --- DISPLAY LOGIC (Proxy) ---
    const display = useMemo(() => {
        if (hoveredPreset && PRESETS[hoveredPreset]) {
            const p = PRESETS[hoveredPreset];
            return {
                cloudCoverage: p.cloud,
                cloudDensity: 0.8, // Default for presets
                cloudSpeed: 0.05,
                fogDensity: p.fog,
                windSpeed: p.wind,
                isDay: p.isDay,
                weatherCode: p.code,
                cloudColor: p.isDay ? '#ffffff' : '#64748b',
                fogColor: p.isDay ? '#bfdbfe' : '#0f172a',
            };
        }
        return {
            cloudCoverage, cloudDensity, cloudSpeed, fogDensity,
            windSpeed, isDay, weatherCode, cloudColor, fogColor
        };
    }, [hoveredPreset, cloudCoverage, cloudDensity, cloudSpeed, fogDensity, windSpeed, isDay, weatherCode, cloudColor, fogColor]);

    // Handlers
    const applyPreset = (name: string) => {
        const p = PRESETS[name as keyof typeof PRESETS];
        setActivePreset(name);
        setCloudCoverage(p.cloud); setFogDensity(p.fog); setIsDay(p.isDay); setWindSpeed(p.wind); setWeatherCode(p.code);
        if (!p.isDay) {
            setCloudColor('#64748b'); setFogColor('#0f172a');
            setBgFrom(GRADIENT_THEMES.Night.from); setBgVia(GRADIENT_THEMES.Night.via); setBgTo(GRADIENT_THEMES.Night.to);
        } else if (name === 'Storm') {
            setCloudColor('#475569'); setFogColor('#334155');
            setBgFrom(GRADIENT_THEMES.Storm.from); setBgVia(GRADIENT_THEMES.Storm.via); setBgTo(GRADIENT_THEMES.Storm.to);
        } else {
            setCloudColor('#ffffff'); setFogColor('#bfdbfe');
            setBgFrom(GRADIENT_THEMES.Day.from); setBgVia(GRADIENT_THEMES.Day.via); setBgTo(GRADIENT_THEMES.Day.to);
        }
    };

    const handleRandomize = () => {
        const presets = Object.keys(PRESETS);
        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
        applyPreset(randomPreset);
        setCloudCoverage(Math.random());
        setCloudSpeed(Math.random() * 0.15);
        setWindSpeed(Math.floor(Math.random() * 80));
        const randomColor = CURATED_COLORS[Math.floor(Math.random() * CURATED_COLORS.length)];
        setCloudColor(randomColor);
    };

    const applyGradientTheme = (theme: any) => { setBgFrom(theme.from); setBgVia(theme.via); setBgTo(theme.to); };

    // Derived Configs
    const cloudConfig: CloudSystemConfig = useMemo(() => {
        const layers = [];
        const { cloudCoverage: cc, cloudDensity: cd, cloudSpeed: cs, cloudColor: cCol, fogDensity: fd, fogColor: fCol, isDay: id } = display;

        if (cc > 0.1) layers.push({ z: -12, seed: 1, speed: cs * 0.5, density: cd * 0.8, coverage: cc, sharpness: 0.4, detail: 1.0, color: cCol });
        if (cc > 0.2) layers.push({ z: -8, seed: 55, speed: cs, density: cd, coverage: cc * 0.9, sharpness: 0.6, detail: 1.0, color: cCol });
        if (cc > 0.5) layers.push({ z: -5, seed: 99, speed: cs * 2.0, density: cd * 0.4, coverage: cc * 0.6, sharpness: 0.2, detail: 1.0, color: cCol });

        return { fogColor: fCol, fogDensity: fd, ambientIntensity: id ? 0.8 : 0.3, lightIntensity: id ? 1.2 : 0.4, layers };
    }, [display]);

    const customGradient: CustomGradient = useMemo(() => ({ from: bgFrom, via: bgVia, to: bgTo }), [bgFrom, bgVia, bgTo]);

    const studioCity: CityWeather = {
        ...SAMPLE_CITIES[0], city: "Design Studio", country: "Sandbox", isDay: display.isDay,
        placeholderData: { ...SAMPLE_CITIES[0].placeholderData, temp_c: 22, condition: hoveredPreset || activePreset, icon_slug: display.weatherCode, wind_kph: display.windSpeed, humidity: Math.round(display.fogDensity * 200) },
        theme: getTheme(display.isDay, display.weatherCode, 22, 50)
    };

    const panelClass = isDarkMode ? "bg-slate-950/60 border-white/10 text-white" : "bg-white/80 border-slate-200 text-slate-900";
    const sectionTitleClass = clsx("text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-slate-500");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full relative items-start">
            <div className={clsx("lg:col-span-4 sticky top-24 backdrop-blur-2xl p-6 rounded-3xl border shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar z-40 flex flex-col", panelClass)}>
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Sliders size={18} /></div>
                        <h2 className="font-bold text-xl tracking-tight">Inspector</h2>
                    </div>
                    <div className="flex gap-1 bg-black/5 p-1 rounded-lg border border-white/5">
                        <button onClick={handleRandomize} className={clsx("p-1.5 rounded-md transition-all group", isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")} title="Randomize"><Dices size={14} className="group-hover:rotate-180 transition-transform duration-500" /></button>
                        <div className="w-px h-4 bg-white/10 my-auto mx-1" />
                        <button onClick={() => setActiveTab('design')} className={clsx("p-1.5 rounded-md transition-all", activeTab === 'design' ? (isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") : "text-slate-500 hover:text-slate-400")} title="Design Mode"><Palette size={14} /></button>
                        <button onClick={() => setActiveTab('code')} className={clsx("p-1.5 rounded-md transition-all", activeTab === 'code' ? (isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm") : "text-slate-500 hover:text-slate-400")} title="Developer Mode"><Code size={14} /></button>
                    </div>
                </div>

                {activeTab === 'design' ? (
                    <div className="space-y-8">
                        <LayerVisualizer config={cloudConfig} isDarkMode={isDarkMode} showLayers={showLayers} setShowLayers={setShowLayers} />
                        <div>
                            <h3 className={sectionTitleClass}><MousePointer2 size={14} /> Quick Presets</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(PRESETS).map(([name, p]) => (
                                    <button
                                        key={name}
                                        onClick={() => applyPreset(name)}
                                        onMouseEnter={() => setHoveredPreset(name)}
                                        onMouseLeave={() => setHoveredPreset(null)}
                                        className={clsx("relative overflow-hidden group flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300",
                                            activePreset === name ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50" : isDarkMode ? "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20" : "border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm"
                                        )}
                                    >
                                        <div className={clsx("p-2 rounded-lg", isDarkMode ? "bg-slate-900" : "bg-white shadow-sm")}><p.icon size={16} className={p.color} /></div>
                                        <span className={clsx("text-xs font-medium", isDarkMode ? "text-slate-200" : "text-slate-700")}>{name}</span>
                                        {activePreset === name && <Check size={12} className="absolute top-2 right-2 text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className={sectionTitleClass}><Cloud size={14} /> Cloud System</h3>
                            <div className="space-y-5">
                                <GradientSlider label="Coverage" icon={Cloud} value={cloudCoverage} displayValue={display.cloudCoverage} min={0} max={1} step={0.05} onChange={(e: any) => setCloudCoverage(parseFloat(e.target.value))} gradient="linear-gradient(to right, transparent, #3b82f6)" isDarkMode={isDarkMode} />
                                <GradientSlider label="Density (Alpha)" icon={Droplets} value={cloudDensity} displayValue={display.cloudDensity} min={0.1} max={1} step={0.05} onChange={(e: any) => setCloudDensity(parseFloat(e.target.value))} gradient="linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,1))" isDarkMode={isDarkMode} />
                                <GradientSlider label="Wind Speed" icon={Wind} value={cloudSpeed} displayValue={display.cloudSpeed} min={0} max={0.2} step={0.01} onChange={(e: any) => setCloudSpeed(parseFloat(e.target.value))} gradient="linear-gradient(to right, transparent, #10b981)" isDarkMode={isDarkMode} />
                            </div>
                        </div>
                        <div>
                            <h3 className={sectionTitleClass}><Sun size={14} /> Environment</h3>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button onClick={() => setIsDay(true)} className={clsx("flex flex-col items-center justify-center p-3 rounded-xl border transition-all", display.isDay ? "bg-amber-500/10 border-amber-500/50" : isDarkMode ? "bg-white/5 border-white/5 opacity-50" : "bg-slate-50 border-slate-200 opacity-50")}><Sun size={18} className={display.isDay ? "text-amber-500 mb-2" : "text-slate-400 mb-2"} /><span className={clsx("text-xs font-bold", display.isDay ? "text-amber-500" : "text-slate-500")}>Day</span></button>
                                <button onClick={() => setIsDay(false)} className={clsx("flex flex-col items-center justify-center p-3 rounded-xl border transition-all", !display.isDay ? "bg-indigo-500/10 border-indigo-500/50" : isDarkMode ? "bg-white/5 border-white/5 opacity-50" : "bg-slate-50 border-slate-200 opacity-50")}><Moon size={18} className={!display.isDay ? "text-indigo-400 mb-2" : "text-slate-400 mb-2"} /><span className={clsx("text-xs font-bold", !display.isDay ? "text-indigo-400" : "text-slate-500")}>Night</span></button>
                            </div>
                            <GradientSlider label="Atmospheric Fog" icon={Wind} value={fogDensity} displayValue={display.fogDensity} min={0} max={0.3} step={0.005} onChange={(e: any) => setFogDensity(parseFloat(e.target.value))} gradient={isDarkMode ? "linear-gradient(to right, #0f172a, #94a3b8)" : "linear-gradient(to right, #ffffff, #94a3b8)"} isDarkMode={isDarkMode} />
                        </div>
                        <div>
                            <h3 className={sectionTitleClass}><Palette size={14} /> Styling</h3>
                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {Object.values(GRADIENT_THEMES).map((theme: any, i) => (
                                    <button key={i} onClick={() => applyGradientTheme(theme)} className="h-8 w-full rounded-lg border border-white/10 shadow-sm transition-transform hover:scale-105 active:scale-95" style={{ background: `linear-gradient(to bottom right, ${theme.from}, ${theme.via}, ${theme.to})` }} title={theme.label} />
                                ))}
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className={clsx("text-[10px] uppercase font-bold mb-2 block", isDarkMode ? "text-slate-500" : "text-slate-400")}>Cloud Tint</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CURATED_COLORS.map(c => (
                                            <button key={c} onClick={() => setCloudColor(c)} className={clsx("w-5 h-5 rounded-full border shadow-sm transition-transform hover:scale-110", display.cloudColor === c ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900" : "border-white/20")} style={{ backgroundColor: c }} />
                                        ))}
                                        <input type="color" value={cloudColor} onChange={(e) => setCloudColor(e.target.value)} className="w-5 h-5 rounded-full overflow-hidden cursor-pointer border-none p-0 opacity-50 hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <CodePanel config={cloudConfig} theme={customGradient} isDarkMode={isDarkMode} />
                )}
            </div>

            <div className="lg:col-span-8 sticky top-24 h-[85vh]">
                <div className={clsx("absolute inset-0 rounded-3xl border overflow-hidden pointer-events-none transition-colors", isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white/60 border-slate-200")}>
                    {showGrid && <div className={clsx("absolute inset-0 opacity-20", isDarkMode ? "bg-[radial-gradient(#4f46e5_1px,transparent_1px)]" : "bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]")} style={{ backgroundSize: '24px 24px' }}></div>}
                </div>

                <div className="relative h-full flex flex-col items-center justify-center p-12 overflow-visible">
                    <div className={clsx("relative z-10 w-full max-w-md transition-all duration-500", !focusMode && "hover:scale-[1.02]")}>
                        <WeatherCard
                            key={cardKey}
                            data={studioCity}
                            index={0}
                            isDemo={true}
                            customCloudConfig={cloudConfig}
                            customData={focusMode ? { ...studioCity, city: '', country: '', placeholderData: { ...studioCity.placeholderData, temp_c: 0, condition: '' } } : studioCity}
                            customGradient={customGradient}
                            showLayers={showLayers}
                        />
                        {focusMode && <div className="absolute inset-0 z-50 rounded-3xl backdrop-blur-3xl bg-black/20 pointer-events-none flex items-center justify-center text-white/50 text-sm font-mono">UI Hidden</div>}
                    </div>

                    <CanvasToolbar
                        showGrid={showGrid} setShowGrid={setShowGrid}
                        focusMode={focusMode} setFocusMode={setFocusMode}
                        resetCamera={() => setCardKey(p => p + 1)}
                        isDarkMode={isDarkMode}
                    />

                    <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none space-y-1">
                        <div className={clsx("text-xs font-mono uppercase tracking-widest", isDarkMode ? "text-slate-500" : "text-slate-400")}>
                            WebGL 2.0 • Real-time Render
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignStudio;
