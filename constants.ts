
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
  { id: "food", name: "Makanan / Minuman" },
  { id: "household", name: "Alat Rumah Tangga" },
  { id: "fitness", name: "Fitness / Olahraga" }
];

export const LIGHTING_OPTIONS = [
  { id: "L1", label: "1. Siang Terik (Maksimal)", value: "extremely bright midday direct sunlight, high exposure, sharp shadows" },
  { id: "L2", label: "2. Pagi Cerah (Bersih)", value: "soft clean morning sunlight, neutral white balance, bright whites" },
  { id: "L3", label: "3. Sore Golden Hour (Terang)", value: "warm late afternoon golden hour light, high key, orange highlights" },
  { id: "L4", label: "4. Cahaya Jendela (Lembut)", value: "natural soft window side-lighting, organic diffused shadows" },
  { id: "L5", label: "5. Lampu Ruangan (Putih)", value: "indoor bright fluorescent lighting, realistic white balance" },
  { id: "L6", label: "6. Mendung Cerah (Halus)", value: "bright overcast diffuse lighting, flat but high visibility" },
  { id: "L7", label: "7. Bawah Pohon (Semburat)", value: "dappled tropical sunlight filtered through leaves" },
  { id: "L8", label: "8. Cahaya Malam (Kontras)", value: "warm street lamp lighting at night, high contrast" },
  { id: "L9", label: "9. Neon Cyberpunk", value: "vibrant blue and cyan neon lighting, cinematic studio atmosphere" },
  { id: "L10", label: "10. Emerald Studio Pro", value: "professional high-end studio lighting with emerald and white tones" }
];

export const LOCATION_OPTIONS = [
  { id: "LOC0", label: "✨ CUSTOM (Dari Instruksi)", value: "CUSTOM_FROM_PROMPT" },
  { id: "LOC1", label: "WARUNG KELONTONG", value: "Indonesian grocery store (warung kelontong) with hanging snacks background" },
  { id: "LOC2", label: "PASAR TRADISIONAL", value: "busy Indonesian traditional market stalls, bright morning atmosphere" },
  { id: "LOC3", label: "TERAS MINIMALIS", value: "modern minimalist house terrace, tiled floor, clean suburban background" },
  { id: "LOC4", label: "GANG PERUMAHAN", value: "Indonesian residential alley (gang), concrete walls, authentic local vibe" },
  { id: "LOC5", label: "HALAMAN BELAKANG", value: "tropical backyard garden, banana trees, natural dirt ground" },
  { id: "LOC6", label: "DAPUR SEDERHANA", value: "clean Indonesian kitchen area, gas stove, simple domestic setup" },
  { id: "LOC7", label: "PINGGIR JALAN", value: "Indonesian asphalt street side, motorcycles parked, natural daylight" },
  { id: "LOC8", label: "KEDAI KOPI", value: "simple local coffee shop (warkop), wooden tables, casual atmosphere" },
  { id: "LOC9", label: "RUANG TAMU", value: "modern Indonesian living room, bright curtains, ceramic tile floor" },
  { id: "LOC10", label: "KAMAR TIDUR", value: "simple bedroom with colorful sheets and wooden wardrobe" }
];

export const RATIO_OPTIONS = [
  { id: "R1", label: "1:1 PERSEGI", value: "1:1" },
  { id: "R2", label: "4:5 PORTRAIT", value: "4:5" },
  { id: "R3", label: "9:16 STORY", value: "9:16" },
  { id: "R4", label: "16:9 WIDE", value: "16:9" }
];

export const VOICES: VoiceOption[] = [
  { name: "Budi", model: "Puck", gender: "Laki-laki" },
  { name: "Siti", model: "Kore", gender: "Perempuan" },
  { name: "Agus", model: "Charon", gender: "Laki-laki" },
  { name: "Lestari", model: "Aoede", gender: "Perempuan" },
  { name: "Dewi", model: "Leda", gender: "Perempuan" },
  { name: "Rian", model: "Orus", gender: "Laki-laki" }
];

export const ACCENTS: AccentOption[] = [
  { label: "Indonesia Netral", value: "neutral", details: "standard Indonesian accent" },
  { label: "Jawa", value: "jawa", details: "Javanese accent" },
  { label: "Sunda", value: "sunda", details: "Sundanese accent" },
  { label: "Bali", value: "bali", details: "Balinese accent" }
];
