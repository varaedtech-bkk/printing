// src/utils/units.ts
export const PRINT_DPI = 300; // print export
export const PREVIEW_DPI = 72; // on-screen preview if needed
const MM_PER_INCH = 25.4;

export const mmToPx = (mm: number, dpi = PRINT_DPI) => (mm / MM_PER_INCH) * dpi;
export const pxToMm = (px: number, dpi = PRINT_DPI) => (px / dpi) * MM_PER_INCH;

export type PrintSize = { widthMm: number; heightMm: number; bleedMm?: number; safeMm?: number };

export const withDefaults = (s: PrintSize) => ({
  bleedMm: 3,
  safeMm: 3,
  ...s,
});

export const designBoxPx = (s: PrintSize, dpi = PRINT_DPI) => {
  const { widthMm, heightMm, bleedMm = 3 } = withDefaults(s);
  const totalWidthMm = widthMm + bleedMm * 2;
  const totalHeightMm = heightMm + bleedMm * 2;
  return {
    widthPx: Math.round(mmToPx(totalWidthMm, dpi)),
    heightPx: Math.round(mmToPx(totalHeightMm, dpi)),
    contentOffsetPx: Math.round(mmToPx(bleedMm, dpi)),
  };
};
