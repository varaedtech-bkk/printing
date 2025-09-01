import { apiRequest } from "./queryClient";

export interface AIDesignSuggestion {
  layout: string;
  colors: string[];
  fonts: string[];
  elements: {
    type: 'text' | 'image' | 'shape';
    content: string;
    position: { x: number; y: number };
    style: Record<string, any>;
  }[];
  reasoning: string;
}

export interface AIColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string[];
  reasoning: string;
}

export interface AIImageAnalysis {
  suggestions: string[];
  issues: string[];
  printReadiness: {
    resolution: 'low' | 'medium' | 'high';
    colorMode: 'rgb' | 'cmyk' | 'unknown';
    recommendations: string[];
  };
}

export interface AIDesignVariations {
  variations: any[];
  descriptions: string[];
}

export interface BackgroundRemovalResult {
  processedImage: string;
  success?: boolean;
}

export class AIClient {
  // Generate design from text description
  static async generateDesignFromText(
    prompt: string,
    productType: string,
    dimensions: { width: number; height: number }
  ): Promise<AIDesignSuggestion> {
    try {
      const response = await apiRequest("POST", "/api/ai/design-from-text", {
        prompt,
        productType,
        dimensions
      });

      return response.json();
    } catch (error) {
      throw new Error(`Failed to generate design: ${(error as Error).message}`);
    }
  }

  // Generate smart color palette
  static async generateColorPalette(
    brandDescription: string,
    industry: string
  ): Promise<AIColorPalette> {
    try {
      const response = await apiRequest("POST", "/api/ai/color-palette", {
        brandDescription,
        industry
      });

      return response.json();
    } catch (error) {
      throw new Error(`Failed to generate color palette: ${(error as Error).message}`);
    }
  }

  // Analyze image for print quality and suggestions
  static async analyzeImage(imageData: string): Promise<AIImageAnalysis> {
    try {
      const response = await apiRequest("POST", "/api/ai/analyze-image", {
        image: imageData
      });

      return response.json();
    } catch (error) {
      throw new Error(`Failed to analyze image: ${(error as Error).message}`);
    }
  }

  // Remove background from image
  static async removeBackground(imageData: string): Promise<BackgroundRemovalResult> {
    try {
      const response = await apiRequest("POST", "/api/ai/remove-background", {
        image: imageData
      });

      return response.json();
    } catch (error) {
      throw new Error(`Failed to remove background: ${(error as Error).message}`);
    }
  }

  // Generate design variations
  static async generateDesignVariations(
    currentDesign: any,
    variationType: 'color' | 'layout' | 'typography'
  ): Promise<AIDesignVariations> {
    try {
      const response = await apiRequest("POST", "/api/ai/design-variations", {
        currentDesign,
        variationType
      });

      return response.json();
    } catch (error) {
      throw new Error(`Failed to generate variations: ${(error as Error).message}`);
    }
  }

  // Utility methods for image handling
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  static async urlToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to convert URL to base64'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to fetch image from URL: ${(error as Error).message}`);
    }
  }

  // Validate image for AI processing
  static validateImage(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a JPEG, PNG, or WebP image file.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image file size must be less than 10MB.'
      };
    }

    return { isValid: true };
  }

  // Format AI suggestions for display
  static formatSuggestions(suggestions: string[]): string[] {
    return suggestions.map(suggestion => {
      // Capitalize first letter and ensure proper punctuation
      const formatted = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
      return formatted.endsWith('.') ? formatted : formatted + '.';
    });
  }

  // Convert color formats
  static hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const delta = max - min;
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

      switch (max) {
        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
        case g: h = (b - r) / delta + 2; break;
        case b: h = (r - g) / delta + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  static hslToHex(h: number, s: number, l: number): string {
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (sNorm === 0) {
      r = g = b = lNorm;
    } else {
      const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      const p = 2 * lNorm - q;
      r = hue2rgb(p, q, hNorm + 1/3);
      g = hue2rgb(p, q, hNorm);
      b = hue2rgb(p, q, hNorm - 1/3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Generate complementary colors
  static generateComplementaryColors(baseColor: string): string[] {
    const hsl = this.hexToHsl(baseColor);
    
    const complementary = this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
    const triadic1 = this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
    const triadic2 = this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l);
    const analogous1 = this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
    const analogous2 = this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l);

    return [baseColor, complementary, triadic1, triadic2, analogous1, analogous2];
  }

  // Check if colors have sufficient contrast for print
  static checkColorContrast(color1: string, color2: string): { ratio: number; isAccessible: boolean } {
    const getLuminance = (hex: string) => {
      const rgb = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      ].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      isAccessible: ratio >= 4.5 // WCAG AA standard for normal text
    };
  }

  // Error handling utilities
  static isAIError(error: any): boolean {
    return error?.message?.includes('AI') || 
           error?.message?.includes('OpenAI') || 
           error?.message?.includes('generate') ||
           error?.message?.includes('analyze');
  }

  static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred with AI processing.';
  }

  static getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attemptCount - 1), 30000);
  }
}

// Export utility functions for convenience
export const aiUtils = {
  fileToBase64: AIClient.fileToBase64,
  urlToBase64: AIClient.urlToBase64,
  validateImage: AIClient.validateImage,
  formatSuggestions: AIClient.formatSuggestions,
  hexToHsl: AIClient.hexToHsl,
  hslToHex: AIClient.hslToHex,
  generateComplementaryColors: AIClient.generateComplementaryColors,
  checkColorContrast: AIClient.checkColorContrast,
  isAIError: AIClient.isAIError,
  getErrorMessage: AIClient.getErrorMessage,
  getRetryDelay: AIClient.getRetryDelay,
};

export default AIClient;
