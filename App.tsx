
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, Sparkles, Video, Clapperboard, Lightbulb, Volume2, 
  Terminal, Zap, User, Layers, Monitor, Eye, Download, 
  RefreshCw, X, ZoomIn, Aperture, Maximize2, Mic, Play, Pause,
  ChevronLeft, ChevronRight, Menu, Headphones, Target, Edit3,
  ListVideo, ImageIcon, ShoppingBag, Activity, Scissors, Search,
  Copy, Check, Sun, MapPin
} from 'lucide-react';
import * as Constants from './constants';
import * as Gemini from './geminiService';
import { SceneManifest, AngleResult, VoiceOption } from './types';

export default function App() {
  // --- NAVIGATION ---
  const [viewMode, setViewMode] = useState('generator'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // --- VIDEO GENERATOR STATE ---
  const [genImage, setGenImage] = useState<string | null>(null);
  const [productData, setProductData] = useState({ name: '', type: 'skincare', gender: 'perempuan' });
  const [activeScene, setActiveScene] = useState(1);
  const [unlockedScenes, setUnlockedScenes] = useState([1]);
  const [genLoading, setGenLoading] = useState(false);
  const [generatedSceneImages, setGeneratedSceneImages] = useState<Record<number, string>>({});
  const [generatedScenes, setGeneratedScenes] = useState<Record<number, SceneManifest>>({});
  const [microZoomEnabled, setMicroZoomEnabled] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false });
  const [copySuccess, setCopySuccess] = useState(false);

  // --- EDITOR STATE ---
  const [editSceneImage, setEditSceneImage] = useState<string | null>(null);
  const [editProductImage, setEditProductImage] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editResults, setEditResults] = useState<string[]>([]);
  const [editConfig, setEditConfig] = useState({
    background: Constants.LOCATION_OPTIONS[1].value,
    lighting: Constants.LIGHTING_OPTIONS[0].value,
    ratio: "9:16", // Forced to 9:16
    prompt: ''
  });

  // --- CONVERSION ANGLE STATE ---
  const [angleInputs, setAngleInputs] = useState({ product: '', target: '', benefit: '', gender: 'female' });
  const [angleLoading, setAngleLoading] = useState(false);
  const [angleResults, setAngleResults] = useState<AngleResult[]>([]);
  const [angleImages, setAngleImages] = useState<Record<number, string>>({});
  const [angleGenLoading, setAngleGenLoading] = useState<Record<number, boolean>>({ 0: false });

  // --- TTS STATE ---
  const [ttsText, setTtsText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(Constants.VOICES[0]);
  const [isTtsGenerating, setIsTtsGenerating] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- HANDLERS ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenScene = async () => {
    if (!genImage || !productData.name) return;
    setGenLoading(true);
    const sceneInfo = Constants.SCENE_ROLES.find(r => r.id === activeScene);
    const context = `${sceneInfo?.name}: ${sceneInfo?.description}`;
    
    // Construct Zoom Prompt
    let zoomPrompt = "";
    if (microZoomEnabled[activeScene]) {
      zoomPrompt = " Perform an extreme cinematic micro-zoom focus on the product's texture and branding details.";
    }

    try {
      const prompt = `Create Scene ${activeScene} of a TikTok affiliate video for ${productData.name} (${productData.type}). 
                      The character is ${productData.gender}. Context: ${context}.${zoomPrompt} 
                      STRICT IDENTITY LOCK: The person must look EXACTLY like the reference image. The product must look EXACTLY like the one in the reference. Composition: 9:16 Vertical.`;
      
      const [img, manifest] = await Promise.all([
        Gemini.generateSceneImage(genImage, prompt),
        Gemini.generateSceneManifest(genImage, context, productData)
      ]);
      
      if (img) setGeneratedSceneImages(prev => ({ ...prev, [activeScene]: img }));
      if (manifest) setGeneratedScenes(prev => ({ ...prev, [activeScene]: manifest }));
      if (activeScene < 4 && !unlockedScenes.includes(activeScene + 1)) {
        setUnlockedScenes(prev => [...prev, activeScene + 1]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenLoading(false);
    }
  };

  const handleVoiceOverUpdate = (newText: string) => {
    if (!generatedScenes[activeScene]) return;
    setGeneratedScenes(prev => {
      const current = prev[activeScene];
      if (!current) return prev;
      return {
        ...prev,
        [activeScene]: {
          ...current,
          voice_over: {
            ...current.voice_over,
            script: newText
          }
        }
      };
    });
  };

  const handleCopyManifest = () => {
    const manifest = generatedScenes[activeScene];
    if (!manifest) return;
    
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2)).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleGenerateAngles = async () => {
    if (!angleInputs.product) return;
    setAngleLoading(true);
    try {
      const res = await Gemini.generateViralAngles(angleInputs);
      setAngleResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAngleLoading(false);
    }
  };

  const handleGenerateAngleImage = async (idx: number, prompt: string) => {
    setAngleGenLoading(prev => ({ ...prev, [idx]: true }));
    try {
      const img = await Gemini.generateSceneImage(genImage || "", prompt + " (9:16 vertical orientation)"); 
      if (img) setAngleImages(prev => ({ ...prev, [idx]: img }));
    } catch (e) {
      console.error(e);
    } finally {
      setAngleGenLoading(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleVoiceGen = async () => {
    if (!ttsText) return;
    setIsTtsGenerating(true);
    try {
      const b64 = await Gemini.generateVoice(ttsText, selectedVoice.model);
      if (b64) {
        setTtsAudioUrl(`data:audio/wav;base64,${b64}`); 
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTtsGenerating(false);
    }
  };

  const downloadImage = (b64: string, name: string) => {
    const link = document.createElement('a');
    link.href = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
    link.download = `${name}.png`;
    link.click();
  };

  const handleEditorBatchGenerate = async () => {
    if (!editSceneImage || !editProductImage) return;
    setEditLoading(true);
    try {
      const prompt = `Professional Composite: Place the product from reference image 2 into the hands of the person from reference image 1. 
                      Environment: ${editConfig.background}. Lighting: ${editConfig.lighting}. 
                      STRICT IDENTITY LOCK: Preserve the character's exact identity and the product's exact visual design. 9:16 Vertical Portrait. ${editConfig.prompt}`;
      
      const promises = [1, 2, 3, 4].map(() => 
        Gemini.generateSceneImage([editSceneImage!, editProductImage!], prompt)
      );
      
      const results = await Promise.all(promises);
      const validResults = results.filter((img): img is string => img !== null);
      setEditResults(validResults);
    } catch (e) {
      console.error("Batch Generation Error:", e);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden text-left selection:bg-emerald-500 selection:text-white font-inter">
      {/* Sidebar */}
      <aside className={`fixed lg:relative h-full bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 z-50 shadow-2xl ${isSidebarOpen ? 'w-80' : 'w-0 lg:w-24 overflow-hidden'}`}>
        <div className="p-6 flex items-center gap-4 h-24">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap size={24} className="text-white fill-white" />
          </div>
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight">Raw Engine</span>}
        </div>
        
        <nav className="flex-1 p-4 space-y-4">
          {[
            { id: 'editor', icon: Sparkles, label: 'Photo Edit' },
            { id: 'generator', icon: Video, label: 'Video Gen' },
            { id: 'conversion_angle', icon: Lightbulb, label: 'Angles' },
            { id: 'tts', icon: Volume2, label: 'Voice AI' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => { setViewMode(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${viewMode === item.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
            >
              <item.icon size={24} />
              {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="p-6 mt-auto">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 transition-all">
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <header className="h-24 px-8 md:px-12 flex items-center justify-between sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-800 rounded-xl text-emerald-400"><Menu size={24} /></button>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                <Terminal size={24} className="text-emerald-500" />
                {viewMode.replace('_', ' ').toUpperCase()}
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">System Operational // Format: TikTok Portrait (9:16)</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">9:16 Engine Active</span>
          </div>
        </header>

        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
          {/* Module: Video Gen */}
          {viewMode === 'generator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900/60 p-8 border border-slate-800 rounded-3xl shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><User size={16} className="text-emerald-500" /> Identity Lock</h3>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">AFFILIATE READY</span>
                  </div>
                  <div 
                    onClick={() => document.getElementById('gen-up')?.click()}
                    className={`relative h-64 w-full border-2 border-dashed border-slate-700 bg-slate-950/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all group overflow-hidden ${genImage ? 'border-solid border-emerald-500' : ''}`}
                  >
                    {genImage ? <img src={genImage} className="absolute inset-0 w-full h-full object-cover" alt="ref" /> : <><Upload size={32} className="text-slate-500 group-hover:text-emerald-500 mb-2" /><span className="text-xs font-bold text-slate-500">Upload Character + Product Reference</span></>}
                    <input id="gen-up" type="file" className="hidden" onChange={(e) => handleFileUpload(e, setGenImage)} />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-4 leading-relaxed italic">Tip: Use a photo where the person is holding the product for maximum visual locking.</p>
                </div>

                <div className="bg-slate-900/60 p-8 border border-slate-800 rounded-3xl shadow-xl space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><Layers size={16} className="text-emerald-500" /> Production Logic</h3>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product Information</label>
                    <input placeholder="Nama Produk..." className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none focus:border-emerald-500 transition-all text-sm font-medium" value={productData.name} onChange={e => setProductData({...productData, name: e.target.value})} />
                    
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-2">Gender UGC</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setProductData({...productData, gender: 'laki-laki'})}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${productData.gender === 'laki-laki' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                      >
                        <User size={14} /> Laki-laki
                      </button>
                      <button 
                        onClick={() => setProductData({...productData, gender: 'perempuan'})}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${productData.gender === 'perempuan' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                      >
                        <User size={14} /> Perempuan
                      </button>
                    </div>

                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-2">Category</label>
                    <select className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none focus:border-emerald-500 text-xs font-bold" value={productData.type} onChange={e => setProductData({...productData, type: e.target.value})}>
                      {Constants.PRODUCT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                <div className="flex bg-slate-950/50 p-2 gap-2 border-b border-slate-800 overflow-x-auto scrollbar-hide">
                  {Constants.SCENE_ROLES.map(s => (
                    <button key={s.id} disabled={!unlockedScenes.includes(s.id)} onClick={() => setActiveScene(s.id)} className={`min-w-[120px] flex-1 py-4 text-xs font-bold rounded-xl transition-all ${activeScene === s.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>

                <div className="p-8 space-y-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <button disabled={genLoading || !genImage || !productData.name} onClick={handleGenScene} className="flex-1 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white font-bold tracking-widest hover:scale-[1.01] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/10">
                      {genLoading ? <RefreshCw className="animate-spin mx-auto" /> : `PRODUCE 9:16 SCENE 0${activeScene}`}
                    </button>
                    
                    <button 
                      onClick={() => setMicroZoomEnabled(prev => ({...prev, [activeScene]: !prev[activeScene]}))}
                      className={`px-6 py-5 rounded-2xl border font-bold text-xs transition-all flex items-center gap-3 ${microZoomEnabled[activeScene] ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                    >
                      <Search size={18} /> {microZoomEnabled[activeScene] ? 'ZOOM: ON' : 'ZOOM: OFF'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Monitor size={16} /> Visual Pipeline (TikTok Format)</h4>
                      <div className="aspect-[9/16] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative group shadow-inner mx-auto max-w-[300px]">
                        {generatedSceneImages[activeScene] ? (
                          <>
                            <img src={`data:image/png;base64,${generatedSceneImages[activeScene]}`} className="w-full h-full object-cover animate-in fade-in duration-700" alt="out" />
                            <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm flex flex-col items-center justify-center p-6 gap-3">
                              <button onClick={() => setPreviewImage(generatedSceneImages[activeScene])} className="w-full py-3 bg-white text-slate-950 font-bold text-xs rounded-full hover:bg-emerald-500 hover:text-white transition-all">PREVIEW HD</button>
                              <button onClick={() => downloadImage(generatedSceneImages[activeScene], `scene_${activeScene}`)} className="w-full py-3 bg-emerald-500 text-white font-bold text-xs rounded-full hover:bg-emerald-600 transition-all">EXPORT 9:16</button>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-800">
                            <Activity size={48} className="opacity-20 mb-2 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Portrait Render</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={16} /> Scene Manifest</h4>
                        {generatedScenes[activeScene] && (
                          <button 
                            onClick={handleCopyManifest}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-500 hover:bg-slate-700'}`}
                          >
                            {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                            {copySuccess ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                      
                      {/* Manifest View */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex-1 font-mono text-[10px] text-emerald-500 overflow-auto scrollbar-hide shadow-inner relative group">
                        {generatedScenes[activeScene] ? (
                          <pre>{JSON.stringify(generatedScenes[activeScene], null, 2)}</pre>
                        ) : (
                          <div className="h-full flex items-center justify-center italic opacity-20">No manifest available</div>
                        )}
                      </div>

                      {/* Real-time Voice Over Editor */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                         <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Scissors size={14} /> Script Refiner</span>
                           <span className="text-[8px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold animate-pulse">LIVE SYNC</span>
                         </div>
                         <textarea 
                           disabled={!generatedScenes[activeScene]}
                           value={generatedScenes[activeScene]?.voice_over?.script || ""}
                           onChange={(e) => handleVoiceOverUpdate(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-medium text-slate-300 outline-none focus:border-emerald-500 h-24 resize-none placeholder:opacity-20"
                           placeholder="Voice over script will appear here after generation..."
                         />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module: Editor */}
          {viewMode === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-top-4">
              <div className="lg:col-span-4 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => document.getElementById('edit-scene')?.click()} className={`h-40 border-2 border-dashed border-slate-800 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500/50 relative overflow-hidden ${editSceneImage ? 'border-solid border-emerald-500' : ''}`}>
                    {editSceneImage ? <img src={editSceneImage} className="absolute inset-0 w-full h-full object-cover" alt="s" /> : <><ImageIcon size={24} className="text-slate-500 mb-2" /><span className="text-[10px] font-bold uppercase opacity-50 text-center px-4">Character Ref</span></>}
                    <input id="edit-scene" type="file" className="hidden" onChange={e => handleFileUpload(e, setEditSceneImage)} />
                  </div>
                  <div onClick={() => document.getElementById('edit-prod')?.click()} className={`h-40 border-2 border-dashed border-slate-800 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500/50 relative overflow-hidden ${editProductImage ? 'border-solid border-emerald-500' : ''}`}>
                    {editProductImage ? <img src={editProductImage} className="absolute inset-0 w-full h-full object-cover" alt="p" /> : <><ShoppingBag size={24} className="text-slate-500 mb-2" /><span className="text-[10px] font-bold uppercase opacity-50 text-center px-4">Product Ref</span></>}
                    <input id="edit-prod" type="file" className="hidden" onChange={e => handleFileUpload(e, setEditProductImage)} />
                  </div>
                </div>

                <div className="bg-slate-900/60 p-8 border border-slate-800 rounded-3xl shadow-xl space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><Sparkles size={16} className="text-emerald-500" /> Composite Engine (9:16)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><MapPin size={12} /> Location Selection</label>
                      <select className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none text-xs font-bold focus:border-emerald-500" value={editConfig.background} onChange={e => setEditConfig({...editConfig, background: e.target.value})}>
                        {Constants.LOCATION_OPTIONS.map(l => <option key={l.id} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Sun size={12} /> Lighting Ambience</label>
                      <select className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none text-xs font-bold focus:border-emerald-500" value={editConfig.lighting} onChange={e => setEditConfig({...editConfig, lighting: e.target.value})}>
                        {Constants.LIGHTING_OPTIONS.map(l => <option key={l.id} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>

                    <textarea placeholder="Special instructions (e.g. 'holding product, smiling')..." className="w-full h-32 bg-slate-950 border border-slate-800 p-4 rounded-xl outline-none text-sm resize-none focus:border-emerald-500 shadow-inner" value={editConfig.prompt} onChange={e => setEditConfig({...editConfig, prompt: e.target.value})} />
                  </div>
                  <button 
                    disabled={editLoading || !editSceneImage || !editProductImage}
                    onClick={handleEditorBatchGenerate}
                    className="w-full py-5 bg-emerald-500 rounded-2xl font-bold text-sm tracking-widest hover:scale-[1.01] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3"
                  >
                    {editLoading ? <RefreshCw className="animate-spin" /> : <><Sparkles size={18} /> GENERATE BATCH (4 VARIASI 9:16)</>}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 grid grid-cols-2 gap-8 relative">
                {editLoading && (
                  <div className="absolute inset-0 z-10 bg-slate-950/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center animate-in fade-in">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">Processing TikTok Portrait Batch...</p>
                  </div>
                )}
                
                {editResults.length > 0 ? editResults.map((img, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative group aspect-[9/16] shadow-xl animate-in zoom-in-95">
                    <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" alt={`variation-${idx}`} />
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">V{idx + 1}</div>
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm flex flex-col items-center justify-center p-8 gap-4">
                       <button onClick={() => setPreviewImage(img)} className="w-full py-4 bg-white text-slate-950 font-bold rounded-full hover:bg-emerald-500 hover:text-white transition-all">PREVIEW FULL</button>
                       <button onClick={() => downloadImage(img, `refined_variation_${idx}`)} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition-all">DOWNLOAD 4K</button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 h-[600px] bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center opacity-20 shadow-inner">
                    <Activity size={64} className="mb-4 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Awaiting Dual-Ref Portrait Processing<br/>(Semua hasil otomatis 9:16)</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setPreviewImage(null)}></div>
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 z-10 p-3 bg-black/50 text-white hover:bg-emerald-500 rounded-full transition-all">
              <X size={24} />
            </button>
            <div className="p-8 flex flex-col items-center">
               <img src={`data:image/png;base64,${previewImage}`} className="max-h-[75vh] rounded-2xl shadow-lg mb-8 aspect-[9/16] object-cover" alt="full" />
               <div className="flex gap-4 w-full">
                 <button onClick={() => downloadImage(previewImage, 'export_tiktok_hd')} className="flex-1 py-5 bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg">
                   <Download size={20} /> DOWNLOAD TIKTOK HD (9:16)
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
