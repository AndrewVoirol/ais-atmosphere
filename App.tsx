import React, { useState, useRef, useEffect } from 'react';
import { SAMPLE_CITIES } from './constants';
import DesignStudio from './components/DesignStudio';
import DraggableCard from './components/DraggableCard';
import { LayoutDashboard, PenTool, Sparkles, Loader2, Sun, Moon, CloudSun } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { GoogleGenAI, Type } from "@google/genai";
import { CityWeather } from './types';
import { Reorder } from 'framer-motion';
import clsx from 'clsx';
import { hydrateWeatherData } from './utils/weatherUtils';

/**
 * Main Application Component.
 * Manages the state of the weather dashboard, including view modes,
 * theme (dark/light), and the list of weather locations.
 */
const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'feed' | 'studio'>('feed');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load locations from local storage or use sample data
  const [locations, setLocations] = useState<CityWeather[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('atmosphere_locations');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load locations from storage", e);
      }
    }
    return SAMPLE_CITIES;
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist locations to local storage
  useEffect(() => {
    localStorage.setItem('atmosphere_locations', JSON.stringify(locations));
  }, [locations]);

  /**
   * Handles the AI generation of new weather locations.
   * Uses Google's Gemini API to generate JSON data for cities.
   */
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      // @ts-ignore
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("API Key not found");
        alert("Please set VITE_GEMINI_API_KEY in .env.local");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are an expert atmospheric designer and world-builder. Your goal is to generate 9 deeply atmospheric, visually distinct, and evocative locations based on the user's theme.
      The theme could be realistic (e.g., "European Capitals", "Tropical Paradises") or fantasy/sci-fi (e.g., "Cyberpunk Neon", "Mars Terraformed", "Middle Earth Storms").
      
      CRITICAL: Be varied in weather conditions to demonstrate the full range of the engine's visual capabilities. 
      - Mix 'clear-day', 'clear-night', 'rain', 'snow', 'fog', 'thunderstorm', 'overcast'.
      - For fantasy themes, feel free to use extreme temperatures and descriptive conditions (e.g., "Acid Rain", "Solar Flare").
      - Ensure a mix of day and night scenes.
      
      Return a strictly valid JSON array.
      Fields: 
      - city (string)
      - country (string, or planet/region if fantasy)
      - temp_c (number, can be extreme for fantasy)
      - condition (string, descriptive e.g. "Acid Rain", "Neon Mist")
      - humidity (0-100)
      - wind_kph (number)
      - is_day (boolean)
      - icon_slug (must be one of: 'clear-day', 'partly-cloudy-day', 'clear-day-hot', 'snow', 'rain', 'fog', 'overcast', 'thunderstorm', 'partly-cloudy-night', 'clear-night')`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Updated to recommended model
        contents: `Theme: ${aiPrompt}`,
        config: {
          // thinkingConfig: { thinkingBudget: 1024 }, // Removed as it might not be supported in all tiers
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                city: { type: Type.STRING }, country: { type: Type.STRING }, temp_c: { type: Type.NUMBER }, condition: { type: Type.STRING }, humidity: { type: Type.NUMBER }, wind_kph: { type: Type.NUMBER }, is_day: { type: Type.BOOLEAN },
                icon_slug: { type: Type.STRING, enum: ['clear-day', 'partly-cloudy-day', 'clear-day-hot', 'snow', 'rain', 'fog', 'overcast', 'thunderstorm', 'partly-cloudy-night', 'clear-night'] },
              }, required: ['city', 'country', 'temp_c', 'condition', 'humidity', 'wind_kph', 'is_day', 'icon_slug']
            }
          }
        }
      });
      if (response.text) {
        let text = response.text;
        // Clean up markdown code blocks if present (though responseMimeType usually handles this)
        if (text.startsWith('```json')) {
          text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        const rawData = JSON.parse(text);
        const newLocations = hydrateWeatherData(rawData, Date.now());
        setLocations(newLocations);
      }
    } catch (error) {
      console.error("Failed", error);
      alert("Failed to generate content. Check console for details.");
    }
    finally { setIsGenerating(false); }
  };

  return (
    <div ref={containerRef} className={clsx("min-h-screen relative overflow-y-auto overflow-x-hidden selection:bg-blue-500/30 transition-colors duration-500", isDarkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-800")}>

      {/* Background Ambience & Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle Grid Pattern */}
        <div className={clsx("absolute inset-0 bg-[size:24px_24px] transition-opacity duration-500", isDarkMode ? "bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]" : "bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]")}></div>
        {/* Top Center Spotlight Glow */}
        <div className={clsx("absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 blur-[100px] transition-opacity duration-500", isDarkMode ? "opacity-20" : "opacity-10")}></div>
        <div className={clsx("absolute left-1/4 bottom-0 -z-10 h-[200px] w-[200px] rounded-full bg-purple-500 blur-[80px] transition-opacity duration-500", isDarkMode ? "opacity-10" : "opacity-5")}></div>
      </div>

      <Canvas eventSource={containerRef} className="pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}><View.Port /></Canvas>

      {/* Floating Glass Toolbar */}
      <header className={clsx(
        "sticky top-4 z-50 mx-4 xl:mx-auto max-w-7xl flex flex-col xl:flex-row justify-between items-center",
        "p-4 md:px-6 gap-6 rounded-3xl border backdrop-blur-2xl shadow-2xl transition-all duration-500 mb-8",
        isDarkMode
          ? "bg-slate-950/60 border-white/10 shadow-black/40"
          : "bg-white/70 border-white/50 shadow-slate-200/60 ring-1 ring-slate-900/5"
      )}>
        <div className="flex items-center space-x-4 mb-4 md:mb-0 shrink-0">
          <div className={clsx("p-3 rounded-2xl border shadow-sm flex items-center justify-center transition-colors", isDarkMode ? "bg-blue-600/20 border-blue-500/30 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600")}>
            <CloudSun size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={clsx("text-2xl font-bold tracking-tight transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>Atmosphere</h1>
            <p className="text-[10px] text-blue-500/90 font-bold tracking-widest uppercase">Global Forecast</p>
          </div>
        </div>

        {viewMode === 'feed' && (
          <div className="w-full max-w-xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <form onSubmit={handleGenerate} className={clsx("relative flex items-center border rounded-xl overflow-hidden shadow-inner backdrop-blur-md transition-colors", isDarkMode ? "bg-slate-900/60 border-white/10" : "bg-white/60 border-slate-300/50")}>
              <div className="pl-4 text-slate-400"><Sparkles size={16} className={isGenerating ? "animate-pulse text-purple-400" : ""} /></div>
              <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Ask AI... (e.g., 'Cyberpunk Cities', 'Mars Colony')" className={clsx("w-full bg-transparent border-none px-4 py-2.5 text-sm focus:outline-none", isDarkMode ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-500")} disabled={isGenerating} />
              <button type="submit" disabled={isGenerating} className={clsx("mr-1 px-3 py-1.5 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider border", isDarkMode ? "bg-white/10 hover:bg-white/20 text-white border-white/5" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200")}>{isGenerating ? <Loader2 size={14} className="animate-spin" /> : 'Generate'}</button>
            </form>
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <div className={clsx("flex items-center gap-1 rounded-full p-1 border backdrop-blur-md shadow-sm transition-colors", isDarkMode ? "bg-black/20 border-white/5" : "bg-white/40 border-slate-200/60")}>
            <button onClick={() => setViewMode('feed')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${viewMode === 'feed' ? 'bg-blue-600 text-white shadow-md' : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}`}><LayoutDashboard size={14} />Feed</button>
            <button onClick={() => setViewMode('studio')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${viewMode === 'studio' ? 'bg-amber-600 text-white shadow-md' : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}`}><PenTool size={14} />Studio</button>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={clsx("p-2.5 rounded-full border transition-all shadow-sm", isDarkMode ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto min-h-[80vh]">
        {viewMode === 'feed' ? (
          <Reorder.Group
            values={locations}
            onReorder={setLocations}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0"
          >
            {locations.map((city, index) => (
              <DraggableCard key={city.id} city={city} index={index} />
            ))}
          </Reorder.Group>
        ) : (
          <DesignStudio isDarkMode={isDarkMode} />
        )}
      </main>
      <footer className="relative z-10 text-center py-10 opacity-30 text-xs font-light"><p>© 2025 Atmosphere Weather. Designed with React Three Fiber & Tailwind.</p></footer>
    </div>
  );
};

export default App;