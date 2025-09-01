// src/data/presets.ts
import { PrintSize } from "@/utils/units";

export type ProductPreset = {
  id: string;
  label: string;
  size: PrintSize; // content size (without bleed), bleed is in size.bleedMm
};

export const PRESETS: ProductPreset[] = [
  { id: "bc-90x54", label: "Business Card 90×54 mm (TH)", size: { widthMm: 90, heightMm: 54, bleedMm: 3, safeMm: 3 } },
  { id: "bc-85x55", label: "Business Card 85×55 mm (EU)", size: { widthMm: 85, heightMm: 55, bleedMm: 3, safeMm: 3 } },
  { id: "flyer-a5", label: "Flyer A5", size: { widthMm: 148, heightMm: 210, bleedMm: 3, safeMm: 3 } },
  { id: "flyer-a4", label: "Flyer A4", size: { widthMm: 210, heightMm: 297, bleedMm: 3, safeMm: 3 } },
  { id: "poster-a3", label: "Poster A3", size: { widthMm: 297, heightMm: 420, bleedMm: 3, safeMm: 5 } },
  { id: "poster-a2", label: "Poster A2", size: { widthMm: 420, heightMm: 594, bleedMm: 3, safeMm: 5 } },
  { id: "banner-600x1800", label: "Banner 600×1800 mm", size: { widthMm: 600, heightMm: 1800, bleedMm: 5, safeMm: 10 } },
  { id: "banner-800x2000", label: "Banner 800×2000 mm", size: { widthMm: 800, heightMm: 2000, bleedMm: 5, safeMm: 10 } },
];
