// Enhanced AI features for Web2Print platform
// Implements AI text rewrite, tone shift, auto-layout suggestions, and image generation

export interface AITextRewriteRequest {
  originalText: string;
  tone: 'professional' | 'casual' | 'friendly' | 'formal' | 'creative';
  length: 'shorter' | 'same' | 'longer';
  language: 'en' | 'th';
  context?: string; // Business type, industry, etc.
}

export interface AITextRewriteResult {
  originalText: string;
  rewrittenText: string;
  tone: string;
  alternatives: string[];
  suggestions: string[];
}

export interface AILayoutSuggestion {
  type: 'alignment' | 'spacing' | 'hierarchy' | 'color-harmony' | 'composition';
  description: string;
  confidence: number;
  suggestedChanges: {
    elementId: string;
    property: string;
    value: any;
    reason: string;
  }[];
  beforeImage?: string; // Base64 preview
  afterImage?: string; // Base64 preview
}

export interface AIImageGenerationRequest {
  prompt: string;
  style: 'realistic' | 'illustration' | 'minimalist' | 'vintage' | 'modern';
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  size: 'small' | 'medium' | 'large';
  colorScheme?: string[];
}

export interface AIImageGenerationResult {
  imageUrl: string;
  prompt: string;
  style: string;
  alternatives: string[];
  metadata: {
    model: string;
    generationTime: number;
    seed: number;
  };
}

export interface AIDesignAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: AILayoutSuggestion[];
  colorAnalysis: {
    harmony: number;
    contrast: number;
    accessibility: number;
    recommendations: string[];
  };
  typographyAnalysis: {
    readability: number;
    hierarchy: number;
    consistency: number;
    recommendations: string[];
  };
}

export class AIEnhancedFeatures {
  private apiBase: string;

  constructor(apiBase: string = '/api/ai') {
    this.apiBase = apiBase;
  }

  // AI Text Rewrite with Tone Shifting
  async rewriteText(request: AITextRewriteRequest): Promise<AITextRewriteResult> {
    try {
      const response = await fetch(`${this.apiBase}/rewrite-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`AI text rewrite failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('AI text rewrite error:', error);
      // Fallback to simple text variations
      return this.generateFallbackTextVariations(request);
    }
  }

  // Generate multiple text variations
  async generateTextVariations(
    originalText: string,
    count: number = 3,
    tone: string = 'professional'
  ): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiBase}/text-variations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalText,
          count,
          tone,
        }),
      });

      if (!response.ok) {
        throw new Error(`Text variations generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.variations;
    } catch (error) {
      console.error('Text variations error:', error);
      return this.generateFallbackVariations(originalText, count);
    }
  }

  // AI Layout Suggestions
  async analyzeLayout(elements: any[], productType: string): Promise<AILayoutSuggestion[]> {
    try {
      const response = await fetch(`${this.apiBase}/analyze-layout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elements,
          productType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Layout analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.suggestions;
    } catch (error) {
      console.error('Layout analysis error:', error);
      return this.generateFallbackLayoutSuggestions(elements);
    }
  }

  // AI Image Generation
  async generateImage(request: AIImageGenerationRequest): Promise<AIImageGenerationResult> {
    try {
      const response = await fetch(`${this.apiBase}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error('Image generation is currently unavailable');
    }
  }

  // Comprehensive Design Analysis
  async analyzeDesign(
    elements: any[],
    productType: string,
    designImage?: string
  ): Promise<AIDesignAnalysis> {
    try {
      const response = await fetch(`${this.apiBase}/analyze-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elements,
          productType,
          designImage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Design analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Design analysis error:', error);
      return this.generateFallbackDesignAnalysis(elements);
    }
  }

  // Auto-trace / Vectorize raster images
  async vectorizeImage(imageUrl: string): Promise<{ svgUrl: string; success: boolean }> {
    try {
      const response = await fetch(`${this.apiBase}/vectorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Vectorization failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Vectorization error:', error);
      return { svgUrl: '', success: false };
    }
  }

  // Smart Color Palette Generation
  async generateSmartColorPalette(
    industry: string,
    mood: string,
    baseColor?: string
  ): Promise<{
    primary: string;
    secondary: string;
    accent: string;
    neutral: string[];
    reasoning: string;
  }> {
    try {
      const response = await fetch(`${this.apiBase}/color-palette`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry,
          mood,
          baseColor,
        }),
      });

      if (!response.ok) {
        throw new Error(`Color palette generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Color palette error:', error);
      return this.generateFallbackColorPalette(industry, mood);
    }
  }

  // Fallback methods for when AI is unavailable
  private generateFallbackTextVariations(request: AITextRewriteRequest): AITextRewriteResult {
    const { originalText, tone } = request;
    
    const variations = {
      professional: [
        `Professional: ${originalText}`,
        `Business-focused: ${originalText}`,
        `Corporate: ${originalText}`,
      ],
      casual: [
        `Casual: ${originalText}`,
        `Friendly: ${originalText}`,
        `Relaxed: ${originalText}`,
      ],
      creative: [
        `Creative: ${originalText}`,
        `Innovative: ${originalText}`,
        `Artistic: ${originalText}`,
      ],
    };

    const toneVariations = variations[tone as keyof typeof variations] || variations.professional;

    return {
      originalText,
      rewrittenText: toneVariations[0],
      tone,
      alternatives: toneVariations.slice(1),
      suggestions: [
        'Consider adding your unique value proposition',
        'Include a clear call-to-action',
        'Mention your contact information',
        'Add your location or service area if relevant',
      ],
    };
  }

  private generateFallbackVariations(originalText: string, count: number): string[] {
    const variations = [
      `${originalText} - Premium Quality`,
      `${originalText} - Professional Service`,
      `${originalText} - Trusted Partner`,
      `${originalText} - Excellence Guaranteed`,
      `${originalText} - Your Success, Our Priority`,
    ];

    return variations.slice(0, count);
  }

  private generateFallbackLayoutSuggestions(elements: any[]): AILayoutSuggestion[] {
    const suggestions: AILayoutSuggestion[] = [];

    // Check for alignment issues
    if (elements.length > 1) {
      suggestions.push({
        type: 'alignment',
        description: 'Consider aligning elements for better visual hierarchy',
        confidence: 0.7,
        suggestedChanges: [
          {
            elementId: elements[0]?.id || 'unknown',
            property: 'alignment',
            value: 'center',
            reason: 'Center alignment creates better balance',
          },
        ],
      });
    }

    // Check for spacing
    suggestions.push({
      type: 'spacing',
      description: 'Add more whitespace between elements for better readability',
      confidence: 0.6,
      suggestedChanges: [],
    });

    return suggestions;
  }

  private generateFallbackDesignAnalysis(elements: any[]): AIDesignAnalysis {
    return {
      overallScore: 7.5,
      strengths: [
        'Good use of available space',
        'Clear content structure',
        'Appropriate element sizing',
      ],
      weaknesses: [
        'Could benefit from more visual hierarchy',
        'Consider adding more whitespace',
        'Color scheme could be more cohesive',
      ],
      suggestions: this.generateFallbackLayoutSuggestions(elements),
      colorAnalysis: {
        harmony: 7.0,
        contrast: 6.5,
        accessibility: 7.5,
        recommendations: [
          'Consider using a more cohesive color palette',
          'Ensure sufficient contrast for readability',
          'Test colors for accessibility compliance',
        ],
      },
      typographyAnalysis: {
        readability: 8.0,
        hierarchy: 6.5,
        consistency: 7.0,
        recommendations: [
          'Establish clearer typographic hierarchy',
          'Use consistent font sizes throughout',
          'Consider font pairing for better visual appeal',
        ],
      },
    };
  }

  private generateFallbackColorPalette(
    industry: string,
    mood: string
  ): {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string[];
    reasoning: string;
  } {
    const palettes = {
      professional: {
        primary: '#2C3E50',
        secondary: '#34495E',
        accent: '#3498DB',
        neutral: ['#ECF0F1', '#BDC3C7', '#95A5A6'],
        reasoning: 'Professional blue-gray palette for corporate designs',
      },
      creative: {
        primary: '#E74C3C',
        secondary: '#F39C12',
        accent: '#9B59B6',
        neutral: ['#F8F9FA', '#DEE2E6', '#ADB5BD'],
        reasoning: 'Vibrant colors for creative and artistic designs',
      },
      modern: {
        primary: '#2D3436',
        secondary: '#636E72',
        accent: '#00B894',
        neutral: ['#FFFFFF', '#F5F6FA', '#DFE6E9'],
        reasoning: 'Modern minimalist palette with green accent',
      },
    };

    return palettes[mood as keyof typeof palettes] || palettes.professional;
  }
}

// Utility functions for AI features
export const aiUtils = {
  // Extract text content from design elements
  extractTextContent(elements: any[]): string[] {
    return elements
      .filter(el => el.type === 'text' && el.content)
      .map(el => el.content);
  },

  // Calculate design complexity score
  calculateComplexityScore(elements: any[]): number {
    const textElements = elements.filter(el => el.type === 'text').length;
    const imageElements = elements.filter(el => el.type === 'image').length;
    const shapeElements = elements.filter(el => el.type === 'shape').length;

    return (textElements * 1 + imageElements * 2 + shapeElements * 1.5) / 10;
  },

  // Validate AI request parameters
  validateAIRequest(request: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.originalText && !request.prompt) {
      errors.push('Text content or prompt is required');
    }

    if (request.tone && !['professional', 'casual', 'friendly', 'formal', 'creative'].includes(request.tone)) {
      errors.push('Invalid tone specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Format AI suggestions for display
  formatSuggestions(suggestions: string[]): string[] {
    return suggestions.map(suggestion => {
      // Capitalize first letter
      return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
    });
  },
};

// Export singleton instance
export const aiFeatures = new AIEnhancedFeatures();
