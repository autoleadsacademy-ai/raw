
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Sparkles, Video, Terminal, Zap, User, Monitor, 
  Download, RefreshCw, X, Search, Scissors, ImageIcon, 
  ShoppingBag, Activity, MapPin, Sun, Menu, ChevronLeft, ChevronRight,
  Lightbulb, Volume2, Target, Play, Pause, Copy, Check, ShieldCheck, AlertCircle,
  Clapperboard, Frame, SearchCode, Focus, Layers, Eye, Maximize2, Settings2,
  Headphones, Quote, RotateCcw, CheckCircle2, ListVideo, FileText, Edit3, ArrowRight,
  // Added missing icons
  Mic, Film
} from 'lucide-react';
import * as Constants from './constants';
import * as Gemini from './geminiService';
import { SceneManifest, AngleResult } from './types';

export default function App() {
  const [viewMode, setViewMode] = useState('editor'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // --- VIDEO GENERATOR STATE ---
  const [genImage, setGenImage] = useState<string | null>(null);
  const [productData, setProductData] = useState({ name: '', type: 'skincare', gender: 'perempuan' });
  const [activeScene, setActiveScene] = useState(1);
  const [genLoading, setGenLoading] = useState(false);
  const [macroLoading, setMacroLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<number | string, string>>({});
  const [generatedScenes, setGeneratedScenes] = useState<Record<number, SceneManifest>>({});
  const [copySuccess, setCopySuccess] = useState(false);

  // --- CUSTOM SCENE STATE (Multi-step) ---
  const [customStep, setCustomStep] = useState(1);
  const [customCharImg, setCustomCharImg] = useState<string | null>(null);
  const [customBgImg, setCustomBgImg] = useState<string | null>(null);
  const [customRatio, setCustomRatio] = useState('9:16');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customResults, setCustomResults] = useState<string[]>([]);
  const [selectedCustomImage, setSelectedCustomImage] = useState<string | null>(null);
  const [customManifest, setCustomManifest] = useState<SceneManifest | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);

  // --- EDITOR STATE (BATCH) ---
  const [editSceneImg, setEditSceneImg] = useState<string | null>(null);
  const [editProdImg, setEditProdImg] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editResults, setEditResults] = useState<string[]>([]);
  const [editConfig, setEditConfig] = useState({ background: Constants.LOCATION_OPTIONS[1].value, lighting: Constants.LIGHTING_OPTIONS[0].value, ratio: '9:16', prompt: '' });

  // --- CONVERSION ANGLES STATE ---
  const [angleInputs, setAngleInputs] = useState({ product: '', target: '', benefit: '', gender: 'female' });
  const [angleLoading, setAngleLoading] = useState(false);
  const [angleResults, setAngleResults] = useState<AngleResult[]>([]);
  const [angleImages, setAngleImages] = useState<Record<number, string>>({});
  const [angleGenLoading, setAngleGenLoading] = useState<Record<number, boolean>>({});

  // --- TTS STATE ---
  const [ttsText, setTtsText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(Constants.VOICES[0]);
  const [isTtsGenerating, setIsTtsGenerating] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const authorized = await (window as any).aistudio.hasSelectedApiKey();
    setHasApiKey(authorized);
  };

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasApiKey(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProduceScene = async () => {
    if (!genImage || !productData.name) return;
    setGenLoading(true);
    const scene = Constants.SCENE_ROLES.find(r => r.id === activeScene);
    const prompt = `Scene: ${scene?.description}. Product: ${productData.name}. Character: ${productData.gender}. High fidelity UGC.`;
    
    try {
      const [img, manifest] = await Promise.all([
        Gemini.generateSceneImage(genImage, prompt, "9:16"),
        Gemini.generateSceneManifest(genImage, scene?.description || '', productData)
      ]);
      if (img) setGeneratedImages(prev => ({ ...prev, [activeScene]: img }));
      if (manifest) setGeneratedScenes(prev => ({ ...prev, [activeScene]: manifest }));
    } catch (e: any) {
      if (e.message === "API_KEY_NOT_FOUND") handleSelectKey();
      console.error(e);
    } finally {
      setGenLoading(false);
    }
  };

  const handleProduceMacro = async () => {
    if (!genImage || !productData.name) return;
    setMacroLoading(true);
    const prompt = `Extreme Macro Close-up of ${productData.name}. Detail texture, labels, professional commercial shot.`;
    
    try {
      const img = await Gemini.generateSceneImage(genImage, prompt, "9:16");
      if (img) setGeneratedImages(prev => ({ ...prev, 'macro': img }));
    } catch (e: any) {
      if (e.message === "API_KEY_NOT_FOUND") handleSelectKey();
      console.error(e);
    } finally {
      setMacroLoading(false);
    }
  };

  const handleGenerateCustomVariations = async () => {
    if (!customCharImg || !customPrompt) return;
    setCustomLoading(true);
    const refs = customBgImg ? [customCharImg, customBgImg] : [customCharImg];
    try {
      const tasks = [1,2,3,4].map(() => Gemini.generateSceneImage(refs, customPrompt, customRatio));
      const results = await Promise.all(tasks);
      setCustomResults(results.filter((img): img is string => img !== null));
    } catch (e: any) {
      if (e.message === "API_KEY_NOT_FOUND") handleSelectKey();
    } finally {
      setCustomLoading(false);
    }
  };

  const handleGenerateCustomManifest = async () => {
    if (!selectedCustomImage) return;
    setManifestLoading(true);
    try {
      const res = await Gemini.generateSceneManifest(selectedCustomImage, customPrompt, { name: "Custom Product", type: "Custom", gender: "Universal" });
      if (res) setCustomManifest(res);
    } catch (e) {
      console.error(e);
    } finally {
      setManifestLoading(false);
    }
  };

  const handleBatchEdit = async () => {
    if (!editSceneImg || !editProdImg) return;
    setEditLoading(true);
    const prompt = `Composite: Character Ref 1 holding product Ref 2. Location: ${editConfig.background}. Lighting: ${editConfig.lighting}. ${editConfig.prompt}`;
    try {
      const promises = [1, 2, 3, 4].map(() => Gemini.generateSceneImage([editSceneImg, editProdImg], prompt, editConfig.ratio));
      const results = await Promise.all(promises);
      setEditResults(results.filter((img): img is string => img !== null));
    } catch (e: any) {
      if (e.message === "API_KEY_NOT_FOUND") handleSelectKey();
    } finally {
      setEditLoading(false);
    }
  };

  const handleGenerateAngles = async () => {
    if (!angleInputs.product) return;
    setAngleLoading(true);
    try {
      const res = await Gemini.generateViralAngles(angleInputs);
      setAngleResults(res);
    } catch (e) { console.error(e); } finally { setAngleLoading(false); }
  };

  const handleAngleImage = async (idx: number, prompt: string) => {
    if (!genImage) return;
    setAngleGenLoading(prev => ({ ...prev, [idx]: true }));
    try {
      const img = await Gemini.generateSceneImage(genImage, prompt, "9:16");
      if (img) setAngleImages(prev => ({ ...prev, [idx]: img }));
    } catch (e: any) {
      if (e.message === "API_KEY_NOT_FOUND") handleSelectKey();
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
        const audioBlob = b64ToBlob(b64, 'audio/wav');
        setTtsAudioUrl(URL.createObjectURL(audioBlob));
      }
    } catch (e) { console.error(e); } finally { setIsTtsGenerating(false); }
  };

  const b64ToBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, {type: contentType});
  };

  const download = (b64: string, name: string) => {
    const link = document.createElement('a');
    link.href = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
    link.download = `${name}.png`;
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-['Quicksand'] text-left rounded-none selection:bg-[#10b981] selection:text-white antialiased">
      {/* Sidebar */}
      <aside className={`fixed lg:relative h-full bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transition-all duration-500 flex flex-col z-50 rounded-r-3xl shadow-2xl ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:w-24 lg:translate-x-0 overflow-hidden'}`}>
        <div className="p-6 flex items-center gap-4 h-24 shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shrink-0 shadow-lg rounded-2xl">
            <Zap size={24} className="text-white fill-white" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white leading-none">Raw Engine</span>
              <span className="text-xs font-medium tracking-widest text-[#10b981] mt-1 uppercase">Emerald Studio</span>
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-4 mt-4 overflow-y-auto scrollbar-hide">
          {[
            { id: 'editor', icon: Sparkles, label: 'Photo Edit', sub: 'RAW Refiner' },
            { id: 'generator', icon: Video, label: 'Video Gen', sub: 'Identity Lock' },
            { id: 'custom_scene', icon: Clapperboard, label: 'Custom Scene', sub: 'AI Director' },
            { id: 'angles', icon: Lightbulb, label: 'Viral Angles', sub: 'Affiliate Strategy' },
            { id: 'tts', icon: Volume2, label: 'Studio Voice', sub: 'Vocalize AI' }
          ].map(item => (
            <button key={item.id} onClick={() => { setViewMode(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 transition-all rounded-2xl ${viewMode === item.id ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-slate-400 hover:text-[#10b981] hover:bg-slate-800/50'}`}>
              <item.icon size={24} />
              {isSidebarOpen && (
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="text-sm font-bold">{item.label}</span>
                  <span className="text-[10px] opacity-60 uppercase">{item.sub}</span>
                </div>
              )}
            </button>
          ))}
        </nav>
        <div className="p-6 bg-slate-900/50 mt-auto">
          {!hasApiKey && (
            <button onClick={handleSelectKey} className="w-full mb-4 p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl flex items-center justify-center gap-3 hover:bg-amber-500/20 transition-all">
              <ShieldCheck size={20} />
              {isSidebarOpen && <span className="text-[10px] font-bold uppercase">Unlock HD</span>}
            </button>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-3 transition-all text-slate-400 hover:text-[#10b981] rounded-xl hover:bg-slate-800">
            {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-hide relative">
        <header className="h-24 px-8 md:px-12 flex items-center justify-between sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center gap-6 text-white">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-800 text-[#10b981] rounded-xl"><Menu size={24} /></button>
            <div className="space-y-1 text-left">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3"><Terminal size={24} className="text-[#10b981]" />{viewMode.replace('_', ' ').toUpperCase()}</h2>
              <p className="text-slate-500 text-xs font-medium tracking-wide uppercase">Operasional Sistem // Modul: {viewMode}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 px-5 py-2 bg-[#10b981]/10 border border-[#10b981]/20 rounded-full">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-[#10b981] rounded-full opacity-50"></div>
            </div>
            <span className="text-xs font-bold text-[#10b981] tracking-widest uppercase">Sistem Aktif</span>
          </div>
        </header>

        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
          {/* PHOTO EDITOR */}
          {viewMode === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4">
              <div className="lg:col-span-4 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => document.getElementById('edit-scene')?.click()} className="h-48 border-2 border-dashed border-slate-800 bg-slate-900/60 flex items-center justify-center cursor-pointer relative overflow-hidden transition-all duration-500 hover:border-[#10b981]/50 group rounded-2xl">
                    {editSceneImg ? <img src={editSceneImg} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-center text-slate-500 group-hover:text-[#10b981]"><ImageIcon size={24}/><p className="text-[10px] font-bold uppercase mt-2">Karakter</p></div>}
                    <input id="edit-scene" type="file" className="hidden" onChange={e => handleFileUpload(e, setEditSceneImg)} />
                  </div>
                  <div onClick={() => document.getElementById('edit-prod')?.click()} className="h-48 border-2 border-dashed border-slate-800 bg-slate-900/60 flex items-center justify-center cursor-pointer relative overflow-hidden transition-all duration-500 hover:border-[#10b981]/50 group rounded-2xl">
                    {editProdImg ? <img src={editProdImg} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-center text-slate-500 group-hover:text-[#10b981]"><ShoppingBag size={24}/><p className="text-[10px] font-bold uppercase mt-2">Produk</p></div>}
                    <input id="edit-prod" type="file" className="hidden" onChange={e => handleFileUpload(e, setEditProdImg)} />
                  </div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-8 border border-slate-800 shadow-xl rounded-3xl space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><Sparkles size={16} className="text-[#10b981]" /> REFINER PRODUKSI</h3>
                  <div className="space-y-4">
                    <select className="w-full bg-slate-950 border border-slate-800 p-4 text-xs font-bold text-white rounded-xl outline-none" value={editConfig.background} onChange={e => setEditConfig({...editConfig, background: e.target.value})}>
                      {Constants.LOCATION_OPTIONS.map(loc => <option key={loc.id} value={loc.value}>{loc.label}</option>)}
                    </select>
                    <select className="w-full bg-slate-950 border border-slate-800 p-4 text-xs font-bold text-white rounded-xl outline-none" value={editConfig.lighting} onChange={e => setEditConfig({...editConfig, lighting: e.target.value})}>
                      {Constants.LIGHTING_OPTIONS.map(light => <option key={light.id} value={light.value}>{light.label}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      {Constants.RATIO_OPTIONS.map(r => (
                        <button key={r.id} onClick={() => setEditConfig({...editConfig, ratio: r.value})} className={`p-2 text-[10px] font-bold rounded-lg border transition-all ${editConfig.ratio === r.value ? 'bg-[#10b981] border-[#10b981] text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{r.label}</button>
                      ))}
                    </div>
                    <textarea placeholder="Instruksi tambahan..." className="w-full bg-slate-950 border border-slate-800 p-4 text-xs font-medium h-24 outline-none focus:border-[#10b981] text-white rounded-xl resize-none" value={editConfig.prompt} onChange={e => setEditConfig({...editConfig, prompt: e.target.value})} />
                    <button disabled={editLoading || !editSceneImg || !editProdImg} onClick={handleBatchEdit} className="w-full py-5 bg-[#10b981] text-white font-bold text-sm tracking-widest shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 rounded-2xl">MULAI PRODUKSI 4X</button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-8 grid grid-cols-2 gap-6 relative">
                {editLoading && (
                  <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center animate-in fade-in">
                    <div className="w-12 h-12 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest">Processing High Fidelity Assets...</p>
                  </div>
                )}
                {editResults.length > 0 ? editResults.map((img, idx) => (
                  <div key={idx} className="aspect-[9/16] bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative group shadow-xl animate-in zoom-in-95">
                    <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-[#10b981] text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">Refined V{idx+1}</div>
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-8 gap-4 backdrop-blur-sm">
                       <button onClick={() => setPreviewImage(img)} className="w-full py-3 bg-white text-black text-[10px] font-bold rounded-xl uppercase tracking-widest">Preview HD</button>
                       <button onClick={() => download(img, `refined_batch_${idx}`)} className="w-full py-3 bg-[#10b981] text-white text-[10px] font-bold rounded-xl uppercase tracking-widest">Download 2K</button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 h-full min-h-[500px] border border-slate-800 border-dashed rounded-3xl flex flex-col items-center justify-center opacity-20">
                    <Activity size={64} className="mb-4 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-widest">Batch Produksi Kosong</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIDEO GENERATOR */}
          {viewMode === 'generator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-left-4 pb-20">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900/60 backdrop-blur-md p-8 border border-slate-800 shadow-xl relative rounded-3xl">
                  <h3 className="text-xs font-bold mb-6 text-slate-400 uppercase tracking-widest flex items-center gap-3"><User size={16} className="text-[#10b981]" /> SUMBER IDENTITAS</h3>
                  <div onClick={() => document.getElementById('gen-ref')?.click()} className="aspect-[4/5] border-2 border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 rounded-2xl cursor-pointer hover:border-[#10b981]/50 relative group">
                    {genImage ? <img src={genImage} className="absolute inset-0 w-full h-full object-cover" /> : <><Upload size={32} className="text-slate-600 mb-2"/><span className="text-xs font-bold text-slate-500">Upload Foto Referensi</span></>}
                    <input id="gen-ref" type="file" className="hidden" onChange={e => handleFileUpload(e, setGenImage)} />
                  </div>
                  <p className="mt-4 text-[10px] text-[#10b981] font-bold uppercase tracking-widest text-center">Identity & Background Lock Enabled</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-8 border border-slate-800 shadow-xl space-y-6 rounded-3xl">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><Layers size={16} className="text-[#10b981]" /> LOGIKA PRODUKSI</h3>
                  <input placeholder="Nama Produk..." className="w-full bg-slate-950 border border-slate-800 p-4 text-sm font-medium focus:border-[#10b981] outline-none text-white rounded-xl" value={productData.name} onChange={e => setProductData({...productData, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <select className="w-full bg-slate-950 border border-slate-800 p-4 text-xs font-bold text-white rounded-xl outline-none" value={productData.type} onChange={e => setProductData({...productData, type: e.target.value})}>
                      {Constants.PRODUCT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <select className="w-full bg-slate-950 border border-slate-800 p-4 text-xs font-bold text-white rounded-xl outline-none" value={productData.gender} onChange={e => setProductData({...productData, gender: e.target.value})}>
                      <option value="perempuan">Perempuan</option>
                      <option value="laki-laki">Laki-laki</option>
                    </select>
                  </div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-8 border border-slate-800 shadow-xl space-y-4 rounded-3xl">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 text-cyan-500"><SearchCode size={16} /> SPECIAL ACTIONS</h3>
                  <button onClick={handleProduceMacro} disabled={macroLoading || !genImage} className="w-full py-4 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-3 hover:bg-cyan-500/30 transition-all uppercase text-xs">
                    {macroLoading ? <RefreshCw className="animate-spin" /> : <><Focus size={18} /> Zoom Macro (Detail)</>}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 overflow-hidden flex flex-col min-h-[650px] shadow-2xl rounded-3xl">
                <div className="flex bg-slate-950/50 p-2 gap-2 border-b border-slate-800 overflow-x-auto scrollbar-hide">
                  {Constants.SCENE_ROLES.map(s => (
                    <button key={s.id} onClick={() => setActiveScene(s.id)} className={`flex-1 min-w-[120px] py-4 text-xs font-bold transition-all rounded-xl uppercase tracking-wider ${activeScene === s.id ? 'bg-[#10b981] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{s.name}</button>
                  ))}
                </div>
                <div className="p-8 space-y-8 flex-1 flex flex-col">
                  <button onClick={handleProduceScene} disabled={genLoading || !genImage || !productData.name} className="w-full py-5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold text-sm tracking-widest shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 rounded-2xl uppercase">
                    {genLoading ? <RefreshCw className="animate-spin mx-auto" /> : `Render 2K HD Scene 0${activeScene}`}
                  </button>
                  <div className="grid grid-cols-2 gap-8 flex-1">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3"><Monitor size={16} className="text-[#10b981]"/> Visual Output</h4>
                      <div className="aspect-[9/16] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative group max-w-[280px] mx-auto shadow-inner">
                        {generatedImages[activeScene] ? (
                          <>
                            <img src={`data:image/png;base64,${generatedImages[activeScene]}`} className="w-full h-full object-cover" />
                            <div className="absolute top-4 right-4 bg-[#10b981] text-white text-[8px] font-bold px-2 py-1 rounded shadow-lg">HD 2K</div>
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-4 gap-2 backdrop-blur-sm">
                               <button onClick={() => setPreviewImage(generatedImages[activeScene])} className="w-full py-2 bg-white text-black text-[10px] font-bold rounded-lg uppercase tracking-wider">Preview HD</button>
                               <button onClick={() => download(generatedImages[activeScene], `scene_${activeScene}`)} className="w-full py-2 bg-[#10b981] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">Download 2K</button>
                            </div>
                          </>
                        ) : <div className="h-full flex items-center justify-center opacity-10"><Activity size={48} className="animate-pulse" /></div>}
                      </div>
                    </div>
                    <div className="space-y-4 flex flex-col">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3"><Terminal size={16} className="text-[#10b981]"/> Scene Manifest</h4>
                      <div className="bg-slate-950 p-6 border border-slate-800 h-[300px] overflow-auto scrollbar-hide relative rounded-2xl shadow-inner font-mono text-[10px] text-[#10b981]">
                        {generatedScenes[activeScene] ? (
                          <>
                            <button onClick={() => copyToClipboard(JSON.stringify(generatedScenes[activeScene], null, 2))} className="absolute top-4 right-4 bg-[#10b981] text-white px-3 py-1 text-[9px] font-bold uppercase rounded-full shadow-lg">Copy JSON</button>
                            <pre className="whitespace-pre-wrap">{JSON.stringify(generatedScenes[activeScene], null, 2)}</pre>
                          </>
                        ) : <span className="opacity-20 italic">Awaiting manifest generation...</span>}
                      </div>
                      {generatedScenes[activeScene] && (
                        <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Mic size={14} className="text-[#10b981]" /> High-Fidelity VO Script</p>
                          <p className="text-xs font-medium italic text-slate-200">"{generatedScenes[activeScene].voice_over.script}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOM SCENE MODULE */}
          {viewMode === 'custom_scene' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4 pb-20">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900/60 backdrop-blur-md p-8 border border-slate-800 shadow-xl rounded-3xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><ImageIcon size={16} className="text-[#10b981]" /> Visual Utama</h3>
                    <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-1 rounded font-bold uppercase tracking-wider">Step {customStep}/2</span>
                  </div>
                  {customStep === 1 ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => document.getElementById('c-char')?.click()} className="h-40 border-2 border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 rounded-2xl cursor-pointer hover:border-[#10b981]/50 relative overflow-hidden group transition-all">
                          {customCharImg ? <img src={customCharImg} className="absolute inset-0 w-full h-full object-cover" /> : <><User size={24} className="mb-2"/><span className="text-[10px] font-bold uppercase">Foto Karakter*</span></>}
                          <input id="c-char" type="file" className="hidden" onChange={e => handleFileUpload(e, setCustomCharImg)} />
                        </div>
                        <div onClick={() => document.getElementById('c-bg')?.click()} className="h-40 border-2 border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 rounded-2xl cursor-pointer hover:border-[#10b981]/50 relative overflow-hidden group transition-all">
                          {customBgImg ? <img src={customBgImg} className="absolute inset-0 w-full h-full object-cover" /> : <><MapPin size={24} className="mb-2"/><span className="text-[10px] font-bold uppercase">Background (Ops)</span></>}
                          <input id="c-bg" type="file" className="hidden" onChange={e => handleFileUpload(e, setCustomBgImg)} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rasio Frame</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['1:1', '9:16', '16:9', '4:5'].map(r => (
                            <button key={r} onClick={() => setCustomRatio(r)} className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${customRatio === r ? 'bg-[#10b981] border-[#10b981] text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Deskripsikan scene secara detail..." className="w-full h-32 bg-slate-950 border border-slate-800 p-4 text-xs font-medium focus:border-[#10b981] outline-none text-white rounded-xl resize-none shadow-inner" />
                      <button disabled={customLoading || !customCharImg || !customPrompt} onClick={handleGenerateCustomVariations} className="w-full py-4 bg-[#10b981] text-white font-bold text-sm tracking-widest shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 rounded-2xl flex items-center justify-center gap-3 uppercase">
                        {customLoading ? <RefreshCw className="animate-spin" /> : <><ImageIcon size={18} /> Generate 4 Variasi</>}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative h-48 rounded-3xl overflow-hidden border border-slate-800 group">
                        {selectedCustomImage && <img src={`data:image/png;base64,${selectedCustomImage}`} className="w-full h-full object-cover opacity-60" />}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button onClick={() => { setCustomStep(1); setCustomResults([]); setSelectedCustomImage(null); }} className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-bold flex items-center gap-2 hover:bg-red-500 transition-all uppercase"><RotateCcw size={14} /> Reset Selection</button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Voice Over Profile</label>
                        <select className="w-full bg-slate-950 border border-slate-800 p-4 text-xs font-bold text-white rounded-xl outline-none" value={selectedVoice.name} onChange={e => setSelectedVoice(Constants.VOICES.find(v => v.name === e.target.value) || Constants.VOICES[0])}>
                          {Constants.VOICES.map(v => <option key={v.name} value={v.name}>{v.name} ({v.gender})</option>)}
                        </select>
                        <button disabled={manifestLoading} onClick={handleGenerateCustomManifest} className="w-full py-4 bg-[#10b981] text-white font-bold text-sm tracking-widest shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 rounded-2xl flex items-center justify-center gap-3 uppercase">
                          {manifestLoading ? <RefreshCw className="animate-spin" /> : <><Film size={18} /> Produce Manifest</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl min-h-[600px] flex items-center justify-center relative p-8">
                {customLoading && (
                  <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center animate-in fade-in">
                    <div className="w-12 h-12 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest">Rendering Cinematic Assets...</p>
                  </div>
                )}
                {customStep === 1 ? (
                  customResults.length > 0 ? (
                    <div className="space-y-8 w-full">
                      <div className="grid grid-cols-2 gap-6 w-full h-full overflow-y-auto scrollbar-hide">
                        {customResults.map((img, idx) => (
                          <div key={idx} onClick={() => setSelectedCustomImage(img)} className={`rounded-3xl border-2 overflow-hidden relative group cursor-pointer transition-all ${selectedCustomImage === img ? 'border-[#10b981] scale-[1.02] shadow-2xl' : 'border-slate-800 hover:border-slate-600'}`} style={{ aspectRatio: customRatio.replace(':', '/') }}>
                            <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" />
                            {selectedCustomImage === img && <div className="absolute top-4 right-4 bg-[#10b981] text-white p-1 rounded-full"><CheckCircle2 size={24} fill="white" className="text-[#10b981]" /></div>}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-8 gap-4 backdrop-blur-sm">
                               <button onClick={(e) => { e.stopPropagation(); setPreviewImage(img); }} className="w-full py-2 bg-white text-black text-[10px] font-bold rounded-lg uppercase tracking-widest">Preview</button>
                               <button onClick={(e) => { e.stopPropagation(); download(img, `custom_var_${idx}`); }} className="w-full py-2 bg-[#10b981] text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">Download</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={`transition-all duration-500 ${selectedCustomImage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <button onClick={() => setCustomStep(2)} className="w-full py-5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold text-sm tracking-widest shadow-lg rounded-2xl uppercase flex items-center justify-center gap-3">Lanjut Ke Manifest <ArrowRight size={18} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-20 gap-4">
                      <ImageIcon size={64} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Aset Visual Muncul Di Sini</p>
                    </div>
                  )
                ) : (
                  <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-slate-900 border-2 border-[#10b981] rounded-3xl overflow-hidden relative shadow-2xl max-w-sm mx-auto" style={{ aspectRatio: customRatio.replace(':', '/') }}>
                      {selectedCustomImage && <img src={`data:image/png;base64,${selectedCustomImage}`} className="w-full h-full object-cover" />}
                      <div className="absolute top-4 right-4 bg-[#10b981] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">Master Asset</div>
                    </div>
                    {customManifest && (
                      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-[#10b981] uppercase tracking-[0.2em] flex items-center gap-3"><Terminal size={18}/> Production Data</h4>
                          <button onClick={() => copyToClipboard(JSON.stringify(customManifest, null, 2))} className="px-4 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-full hover:bg-[#10b981] transition-all uppercase tracking-widest">Salin JSON</button>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto scrollbar-hide bg-slate-900/50 p-6 rounded-2xl border border-slate-800 font-mono text-[11px] text-[#10b981] leading-relaxed">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(customManifest, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANGLES MODULE */}
          {viewMode === 'angles' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900/60 backdrop-blur-md p-8 border border-slate-800 shadow-xl rounded-3xl space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><Target size={16} className="text-[#10b981]" /> STRATEGI KONVERSI</h3>
                  <div className="space-y-4">
                    <input value={angleInputs.product} onChange={(e) => setAngleInputs({...angleInputs, product: e.target.value})} placeholder="Nama Produk..." className="w-full bg-slate-950 border border-slate-800 p-4 text-sm font-medium focus:border-[#10b981] outline-none text-white rounded-xl" />
                    <input value={angleInputs.target} onChange={(e) => setAngleInputs({...angleInputs, target: e.target.value})} placeholder="Target Market..." className="w-full bg-slate-950 border border-slate-800 p-4 text-sm font-medium focus:border-[#10b981] outline-none text-white rounded-xl" />
                    <textarea value={angleInputs.benefit} onChange={(e) => setAngleInputs({...angleInputs, benefit: e.target.value})} placeholder="Benefit Utama..." className="w-full h-24 bg-slate-950 border border-slate-800 p-4 text-xs font-medium focus:border-[#10b981] outline-none text-white rounded-xl resize-none" />
                    <button disabled={angleLoading || !angleInputs.product} onClick={handleGenerateAngles} className="w-full py-4 bg-[#10b981] text-white font-bold text-sm tracking-widest shadow-lg hover:scale-[1.01] transition-all rounded-2xl flex items-center justify-center gap-3 uppercase">
                      {angleLoading ? <RefreshCw className="animate-spin" /> : <><Lightbulb size={18} /> Generate Viral Angles</>}
                    </button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-8 space-y-8">
                {angleResults.map((angle, idx) => (
                  <div key={idx} className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-[#10b981] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Angle #{idx + 1}</span>
                          <h3 className="font-bold text-white text-xl">{angle.angle_name}</h3>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Activity size={14} className="text-[#10b981]"/> {angle.emotion}</p>
                      </div>
                      <div className="bg-[#10b981]/10 px-4 py-2 rounded-xl border border-[#10b981]/20">
                        <Quote size={16} className="text-[#10b981] mb-1" />
                        <p className="text-xs font-bold text-[#10b981] italic">"{angle.hook_text}"</p>
                      </div>
                    </div>
                    <div className="p-8 grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="aspect-[9/16] bg-slate-950 border-2 border-slate-800 rounded-2xl relative overflow-hidden group">
                          {angleImages[idx] ? (
                            <>
                              <img src={`data:image/png;base64,${angleImages[idx]}`} className="w-full h-full object-cover" />
                              <div className="absolute top-4 right-4 bg-[#10b981] text-white text-[9px] font-bold px-2 py-1 rounded uppercase">HD 2K</div>
                            </>
                          ) : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 opacity-20"><ImageIcon size={48} /></div>}
                        </div>
                        <button onClick={() => handleAngleImage(idx, angle.image_prompt)} disabled={angleGenLoading[idx]} className="w-full py-3 bg-slate-800 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest hover:bg-[#10b981] transition-all">
                          {angleGenLoading[idx] ? <RefreshCw className="animate-spin" /> : "Produce Angle Visual"}
                        </button>
                      </div>
                      <div className="space-y-6">
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Volume2 size={14} className="text-[#10b981]" /> Voice Over Script</h4>
                          <p className="text-sm font-medium italic text-slate-200 leading-relaxed">"{angle.video_json.voice_over.script}"</p>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-h-[220px] overflow-y-auto scrollbar-hide">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><ListVideo size={14} className="text-[#10b981]" /> Manifest JSON</h4>
                          <pre className="text-[10px] font-mono text-[#10b981] leading-relaxed whitespace-pre-wrap">{JSON.stringify(angle.video_json, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TTS MODULE */}
          {viewMode === 'tts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-6">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-slate-900/60 backdrop-blur-md p-8 border border-slate-800 shadow-xl rounded-3xl space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3"><Mic size={16} className="text-[#10b981]" /> INPUT TEKS</h3>
                  <textarea value={ttsText} onChange={(e) => setTtsText(e.target.value)} placeholder="Tulis naskah narasi..." className="w-full h-64 bg-slate-950 border border-slate-800 p-5 text-sm font-medium outline-none text-white rounded-2xl resize-none shadow-inner" />
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Aksen & Karakter</label>
                    <select className="w-full bg-slate-950 border border-slate-800 p-4 text-xs font-bold text-white rounded-xl outline-none" value={selectedVoice.name} onChange={(e) => setSelectedVoice(Constants.VOICES.find(v => v.name === e.target.value) || Constants.VOICES[0])}>
                      {Constants.VOICES.map(v => <option key={v.name} value={v.name}>{v.name} ({v.gender})</option>)}
                    </select>
                    <button disabled={isTtsGenerating || !ttsText} onClick={handleVoiceGen} className="w-full py-5 bg-[#10b981] text-white font-bold text-sm tracking-widest shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 rounded-2xl uppercase">
                      {isTtsGenerating ? <RefreshCw className="animate-spin" /> : "Synthesize Vocals"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-8">
                {ttsAudioUrl ? (
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-12 flex flex-col items-center justify-center space-y-12 shadow-2xl rounded-3xl h-full min-h-[500px] animate-in zoom-in-95">
                    <div className="w-32 h-32 bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center rounded-full shadow-inner">
                      <Headphones size={48} className="text-[#10b981] animate-pulse" />
                    </div>
                    <div className="w-full max-w-xl bg-slate-950 p-8 border border-slate-800 space-y-8 rounded-3xl shadow-2xl">
                       <div className="flex items-center gap-2 h-16 justify-center">
                         {[...Array(24)].map((_, i) => (
                           <div key={i} className={`w-1.5 bg-[#10b981] rounded-full transition-all duration-300 ${isTtsPlaying ? 'opacity-100' : 'opacity-20'}`} style={{ height: isTtsPlaying ? `${Math.random() * 40 + 10}px` : '4px' }} />
                         ))}
                       </div>
                       <div className="flex gap-4">
                         <button onClick={() => { if (audioRef.current) { if (isTtsPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsTtsPlaying(!isTtsPlaying); } }} className="flex-1 py-4 bg-white text-black font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-[#10b981] hover:text-white transition-all rounded-full shadow-lg">
                           {isTtsPlaying ? <Pause size={18}/> : <Play size={18} fill="currentColor" />} {isTtsPlaying ? "Pause" : "Play"}
                         </button>
                         <button onClick={() => download(ttsAudioUrl, "vocalize_studio")} className="flex-1 py-4 bg-slate-800 border border-slate-700 text-white font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all rounded-full shadow-lg">
                           <Download size={18}/> Export WAV
                         </button>
                       </div>
                       <audio ref={audioRef} src={ttsAudioUrl} className="hidden" onEnded={() => setIsTtsPlaying(false)} />
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">24kHz High Fidelity Render</p>
                  </div>
                ) : (
                  <div className="h-full min-h-[500px] border border-slate-800 border-dashed flex flex-col items-center justify-center text-slate-800 space-y-6 bg-slate-950/20 shadow-inner rounded-3xl opacity-20">
                    <Activity size={64} className="animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-widest">Siap Memproses Vokal</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FULL PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setPreviewImage(null)}></div>
          <div className="relative max-w-sm w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-[#10b981] transition-all shadow-lg"><X size={20} /></button>
            <div className="p-8 flex flex-col items-center">
               <div className="relative mb-8">
                 <img src={previewImage.startsWith('data:') ? previewImage : `data:image/png;base64,${previewImage}`} className="max-h-[75vh] rounded-3xl shadow-2xl object-cover border border-slate-800" alt="Full Preview" />
                 <div className="absolute bottom-4 left-4 bg-[#10b981] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">Optimal 2K HD</div>
               </div>
               <button onClick={() => download(previewImage || '', 'export_emerald_hd')} className="w-full py-5 bg-[#10b981] text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-[#059669] transition-all uppercase tracking-widest">
                 <Download size={20} /> Download Asset
               </button>
               <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em] font-bold">Raw Engine // Emerald_Studio_2K</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
