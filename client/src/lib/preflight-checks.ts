// Preflight checking system for print-ready designs
// Based on industry standards from GoGoPrint, RedPrinting, and professional printers

export interface PreflightIssue {
  type: 'error' | 'warning' | 'info';
  category: 'resolution' | 'bleed' | 'fonts' | 'colors' | 'accessibility' | 'content';
  message: string;
  elementId?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fixable: boolean;
  suggestion?: string;
}

export interface PreflightResult {
  isValid: boolean;
  issues: PreflightIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
    criticalIssues: number;
  };
  recommendations: string[];
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: any;
  content?: string;
  imageUrl?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
}

export interface PrintProduct {
  id: string;
  dimensions: {
    width: number; // mm
    height: number; // mm
    bleed: number; // mm
    safeZone: number; // mm
    dpi: number;
  };
}

export class PreflightChecker {
  private product: PrintProduct;
  private elements: DesignElement[];
  private loadedFonts: Set<string> = new Set();

  constructor(product: PrintProduct, elements: DesignElement[]) {
    this.product = product;
    this.elements = elements;
  }

  // Main preflight check
  async runChecks(): Promise<PreflightResult> {
    const issues: PreflightIssue[] = [];

    // Run all checks
    issues.push(...this.checkResolution());
    issues.push(...this.checkBleedAndSafeZones());
    issues.push(...this.checkFonts());
    issues.push(...this.checkColors());
    issues.push(...this.checkAccessibility());
    issues.push(...this.checkContent());

    const summary = this.generateSummary(issues);
    const recommendations = this.generateRecommendations(issues);

    return {
      isValid: summary.errors === 0 && summary.criticalIssues === 0,
      issues,
      summary,
      recommendations
    };
  }

  // Check image resolution and DPI
  private checkResolution(): PreflightIssue[] {
    const issues: PreflightIssue[] = [];
    const minDpi = this.product.dimensions.dpi;
    const mmToPx = (mm: number) => (mm / 25.4) * minDpi;

    this.elements.forEach(element => {
      if (element.type === 'image' && element.imageUrl) {
        // Check if image has sufficient resolution
        const requiredWidth = mmToPx(element.size.width);
        const requiredHeight = mmToPx(element.size.height);
        
        // For now, we'll estimate based on display size
        // In production, you'd load the actual image and check its dimensions
        const estimatedDpi = Math.min(
          (element.size.width * 96) / (element.size.width / 25.4), // 96 DPI is screen DPI
          (element.size.height * 96) / (element.size.height / 25.4)
        );

        if (estimatedDpi < minDpi * 0.8) {
          issues.push({
            type: 'error',
            category: 'resolution',
            message: `Image resolution too low (estimated ${Math.round(estimatedDpi)} DPI, need ${minDpi} DPI)`,
            elementId: element.id,
            severity: 'critical',
            fixable: true,
            suggestion: 'Replace with higher resolution image or reduce image size'
          });
        } else if (estimatedDpi < minDpi) {
          issues.push({
            type: 'warning',
            category: 'resolution',
            message: `Image resolution may be insufficient (estimated ${Math.round(estimatedDpi)} DPI, recommended ${minDpi} DPI)`,
            elementId: element.id,
            severity: 'medium',
            fixable: true,
            suggestion: 'Consider using a higher resolution image for better print quality'
          });
        }
      }
    });

    return issues;
  }

  // Check bleed and safe zone compliance
  private checkBleedAndSafeZones(): PreflightIssue[] {
    const issues: PreflightIssue[] = [];
    const bleedMm = this.product.dimensions.bleed;
    const safeZoneMm = this.product.dimensions.safeZone;
    const mmToPx = (mm: number) => (mm / 25.4) * this.product.dimensions.dpi;

    const bleedPx = mmToPx(bleedMm);
    const safeZonePx = mmToPx(safeZoneMm);
    const totalWidth = mmToPx(this.product.dimensions.width);
    const totalHeight = mmToPx(this.product.dimensions.height);

    this.elements.forEach(element => {
      const { x, y } = element.position;
      const { width, height } = element.size;

      // Check if elements extend into bleed area (good)
      const extendsToBleed = x < bleedPx || y < bleedPx || 
                            (x + width) > (totalWidth - bleedPx) || 
                            (y + height) > (totalHeight - bleedPx);

      // Check if critical content is too close to trim
      const tooCloseToTrim = x < safeZonePx || y < safeZonePx || 
                            (x + width) > (totalWidth - safeZonePx) || 
                            (y + height) > (totalHeight - safeZonePx);

      if (element.type === 'text' && tooCloseToTrim) {
        issues.push({
          type: 'error',
          category: 'bleed',
          message: 'Text too close to trim edge - may be cut off during printing',
          elementId: element.id,
          severity: 'critical',
          fixable: true,
          suggestion: 'Move text further from edges or reduce text size'
        });
      } else if (element.type === 'text' && !extendsToBleed) {
        issues.push({
          type: 'warning',
          category: 'bleed',
          message: 'Text doesn\'t extend to bleed area - may have white edges',
          elementId: element.id,
          severity: 'medium',
          fixable: true,
          suggestion: 'Extend text or background to bleed area for professional finish'
        });
      }
    });

    return issues;
  }

  // Check font availability and licensing
  private checkFonts(): PreflightIssue[] {
    const issues: PreflightIssue[] = [];

    this.elements.forEach(element => {
      if (element.type === 'text' && element.fontFamily) {
        const fontFamily = element.fontFamily.toLowerCase();
        
        // Check for web-safe fonts vs custom fonts
        const webSafeFonts = [
          'arial', 'helvetica', 'times', 'times new roman', 'courier', 'courier new',
          'georgia', 'palatino', 'garamond', 'bookman', 'comic sans ms', 'trebuchet ms',
          'arial black', 'impact', 'lucida console', 'tahoma', 'verdana'
        ];

        if (!webSafeFonts.includes(fontFamily) && !this.loadedFonts.has(fontFamily)) {
          issues.push({
            type: 'warning',
            category: 'fonts',
            message: `Custom font "${element.fontFamily}" may not be available for printing`,
            elementId: element.id,
            severity: 'medium',
            fixable: true,
            suggestion: 'Use web-safe fonts or ensure custom fonts are properly embedded'
          });
        }

        // Check font size for readability
        if (element.fontSize && element.fontSize < 8) {
          issues.push({
            type: 'error',
            category: 'fonts',
            message: `Font size too small (${element.fontSize}px) for print readability`,
            elementId: element.id,
            severity: 'high',
            fixable: true,
            suggestion: 'Increase font size to at least 8px for print'
          });
        }
      }
    });

    return issues;
  }

  // Check color issues
  private checkColors(): PreflightIssue[] {
    const issues: PreflightIssue[] = [];

    this.elements.forEach(element => {
      if (element.color) {
        // Check for RGB colors that should be CMYK for print
        if (element.color.startsWith('rgb') || element.color.startsWith('#')) {
          issues.push({
            type: 'info',
            category: 'colors',
            message: 'RGB colors will be converted to CMYK for printing',
            elementId: element.id,
            severity: 'low',
            fixable: false,
            suggestion: 'Consider using CMYK colors for more predictable print results'
          });
        }

        // Check for very light colors that might not print well
        if (element.color === '#ffffff' || element.color === 'white') {
          issues.push({
            type: 'warning',
            category: 'colors',
            message: 'White text may not be visible on light backgrounds',
            elementId: element.id,
            severity: 'medium',
            fixable: true,
            suggestion: 'Use darker colors or add background contrast'
          });
        }
      }
    });

    return issues;
  }

  // Check accessibility issues
  private checkAccessibility(): PreflightIssue[] {
    const issues: PreflightIssue[] = [];

    this.elements.forEach(element => {
      if (element.type === 'text') {
        // Check for sufficient contrast (simplified check)
        if (element.color === '#ffffff' || element.color === 'white') {
          issues.push({
            type: 'warning',
            category: 'accessibility',
            message: 'White text may have poor contrast',
            elementId: element.id,
            severity: 'medium',
            fixable: true,
            suggestion: 'Ensure sufficient contrast with background'
          });
        }

        // Check for very small text
        if (element.fontSize && element.fontSize < 10) {
          issues.push({
            type: 'warning',
            category: 'accessibility',
            message: 'Small text may be difficult to read',
            elementId: element.id,
            severity: 'medium',
            fixable: true,
            suggestion: 'Consider increasing font size for better readability'
          });
        }
      }
    });

    return issues;
  }

  // Check content issues
  private checkContent(): PreflightIssue[] {
    const issues: PreflightIssue[] = [];

    // Check for empty design
    if (this.elements.length === 0) {
      issues.push({
        type: 'error',
        category: 'content',
        message: 'Design is empty - please add content',
        severity: 'critical',
        fixable: true,
        suggestion: 'Add text, images, or shapes to your design'
      });
    }

    // Check for placeholder text
    this.elements.forEach(element => {
      if (element.type === 'text' && element.content) {
        const placeholderTexts = [
          'click to edit', 'your text here', 'placeholder', 'sample text',
          'lorem ipsum', 'add text', 'edit me', 'your company name'
        ];

        const isPlaceholder = placeholderTexts.some(placeholder =>
          element.content?.toLowerCase().includes(placeholder)
        );

        if (isPlaceholder) {
          issues.push({
            type: 'warning',
            category: 'content',
            message: 'Placeholder text detected - please replace with actual content',
            elementId: element.id,
            severity: 'medium',
            fixable: true,
            suggestion: 'Replace placeholder text with your actual content'
          });
        }
      }
    });

    return issues;
  }

  // Generate summary statistics
  private generateSummary(issues: PreflightIssue[]): PreflightResult['summary'] {
    const errors = issues.filter(i => i.type === 'error').length;
    const warnings = issues.filter(i => i.type === 'warning').length;
    const info = issues.filter(i => i.type === 'info').length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;

    return { errors, warnings, info, criticalIssues };
  }

  // Generate recommendations
  private generateRecommendations(issues: PreflightIssue[]): string[] {
    const recommendations: string[] = [];

    const hasResolutionIssues = issues.some(i => i.category === 'resolution');
    const hasBleedIssues = issues.some(i => i.category === 'bleed');
    const hasFontIssues = issues.some(i => i.category === 'fonts');

    if (hasResolutionIssues) {
      recommendations.push('Use high-resolution images (300 DPI minimum) for best print quality');
    }

    if (hasBleedIssues) {
      recommendations.push('Extend important elements to the bleed area to avoid white edges');
    }

    if (hasFontIssues) {
      recommendations.push('Use web-safe fonts or ensure custom fonts are properly embedded');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your design looks good for print! Consider adding a test print to verify colors.');
    }

    return recommendations;
  }

  // Add loaded fonts to the checker
  addLoadedFont(fontFamily: string): void {
    this.loadedFonts.add(fontFamily.toLowerCase());
  }

  // Get specific issues by category
  getIssuesByCategory(category: PreflightIssue['category']): PreflightIssue[] {
    return this.elements.flatMap(() => []); // This would be populated by runChecks()
  }
}

// Utility functions for preflight checking
export const preflightUtils = {
  // Convert RGB to estimated CMYK
  rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;

    const k = 1 - Math.max(red, green, blue);
    const c = (1 - red - k) / (1 - k);
    const m = (1 - green - k) / (1 - k);
    const y = (1 - blue - k) / (1 - k);

    return {
      c: Math.max(0, c) * 100,
      m: Math.max(0, m) * 100,
      y: Math.max(0, y) * 100,
      k: k * 100
    };
  },

  // Check color contrast ratio
  getContrastRatio(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In production, use a proper color contrast library
    return 4.5; // Placeholder
  },

  // Validate print dimensions
  validatePrintDimensions(width: number, height: number, product: PrintProduct): boolean {
    const tolerance = 0.1; // 10% tolerance
    const expectedWidth = product.dimensions.width;
    const expectedHeight = product.dimensions.height;

    return Math.abs(width - expectedWidth) / expectedWidth < tolerance &&
           Math.abs(height - expectedHeight) / expectedHeight < tolerance;
  }
};
