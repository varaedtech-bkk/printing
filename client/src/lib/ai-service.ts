// AI Service for template generation, text suggestions, and smart layout
import { Template, TemplateLayer } from './template-schema';

export interface AITextSuggestion {
  text: string;
  confidence: number;
  reasoning?: string;
}

export interface AIColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  name: string;
  description?: string;
}

export interface AILayoutSuggestion {
  type: 'spacing' | 'alignment' | 'hierarchy' | 'balance';
  description: string;
  changes: Array<{
    layerId: string;
    property: string;
    value: any;
    reason: string;
  }>;
  confidence: number;
}

export interface AIImageSuggestion {
  url: string;
  alt: string;
  category: string;
  tags: string[];
  source: 'unsplash' | 'pexels' | 'generated' | 'stock';
  license: 'free' | 'premium';
}

export interface AITemplateGenerationRequest {
  productType: string;
  keywords: string[];
  style?: 'modern' | 'classic' | 'minimalist' | 'bold' | 'elegant' | 'playful';
  colorScheme?: string[];
  targetAudience?: string;
  industry?: string;
  dimensions?: { width: number; height: number; unit: string };
}

export interface AITemplateGenerationResponse {
  template: Template;
  suggestions: {
    textAlternatives: AITextSuggestion[];
    colorPalettes: AIColorPalette[];
    layoutOptimizations: AILayoutSuggestion[];
  };
  confidence: number;
  reasoning: string;
}

export class AIService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(baseUrl: string = '/api/ai', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || null;
  }

  // Generate a complete template using AI
  async generateTemplate(request: AITemplateGenerationRequest): Promise<AITemplateGenerationResponse> {
    try {
      const response = await this.makeRequest('/generate-template', {
        method: 'POST',
        body: JSON.stringify(request)
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.warn('AI template generation failed, using fallback');
        return this.generateFallbackTemplate(request);
      }
    } catch (error) {
      console.error('Error generating AI template:', error);
      return this.generateFallbackTemplate(request);
    }
  }

  // Generate text suggestions for a text layer
  async generateTextSuggestions(
    layerId: string,
    currentText: string,
    context: {
      productType: string;
      industry?: string;
      targetAudience?: string;
      style?: string;
    }
  ): Promise<AITextSuggestion[]> {
    try {
      const response = await this.makeRequest('/suggest-text', {
        method: 'POST',
        body: JSON.stringify({
          layerId,
          currentText,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      } else {
        console.warn('AI text suggestions failed, using fallback');
        return this.generateFallbackTextSuggestions(currentText, context);
      }
    } catch (error) {
      console.error('Error generating text suggestions:', error);
      return this.generateFallbackTextSuggestions(currentText, context);
    }
  }

  // Generate color palette suggestions
  async generateColorSuggestions(
    currentColors: string[],
    context: {
      productType: string;
      style?: string;
      industry?: string;
      mood?: string;
    }
  ): Promise<AIColorPalette[]> {
    try {
      const response = await this.makeRequest('/suggest-colors', {
        method: 'POST',
        body: JSON.stringify({
          currentColors,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.palettes || [];
      } else {
        console.warn('AI color suggestions failed, using fallback');
        return this.generateFallbackColorPalettes(context);
      }
    } catch (error) {
      console.error('Error generating color suggestions:', error);
      return this.generateFallbackColorPalettes(context);
    }
  }

  // Generate layout optimization suggestions
  async generateLayoutSuggestions(
    template: Template,
    focusArea?: string
  ): Promise<AILayoutSuggestion[]> {
    try {
      const response = await this.makeRequest('/suggest-layout', {
        method: 'POST',
        body: JSON.stringify({
          template,
          focusArea
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      } else {
        console.warn('AI layout suggestions failed, using fallback');
        return this.generateFallbackLayoutSuggestions(template);
      }
    } catch (error) {
      console.error('Error generating layout suggestions:', error);
      return this.generateFallbackLayoutSuggestions(template);
    }
  }

  // Generate image suggestions for image placeholders
  async generateImageSuggestions(
    placeholder: TemplateLayer,
    context: {
      productType: string;
      industry?: string;
      style?: string;
      keywords?: string[];
    }
  ): Promise<AIImageSuggestion[]> {
    try {
      const response = await this.makeRequest('/suggest-images', {
        method: 'POST',
        body: JSON.stringify({
          placeholder,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      } else {
        console.warn('AI image suggestions failed, using fallback');
        return this.generateFallbackImageSuggestions(context);
      }
    } catch (error) {
      console.error('Error generating image suggestions:', error);
      return this.generateFallbackImageSuggestions(context);
    }
  }

  // Apply AI suggestions to a template
  async applySuggestions(
    template: Template,
    suggestions: {
      textChanges?: Array<{ layerId: string; text: string }>;
      colorChanges?: Array<{ layerId: string; color: string }>;
      layoutChanges?: Array<{ layerId: string; property: string; value: any }>;
    }
  ): Promise<Template> {
    const updatedTemplate = JSON.parse(JSON.stringify(template)); // Deep clone

    // Apply text changes
    if (suggestions.textChanges) {
      suggestions.textChanges.forEach(change => {
        const layer = updatedTemplate.layers.find((l: TemplateLayer) => l.id === change.layerId);
        if (layer && layer.type === 'text') {
          layer.content = change.text;
        }
      });
    }

    // Apply color changes
    if (suggestions.colorChanges) {
      suggestions.colorChanges.forEach(change => {
        const layer = updatedTemplate.layers.find((l: TemplateLayer) => l.id === change.layerId);
        if (layer) {
          if (layer.type === 'text') {
            layer.color = change.color;
          } else {
            layer.fill = change.color;
          }
        }
      });
    }

    // Apply layout changes
    if (suggestions.layoutChanges) {
      suggestions.layoutChanges.forEach(change => {
        const layer = updatedTemplate.layers.find((l: TemplateLayer) => l.id === change.layerId);
        if (layer) {
          (layer as any)[change.property] = change.value;
        }
      });
    }

    return updatedTemplate;
  }

  // Beautify template with AI
  async beautifyTemplate(template: Template): Promise<Template> {
    try {
      const response = await this.makeRequest('/beautify', {
        method: 'POST',
        body: JSON.stringify({ template })
      });

      if (response.ok) {
        const data = await response.json();
        return data.template;
      } else {
        console.warn('AI beautify failed, using fallback');
        return this.beautifyFallback(template);
      }
    } catch (error) {
      console.error('Error beautifying template:', error);
      return this.beautifyFallback(template);
    }
  }

  // Private helper methods
  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return fetch(url, {
      ...options,
      headers
    });
  }

  // Fallback methods for when AI service is unavailable
  private generateFallbackTemplate(request: AITemplateGenerationRequest): AITemplateGenerationResponse {
    const template = this.createBasicTemplate(request);
    
    return {
      template,
      suggestions: {
        textAlternatives: this.generateFallbackTextSuggestions('', {
          productType: request.productType,
          industry: request.industry,
          style: request.style
        }),
        colorPalettes: this.generateFallbackColorPalettes({
          productType: request.productType,
          style: request.style,
          industry: request.industry
        }),
        layoutOptimizations: this.generateFallbackLayoutSuggestions(template)
      },
      confidence: 0.7,
      reasoning: 'Generated using fallback algorithm based on best practices'
    };
  }

  private createBasicTemplate(request: AITemplateGenerationRequest): Template {
    const now = new Date().toISOString();
    const dimensions = request.dimensions || { width: 55, height: 85, unit: 'mm' };
    
    // Determine colors based on style
    const colors = this.getColorsForStyle(request.style || 'modern');
    
    const layers: TemplateLayer[] = [
      {
        id: 'background',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
        fill: colors.background,
        userEditable: false,
        lockPosition: true,
        lockSize: true
      }
    ];

    // Add content based on product type
    if (request.productType.toLowerCase().includes('business card')) {
      layers.push(
        {
          id: 'company_name',
          type: 'text',
          content: 'YOUR COMPANY NAME',
          x: 10,
          y: 15,
          fontSize: 14,
          fontFamily: 'Arial',
          color: colors.text,
          fontWeight: 'bold',
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Company Name'
        },
        {
          id: 'person_name',
          type: 'text',
          content: 'YOUR NAME',
          x: 10,
          y: 35,
          fontSize: 18,
          fontFamily: 'Arial',
          color: colors.text,
          fontWeight: 'bold',
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Full Name'
        },
        {
          id: 'job_title',
          type: 'text',
          content: 'Job Title',
          x: 10,
          y: 55,
          fontSize: 12,
          fontFamily: 'Arial',
          color: colors.text,
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Job Title'
        }
      );
    } else if (request.productType.toLowerCase().includes('flyer')) {
      layers.push(
        {
          id: 'title',
          type: 'text',
          content: 'EVENT TITLE',
          x: 20,
          y: 20,
          fontSize: 24,
          fontFamily: 'Arial',
          color: colors.text,
          fontWeight: 'bold',
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Event Title'
        },
        {
          id: 'description',
          type: 'text',
          content: 'Event description goes here...',
          x: 20,
          y: 60,
          fontSize: 16,
          fontFamily: 'Arial',
          color: colors.text,
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Description'
        }
      );
    }

    return {
      metadata: {
        id: `ai_generated_${Date.now()}`,
        title: `AI Generated ${request.productType}`,
        description: `AI-generated template for ${request.productType} with ${request.style || 'modern'} style`,
        category: this.getCategoryFromProductType(request.productType),
        tags: [...request.keywords, 'ai-generated', request.style || 'modern'],
        createdAt: now,
        author: 'AI Assistant',
        version: '1.0',
        isPremium: false,
        isPublic: false,
        language: 'en',
        dimensions: {
          ...dimensions,
          unit: dimensions.unit as 'in' | 'mm' | 'px'
        }
      },
      layers,
      background: { color: colors.background },
      variables: {},
      aiConfig: {
        canGenerateText: true,
        canSuggestColors: true,
        canOptimizeLayout: true,
        canReplaceImages: true
      }
    };
  }

  private generateFallbackTextSuggestions(currentText: string, context: any): AITextSuggestion[] {
    const suggestions: AITextSuggestion[] = [];
    
    if (context.productType?.toLowerCase().includes('business card')) {
      if (currentText.toLowerCase().includes('company')) {
        suggestions.push(
          { text: 'Innovation Solutions', confidence: 0.8 },
          { text: 'Global Enterprises', confidence: 0.7 },
          { text: 'Creative Agency', confidence: 0.9 }
        );
      } else if (currentText.toLowerCase().includes('name')) {
        suggestions.push(
          { text: 'Alex Johnson', confidence: 0.8 },
          { text: 'Sarah Chen', confidence: 0.7 },
          { text: 'Michael Rodriguez', confidence: 0.6 }
        );
      } else if (currentText.toLowerCase().includes('title')) {
        suggestions.push(
          { text: 'Senior Manager', confidence: 0.8 },
          { text: 'Creative Director', confidence: 0.7 },
          { text: 'Project Lead', confidence: 0.6 }
        );
      }
    }

    return suggestions;
  }

  private generateFallbackColorPalettes(context: any): AIColorPalette[] {
    const palettes: AIColorPalette[] = [];

    if (context.style === 'modern') {
      palettes.push(
        {
          primary: '#3B82F6',
          secondary: '#1E40AF',
          accent: '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937',
          name: 'Modern Blue',
          description: 'Professional and contemporary'
        },
        {
          primary: '#10B981',
          secondary: '#059669',
          accent: '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937',
          name: 'Modern Green',
          description: 'Fresh and professional'
        }
      );
    } else if (context.style === 'elegant') {
      palettes.push(
        {
          primary: '#7C3AED',
          secondary: '#5B21B6',
          accent: '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937',
          name: 'Elegant Purple',
          description: 'Sophisticated and refined'
        }
      );
    } else {
      // Default palettes
      palettes.push(
        {
          primary: '#3B82F6',
          secondary: '#1E40AF',
          accent: '#F59E0B',
          background: '#FFFFFF',
          text: '#1F2937',
          name: 'Professional Blue',
          description: 'Classic professional look'
        }
      );
    }

    return palettes;
  }

  private generateFallbackLayoutSuggestions(template: Template): AILayoutSuggestion[] {
    const suggestions: AILayoutSuggestion[] = [];

    // Check for spacing issues
    const textLayers = template.layers.filter(l => l.type === 'text');
    if (textLayers.length > 1) {
      suggestions.push({
        type: 'spacing',
        description: 'Improve text spacing for better readability',
        changes: textLayers.map((layer, index) => ({
          layerId: layer.id,
          property: 'y',
          value: layer.y + (index * 5), // Add more spacing
          reason: 'Increase vertical spacing between text elements'
        })),
        confidence: 0.8
      });
    }

    // Check for alignment
    const centerAlignedLayers = textLayers.filter(l => l.textAlign === 'center');
    if (centerAlignedLayers.length > 0) {
      suggestions.push({
        type: 'alignment',
        description: 'Center-align all text elements for consistency',
        changes: textLayers.map(layer => ({
          layerId: layer.id,
          property: 'textAlign',
          value: 'center',
          reason: 'Maintain consistent text alignment'
        })),
        confidence: 0.7
      });
    }

    return suggestions;
  }

  private generateFallbackImageSuggestions(context: any): AIImageSuggestion[] {
    const suggestions: AIImageSuggestion[] = [];

    if (context.productType?.toLowerCase().includes('business card')) {
      suggestions.push(
        {
          url: '/api/placeholder/100/100',
          alt: 'Professional headshot',
          category: 'portrait',
          tags: ['professional', 'business', 'headshot'],
          source: 'stock',
          license: 'free'
        },
        {
          url: '/api/placeholder/100/100',
          alt: 'Company logo',
          category: 'logo',
          tags: ['logo', 'brand', 'corporate'],
          source: 'stock',
          license: 'free'
        }
      );
    }

    return suggestions;
  }

  private beautifyFallback(template: Template): Template {
    const beautified = JSON.parse(JSON.stringify(template));

    // Apply basic beautification rules
    beautified.layers.forEach((layer: TemplateLayer) => {
      if (layer.type === 'text') {
        // Ensure consistent font sizes
        if (layer.fontSize && layer.fontSize < 10) {
          layer.fontSize = 12;
        }
        
        // Ensure good contrast
        if (layer.color === '#000000' && template.background?.color === '#000000') {
          layer.color = '#FFFFFF';
        }
      }
    });

    return beautified;
  }

  private getColorsForStyle(style: string): { primary: string; secondary: string; background: string; text: string } {
    const colorSchemes: Record<string, any> = {
      modern: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      classic: {
        primary: '#1F2937',
        secondary: '#374151',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      minimalist: {
        primary: '#000000',
        secondary: '#6B7280',
        background: '#FFFFFF',
        text: '#000000'
      },
      bold: {
        primary: '#EF4444',
        secondary: '#DC2626',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      elegant: {
        primary: '#7C3AED',
        secondary: '#5B21B6',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      playful: {
        primary: '#F59E0B',
        secondary: '#D97706',
        background: '#FFFFFF',
        text: '#1F2937'
      }
    };

    return colorSchemes[style] || colorSchemes.modern;
  }

  private getCategoryFromProductType(productType: string): string {
    const type = productType.toLowerCase();
    
    if (type.includes('business card')) return 'business-cards';
    if (type.includes('flyer')) return 'flyers';
    if (type.includes('poster')) return 'posters';
    if (type.includes('brochure')) return 'brochures';
    if (type.includes('letterhead')) return 'letterheads';
    if (type.includes('envelope')) return 'envelopes';
    if (type.includes('sticker')) return 'stickers';
    if (type.includes('banner')) return 'banners';
    
    return 'business-cards'; // Default
  }
}

// Create singleton instance
export const aiService = new AIService();

// Export utility functions
export function createAITemplateRequest(
  productType: string,
  keywords: string[],
  options?: Partial<AITemplateGenerationRequest>
): AITemplateGenerationRequest {
  return {
    productType,
    keywords,
    style: 'modern',
    ...options
  };
}

export function validateAISuggestion(suggestion: any): boolean {
  return suggestion && 
         typeof suggestion === 'object' && 
         'confidence' in suggestion && 
         typeof suggestion.confidence === 'number' &&
         suggestion.confidence >= 0 && 
         suggestion.confidence <= 1;
}
