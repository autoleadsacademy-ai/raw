
import { VoiceOption, AccentOption } from './types';

export const SCENE_ROLES = [
  { id: 1, name: "Scene 1: Hook", role: "hook", description: "Atensi Instan (3 Detik Pertama)" },
  { id: 2, name: "Scene 2: Masalah", role: "problem", description: "Pain Point & Relatability" },
  { id: 3, name: "Scene 3: Solusi", role: "solution", description: "Efikasi Produk & Manfaat" },
  { id: 4, name: "Scene 4: Penutup", role: "closing", description: "Call to Action (CTA)" }
];

export const PRODUCT_CATEGORIES = [
  { id: "skincare", name: "Skincare" },
  { id: "makeup", name: "Makeup / Alat Kecantikan" },
  { id: "fashion", name: "Fashion (Pakaian)" },
  { id: "digital", name: "Produk Digital" },
  { id: "accessories", name: "Aksesoris" },
  { id: "electronics", name: "Elektronik / Gadget" },
  { id: "health", name: "Kesehatan / Suplemen" },
  { id: "food", name: "Makanan / Minuman" }
];

export const LIGHTING_OPTIONS = [
  { id: "L1", label: "Siang Terik", value: "extremely bright midday direct sunlight, high contrast" },
  { id: "L2", label: "Pagi Cerah", value: "soft clean morning sunlight, fresh atmosphere" },
  { id: "L3", label: "Golden Hour (Sore)", value: "warm golden hour light, long shadows, cinematic glow" },
  { id: "L4", label: "Neon Cyberpunk", value: "vibrant blue and cyan neon lighting, futuristic" },
  { id: "L5", label: "Studio Softbox", value: "professional studio softbox lighting, even and flattering" },
  { id: "L6", label: "Malam Redup (Moody)", value: "dimly lit night environment, moody atmosphere, low light" },
  { id: "L7", label: "Mendung Galau", value: "overcast sky, flat soft lighting, melancholy mood" },
  { id: "L8", label: "Cahaya Jendela", value: "natural light coming from a side window, soft shadows" },
  { id: "L9", label: "Rim Light (Outline)", value: "strong backlighting creating a glowing outline around the subject" },
  { id: "L10", label: "Cinematic Warm", value: "warm cinematic tungsten lighting, cozy and high-end feel" }
];

export const LOCATION_OPTIONS = [
  { id: "LOC0", label: "✨ CUSTOM (Ikuti Prompt)", value: "CUSTOM" },
  { id: "LOC1", label: "Warung Kelontong", value: "authentic Indonesian grocery store background" },
  { id: "LOC2", label: "Pasar Tradisional", value: "busy and colorful Indonesian traditional market" },
  { id: "LOC3", label: "Teras Minimalis", value: "modern minimalist home terrace with plants" },
  { id: "LOC4", label: "Dapur Sederhana", value: "clean and cozy Indonesian kitchen environment" },
  { id: "LOC5", label: "Kamar Aesthetic", value: "aesthetic bedroom with fairy lights and pastel colors" },
  { id: "LOC6", label: "Cafe Minimalis", value: "trendy minimalist coffee shop with wooden furniture" },
  { id: "LOC7", label: "Kantor Modern", value: "professional modern office space with glass walls" },
  { id: "LOC8", label: "Rooftop City View", value: "urban rooftop with a stunning city skyline background" },
  { id: "LOC9", label: "Taman Hijau", value: "lush green garden with sunlight filtering through leaves" },
  { id: "LOC10", label: "Studio Foto (Polos)", value: "professional photo studio with a clean solid backdrop" },
  { id: "LOC11", label: "Ruang Tamu Mewah", value: "luxurious living room with elegant decor and sofa" },
  { id: "LOC12", label: "Gym / Pusat Kebugaran", value: "modern fitness center with workout equipment" },
  { id: "LOC13", label: "Area Parkir View", value: "urban parking lot area, industrial aesthetic" },
  { id: "LOC14", label: "Pinggir Jalan Kota", value: "busy city sidewalk with blurred traffic background" },
  { id: "LOC15", label: "Pantai Tropis", value: "tropical beach with white sand and blue ocean" }
];

export const RATIO_OPTIONS = [
  { id: "R1", label: "1:1 Persegi", value: "1:1" },
  { id: "R2", label: "4:5 Portrait", value: "4:5" },
  { id: "R3", label: "9:16 Story", value: "9:16" },
  { id: "R4", label: "16:9 Wide", value: "16:9" }
];

export const VOICES: VoiceOption[] = [
  { name: "Budi", model: "Puck", gender: "Laki-laki" },
  { name: "Siti", model: "Kore", gender: "Perempuan" },
  { name: "Agus", model: "Charon", gender: "Laki-laki" },
  { name: "Lestari", model: "Aoede", gender: "Perempuan" }
];

export const ACCENTS: AccentOption[] = [
  { label: "Indonesia Netral", value: "neutral", details: "standard Indonesian accent" },
  { label: "Jawa", value: "jawa", details: "Javanese accent" },
  { label: "Sunda", value: "sunda", details: "Sundanese accent" }
];
