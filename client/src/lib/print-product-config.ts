// Print Product Configuration
// Based on industry standards from GoGoPrint, RedPrinting, and other professional printers

export interface PrintProduct {
  id: string;
  name: string;
  nameEn: string;
  category: 'business-cards' | 'flyers' | 'posters' | 'banners' | 'stickers';
  dimensions: {
    width: number;  // mm
    height: number; // mm
    bleed: number;  // mm
    safeZone: number; // mm
    dpi: number;    // dots per inch for export
  };
  previewScale: number; // Scale factor for canvas preview (72 DPI)
  description: string;
  useCases: string[];
  priceRange: string;
}

export const PRINT_PRODUCTS: PrintProduct[] = [
  // Business Cards
  {
    id: 'business-card-standard',
    name: 'นามบัตรมาตรฐาน',
    nameEn: 'Standard Business Card',
    category: 'business-cards',
    dimensions: {
      width: 90,
      height: 54,
      bleed: 3,
      safeZone: 5,
      dpi: 300
    },
    previewScale: 0.236, // 90mm / 381 DPI ≈ 0.236
    description: 'Standard business card size used worldwide',
    useCases: ['Corporate branding', 'Personal networking', 'Professional identity'],
    priceRange: '฿50-200'
  },
  {
    id: 'business-card-square',
    name: 'นามบัตรสี่เหลี่ยม',
    nameEn: 'Square Business Card',
    category: 'business-cards',
    dimensions: {
      width: 85,
      height: 85,
      bleed: 3,
      safeZone: 5,
      dpi: 300
    },
    previewScale: 0.223, // 85mm / 381 DPI ≈ 0.223
    description: 'Modern square format for creative professionals',
    useCases: ['Creative industries', 'Modern branding', 'Stand out designs'],
    priceRange: '฿80-300'
  },

  // Postcards
  {
    id: 'postcard-standard',
    name: 'ไปรษณียบัตรมาตรฐาน',
    nameEn: 'Standard Postcard',
    category: 'business-cards', // Using business-cards category since postcards are similar
    dimensions: {
      width: 148,
      height: 105,
      bleed: 3,
      safeZone: 6,
      dpi: 300
    },
    previewScale: 0.388, // 148mm / 381 DPI ≈ 0.388
    description: 'Standard postcard size',
    useCases: ['Marketing campaigns', 'Event invitations', 'Greetings'],
    priceRange: '฿100-300'
  },

  // Flyers
  {
    id: 'flyer-a4',
    name: 'ใบปลิว A4',
    nameEn: 'A4 Flyer',
    category: 'flyers',
    dimensions: {
      width: 210,
      height: 297,
      bleed: 3,
      safeZone: 8,
      dpi: 300
    },
    previewScale: 0.551, // 210mm / 381 DPI ≈ 0.551
    description: 'Standard A4 size for detailed information',
    useCases: ['Event promotion', 'Product catalogs', 'Detailed information'],
    priceRange: '฿200-800'
  },
  {
    id: 'flyer-a5',
    name: 'ใบปลิว A5',
    nameEn: 'A5 Flyer',
    category: 'flyers',
    dimensions: {
      width: 148,
      height: 210,
      bleed: 3,
      safeZone: 6,
      dpi: 300
    },
    previewScale: 0.388, // 148mm / 381 DPI ≈ 0.388
    description: 'Compact A5 size for cost-effective distribution',
    useCases: ['Cost-effective marketing', 'Quick information', 'Hand distribution'],
    priceRange: '฿150-500'
  },
  {
    id: 'flyer-dl',
    name: 'ใบปลิว DL',
    nameEn: 'DL Flyer',
    category: 'flyers',
    dimensions: {
      width: 99,
      height: 210,
      bleed: 3,
      safeZone: 5,
      dpi: 300
    },
    previewScale: 0.260, // 99mm / 381 DPI ≈ 0.260
    description: 'DL (DIN Lang) format for letters and flyers',
    useCases: ['Letter inserts', 'Compact information', 'Cost-effective printing'],
    priceRange: '฿100-400'
  },

  // Posters
  {
    id: 'poster-a3',
    name: 'โปสเตอร์ A3',
    nameEn: 'A3 Poster',
    category: 'posters',
    dimensions: {
      width: 297,
      height: 420,
      bleed: 5,
      safeZone: 10,
      dpi: 300
    },
    previewScale: 0.779, // 297mm / 381 DPI ≈ 0.779
    description: 'A3 size for medium-sized displays',
    useCases: ['Office displays', 'Event posters', 'Medium format advertising'],
    priceRange: '฿500-1500'
  },
  {
    id: 'poster-a2',
    name: 'โปสเตอร์ A2',
    nameEn: 'A2 Poster',
    category: 'posters',
    dimensions: {
      width: 420,
      height: 594,
      bleed: 5,
      safeZone: 12,
      dpi: 300
    },
    previewScale: 1.102, // 420mm / 381 DPI ≈ 1.102
    description: 'Large A2 format for prominent displays',
    useCases: ['Large displays', 'Exhibition posters', 'High-impact advertising'],
    priceRange: '฿800-2500'
  },
  {
    id: 'poster-a1',
    name: 'โปสเตอร์ A1',
    nameEn: 'A1 Poster',
    category: 'posters',
    dimensions: {
      width: 594,
      height: 841,
      bleed: 8,
      safeZone: 15,
      dpi: 300
    },
    previewScale: 1.558, // 594mm / 381 DPI ≈ 1.558
    description: 'Extra large A1 format for maximum impact',
    useCases: ['Maximum visibility', 'Large venues', 'High-impact displays'],
    priceRange: '฿1500-4000'
  },

  // Banners
  {
    id: 'banner-small',
    name: 'แบนเนอร์ขนาดเล็ก',
    nameEn: 'Small Banner',
    category: 'banners',
    dimensions: {
      width: 600,
      height: 1800,
      bleed: 10,
      safeZone: 20,
      dpi: 150
    },
    previewScale: 1.575, // 600mm / 381 DPI ≈ 1.575
    description: 'Small banner for indoor displays',
    useCases: ['Indoor displays', 'Trade shows', 'Small venues'],
    priceRange: '฿2000-6000'
  },
  {
    id: 'banner-medium',
    name: 'แบนเนอร์ขนาดกลาง',
    nameEn: 'Medium Banner',
    category: 'banners',
    dimensions: {
      width: 800,
      height: 2000,
      bleed: 12,
      safeZone: 25,
      dpi: 150
    },
    previewScale: 2.100, // 800mm / 381 DPI ≈ 2.100
    description: 'Medium banner for versatile use',
    useCases: ['Versatile displays', 'Medium venues', 'Balanced visibility'],
    priceRange: '฿3000-8000'
  },
  {
    id: 'banner-large',
    name: 'แบนเนอร์ขนาดใหญ่',
    nameEn: 'Large Banner',
    category: 'banners',
    dimensions: {
      width: 1000,
      height: 3000,
      bleed: 15,
      safeZone: 30,
      dpi: 150
    },
    previewScale: 2.625, // 1000mm / 381 DPI ≈ 2.625
    description: 'Large banner for maximum outdoor visibility',
    useCases: ['Outdoor advertising', 'Large venues', 'Maximum visibility'],
    priceRange: '฿5000-12000'
  },

  // Stickers
  {
    id: 'sticker-small',
    name: 'สติกเกอร์ขนาดเล็ก',
    nameEn: 'Small Sticker',
    category: 'stickers',
    dimensions: {
      width: 50,
      height: 50,
      bleed: 2,
      safeZone: 3,
      dpi: 300
    },
    previewScale: 0.131, // 50mm / 381 DPI ≈ 0.131
    description: 'Small stickers for products and packaging',
    useCases: ['Product labels', 'Small packaging', 'Decorative items'],
    priceRange: '฿20-100'
  },
  {
    id: 'sticker-medium',
    name: 'สติกเกอร์ขนาดกลาง',
    nameEn: 'Medium Sticker',
    category: 'stickers',
    dimensions: {
      width: 100,
      height: 100,
      bleed: 3,
      safeZone: 5,
      dpi: 300
    },
    previewScale: 0.262, // 100mm / 381 DPI ≈ 0.262
    description: 'Medium stickers for various applications',
    useCases: ['Vehicle decals', 'Medium packaging', 'Promotional items'],
    priceRange: '฿50-200'
  }
];

// Helper functions
export function getProductById(id: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find(product => product.id === id);
}

export function getProductsByCategory(category: PrintProduct['category']): PrintProduct[] {
  return PRINT_PRODUCTS.filter(product => product.category === category);
}

export function getCategoryName(category: PrintProduct['category']): string {
  const categoryNames = {
    'business-cards': 'Business Cards',
    'flyers': 'Flyers & Leaflets',
    'posters': 'Posters',
    'banners': 'Banners',
    'stickers': 'Stickers & Labels'
  };
  return categoryNames[category];
}

export function getCategoryNameThai(category: PrintProduct['category']): string {
  const categoryNames = {
    'business-cards': 'นามบัตร',
    'flyers': 'ใบปลิวและโบรชัวร์',
    'posters': 'โปสเตอร์',
    'banners': 'แบนเนอร์',
    'stickers': 'สติกเกอร์และฉลาก'
  };
  return categoryNames[category];
}

// Convert mm to pixels at specified DPI
export function mmToPixels(mm: number, dpi: number): number {
  return (mm * dpi) / 25.4;
}

// Convert pixels to mm at specified DPI
export function pixelsToMm(pixels: number, dpi: number): number {
  return (pixels * 25.4) / dpi;
}

// Get canvas dimensions for preview (72 DPI)
export function getPreviewDimensions(product: PrintProduct): { width: number; height: number } {
  const widthPx = mmToPixels(product.dimensions.width, 72);
  const heightPx = mmToPixels(product.dimensions.height, 72);
  return { width: widthPx, height: heightPx };
}

// Get export dimensions (full DPI)
export function getExportDimensions(product: PrintProduct): { width: number; height: number } {
  const widthPx = mmToPixels(product.dimensions.width, product.dimensions.dpi);
  const heightPx = mmToPixels(product.dimensions.height, product.dimensions.dpi);
  return { width: widthPx, height: heightPx };
}
