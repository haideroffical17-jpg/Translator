import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, ArrowRight, Zap, Download, Wand2, Settings, Key, 
  ChevronLeft, Play, Pause, AlertCircle, Sliders 
} from 'lucide-react';

// --- CONFIGURATION ---
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const CHUNK_SIZE = 4000; 

// --- VOICES LIST (VERIFIED) ---
const VOICES = [
  { id: "Fenrir", gender: "Male", desc: "Deep & Calm" },
  { id: "Kore", gender: "Female", desc: "Soothing & Clear" },
  { id: "Puck", gender: "Male", desc: "Energetic" },
  { id: "Aoede", gender: "Female", desc: "Warm & Friendly" },
  { id: "Charon", gender: "Male", desc: "Deep & Authoritative" },
  { id: "Zephyr", gender: "Male", desc: "Smooth & Balanced" },
  { id: "Leda", gender: "Female", desc: "Soft & Gentle" },
  { id: "Orus", gender: "Male", desc: "Confident" },
  { id: "Umbriel", gender: "Male", desc: "Steady & Neutral" },
  { id: "Iapetus", gender: "Male", desc: "Serious & Deep" }
];

// --- MAIN APP COMPONENT ---
export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'tts'

  // --- RENDER ---
  if (currentView === 'home') {
    return <LandingPage onNavigate={setCurrentView} />;
  }

  if (currentView === 'tts') {
    return <TTSProTool onBack={() => setCurrentView('home')} />;
  }

  return null;
}

// --- 1. LANDING PAGE (DASHBOARD) ---
function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="bg-[#1E293B] border border-slate-700/50 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-indigo-300 uppercase mb-6 shadow-lg">
        Powered by Grow with Haider
      </div>

      {/* Title */}
      <div className="text-center mb-16 space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          AI Creator Studio
        </h1>
        <p className="text-slate-400 text-lg font-medium">
          Professional Tools Suite
        </p>
      </div>

      {/* Single Focused Card */}
      <div className="w-full max-w-md">
        
        {/* Card: TTS Pro */}
        <div 
          onClick={() => onNavigate('tts')}
          className="group relative bg-[#162032] border border-slate-800 rounded-3xl p-10 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20 cursor-pointer transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
          
          <div className="flex flex-col items-center text-center space-y-8 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
              <Mic className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">Text to Speech Pro</h3>
              <p className="text-slate-400 text-base leading-relaxed">
                30+ Premium Voices. Unlimited Text. <br/>Instant WAV Download.
              </p>
            </div>

            <button className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold group-hover:bg-emerald-500 group-hover:text-white transition-all">
              Open Tool <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- 2. TTS PRO TOOL (Internal Component) ---
function TTSProTool({ onBack }) {
  // State
  const [text, setText] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("Fenrir");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Controls State
  const [speed, setSpeed] = useState(1.0);
  
  // Refs
  const apiKeyInputRef = useRef(null);
  const currentKeyIndex = useRef(0);

  useEffect(() => {
    const storedKeys = localStorage.getItem("multi_api_keys");
    if (storedKeys) setApiKeys(JSON.parse(storedKeys));
  }, []);

  // --- Logic ---
  const handleSaveKey = () => {
    const key = apiKeyInputRef.current.value.trim();
    if (key) {
      const newKeys = [...apiKeys, key];
      setApiKeys(newKeys);
      localStorage.setItem("multi_api_keys", JSON.stringify(newKeys));
      apiKeyInputRef.current.value = "";
      alert("Key Added!");
    }
  };

  const handleClearKeys = () => {
    setApiKeys([]);
    localStorage.removeItem("multi_api_keys");
  };

  // --- Generation Core ---
  const generateAudio = async () => {
    if (!text.trim()) return;
    if (apiKeys.length === 0) {
      setShowSettings(true);
      setError("Please add an API Key first!");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setAudioUrl(null);

    try {
      const chunks = chunkText(text);
      const buffers = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const buffer = await fetchWithRotation(chunk, selectedVoiceId);
        buffers.push(buffer);
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      const finalBlob = mergeBuffers(buffers);
      const url = URL.createObjectURL(finalBlob);
      setAudioUrl(url);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewVoice = async (voiceId) => {
    if (apiKeys.length === 0) return setShowSettings(true);
    if (previewAudio) { previewAudio.pause(); setPreviewAudio(null); }

    try {
      const buffer = await fetchWithRotation("Hello.", voiceId);
      const blob = createWavFromBuffer(buffer);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      // Client-side speed control for preview
      audio.playbackRate = speed; 
      
      audio.play().catch(e => {
        console.error("Play error:", e);
        setError("Playback failed: " + e.message);
      });
      setPreviewAudio(audio);
    } catch (err) {
      setError("Preview failed: " + err.message);
    }
  };

  // --- API Utilities ---
  async function fetchWithRotation(text, voiceId) {
    let attempts = 0;
    while (attempts < apiKeys.length) {
      const key = apiKeys[currentKeyIndex.current];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${key}`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { 
                voiceConfig: { 
                  prebuiltVoiceConfig: { voiceName: voiceId }
                } 
              }
            }
          })
        });

        if (!response.ok) {
          if (response.status === 429 || response.status === 403) {
            currentKeyIndex.current = (currentKeyIndex.current + 1) % apiKeys.length;
            attempts++;
            continue;
          }
          throw new Error(await response.text());
        }

        const data = await response.json();
        const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!b64) throw new Error("No audio");
        
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes.buffer;

      } catch (e) {
        if (e.message.includes("Quota")) {
           currentKeyIndex.current = (currentKeyIndex.current + 1) % apiKeys.length;
           attempts++;
        } else {
           throw e;
        }
      }
    }
    throw new Error("All API Keys exhausted.");
  }

  function chunkText(str) {
    const chunks = [];
    let current = "";
    const sentences = str.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [str];
    sentences.forEach(s => {
        if(current.length + s.length < CHUNK_SIZE) current += s;
        else { if(current) chunks.push(current); current = s; }
    });
    if(current) chunks.push(current);
    return chunks;
  }

  // --- ROBUST AUDIO MERGING (WAV FIX) ---
  
  // Helper to check if buffer is already WAV (has RIFF header)
  function isWav(buffer) {
    if (buffer.byteLength < 4) return false;
    const view = new DataView(buffer);
    return view.getUint32(0, false) === 0x52494646; // 'RIFF'
  }

  // Helper to find data chunk start in a WAV file
  function findDataOffset(buffer) {
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length - 4; i++) {
      // Find 'data'
      if (bytes[i]===0x64 && bytes[i+1]===0x61 && bytes[i+2]===0x74 && bytes[i+3]===0x61) {
        return i + 8; // data tag + 4 bytes size
      }
    }
    return 44; // Default fallback
  }

  function mergeBuffers(buffers) {
    if (buffers.length === 0) return new Blob([]);
    
    let totalDataLen = 0;
    const parts = [];

    // Strip headers and calculate total length
    buffers.forEach(b => {
        let offset = 0;
        if (isWav(b)) {
            offset = findDataOffset(b);
        }
        const chunkData = b.slice(offset);
        parts.push(chunkData);
        totalDataLen += chunkData.byteLength;
    });
    
    // Create new valid header for the total length
    const header = createWavHeader(totalDataLen);
    return new Blob([header, ...parts], { type: 'audio/wav' });
  }

  function createWavFromBuffer(buffer) {
      // If already WAV, return as is
      if (isWav(buffer)) return new Blob([buffer], { type: 'audio/wav' });
      
      // Otherwise wrap raw PCM
      const header = createWavHeader(buffer.byteLength);
      return new Blob([header, buffer], { type: 'audio/wav' });
  }

  function createWavHeader(len) {
      const buffer = new ArrayBuffer(44);
      const view = new DataView(buffer);
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + len, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 24000, true); // Gemini standard 24kHz
      view.setUint32(28, 48000, true); // 24000 * 1 * 2
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, len, true);
      return buffer;
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  }

  // --- Render Tool UI ---
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans flex flex-col">
      
      {/* Nav */}
      <div className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg"><Mic className="w-4 h-4" /></span>
            Text to Speech Pro
          </h1>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Key className="w-4 h-4 text-indigo-400"/> API Key Manager</h3>
            <div className="space-y-3">
              <input ref={apiKeyInputRef} type="password" placeholder="Paste Gemini API Key..." className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 text-white" />
              <div className="flex gap-2">
                <button onClick={handleSaveKey} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-sm font-bold">Add Key</button>
                <button onClick={() => setShowSettings(false)} className="px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm">Close</button>
              </div>
              <div className="text-xs text-slate-500 pt-2">
                Active Keys: {apiKeys.length} (Auto-rotate enabled)
                {apiKeys.length > 0 && <button onClick={handleClearKeys} className="text-red-400 ml-2 hover:underline">Clear All</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full grid lg:grid-cols-2 gap-6">
        
        {/* Left: Input */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-1 flex-1 flex flex-col shadow-xl">
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your script here..." 
              className="flex-1 w-full bg-transparent text-lg p-6 resize-none outline-none text-slate-200 placeholder:text-slate-600"
            />
            <div className="px-6 py-3 border-t border-slate-700/50 text-right text-xs text-slate-500 font-mono">
              {text.length} characters
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col gap-4">
          
          {/* Voice & Settings Selector */}
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl overflow-hidden flex flex-col h-[450px] shadow-xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-700 bg-[#1E293B] sticky top-0 z-10 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Controls</span>
              <Sliders className="w-4 h-4 text-slate-500" />
            </div>

            {/* Sliders */}
            <div className="p-6 space-y-6 bg-[#162032] border-b border-slate-700">
               {/* Speed */}
               <div>
                 <div className="flex justify-between mb-2 text-xs font-medium">
                   <span className="text-slate-400 uppercase">Speed (Preview Only)</span>
                   <span className="text-emerald-400">{speed}x</span>
                 </div>
                 <input 
                   type="range" min="0.5" max="2.0" step="0.1" value={speed} 
                   onChange={(e) => setSpeed(parseFloat(e.target.value))}
                   className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                 />
               </div>
            </div>

            <div className="px-6 py-2 bg-[#1E293B] text-xs font-bold text-slate-400 uppercase tracking-wider">
              Voices
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {VOICES.map(voice => (
                <div 
                  key={voice.id}
                  onClick={() => setSelectedVoiceId(voice.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${selectedVoiceId === voice.id ? 'bg-emerald-600/20 border border-emerald-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedVoiceId === voice.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {voice.id[0]}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${selectedVoiceId === voice.id ? 'text-emerald-400' : 'text-slate-300'}`}>{voice.id}</h4>
                      <p className="text-[10px] text-slate-500">{voice.gender} • {voice.desc}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); previewVoice(voice.id); }}
                    className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Decor */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 space-y-4">
              {isGenerating ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-emerald-400">
                    <span>Generating...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <button 
                  onClick={generateAudio}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" /> Generate Audio
                </button>
              )}

              {audioUrl && !isGenerating && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 pt-2">
                  <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-700">
                    <audio controls src={audioUrl} className="w-full h-8 opacity-80" />
                  </div>
                  <a 
                    href={audioUrl} 
                    download={`tts-${selectedVoiceId}-${Date.now()}.wav`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download File
                  </a>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex gap-2 items-start text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
