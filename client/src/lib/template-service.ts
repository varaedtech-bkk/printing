// Template Service for fetching and managing templates
import { Template, TemplateSearchFilters, TemplateSearchResult, TemplateCategory, DEFAULT_CATEGORIES, SAMPLE_TEMPLATES } from './template-schema';

export class TemplateService {
  private baseUrl: string;
  private cache: Map<string, Template> = new Map();
  private categoriesCache: TemplateCategory[] | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // Fetch templates from API with fallback to sample data
  async fetchTemplates(filters?: TemplateSearchFilters): Promise<TemplateSearchResult> {
    console.log("🔍 TemplateService: fetchTemplates called with filters:", filters);

    try {
      const params = new URLSearchParams();
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters?.isPremium !== undefined) params.append('isPremium', filters.isPremium.toString());
      if (filters?.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());
      if (filters?.language) params.append('language', filters.language);
      if (filters?.minRating) params.append('minRating', filters.minRating.toString());
      if (filters?.dateRange) {
        if (filters.dateRange.from) params.append('dateFrom', filters.dateRange.from);
        if (filters.dateRange.to) params.append('dateTo', filters.dateRange.to);
      }
      if (filters?.dimensions) {
        if (filters.dimensions.width?.min) params.append('widthMin', filters.dimensions.width.min.toString());
        if (filters.dimensions.width?.max) params.append('widthMax', filters.dimensions.width.max.toString());
        if (filters.dimensions.height?.min) params.append('heightMin', filters.dimensions.height.min.toString());
        if (filters.dimensions.height?.max) params.append('heightMax', filters.dimensions.height.max.toString());
      }

      const response = await fetch(`${this.baseUrl}/templates?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.warn('Failed to fetch templates from API, using sample data');
        const result = this.getSampleTemplates(filters);
        console.log("🔍 TemplateService: Returning sample templates:", result.templates.length, "templates");
        return result;
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      return this.getSampleTemplates(filters);
    }
  }

  // Get a specific template by ID
  async getTemplate(id: string): Promise<Template | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/templates/${id}`);
      
      if (response.ok) {
        const template = await response.json();
        this.cache.set(id, template);
        return template;
      } else {
        console.warn(`Template ${id} not found in API, checking sample data`);
        return this.getSampleTemplate(id);
      }
    } catch (error) {
      console.error(`Error fetching template ${id}:`, error);
      return this.getSampleTemplate(id);
    }
  }

  // Get template by URL parameters (for direct template loading)
  async getTemplateByParams(templateId?: string, productId?: string): Promise<Template | null> {
    if (templateId) {
      return this.getTemplate(templateId);
    }

    // If no template ID, try to find a default template for the product
    if (productId) {
      const templates = await this.fetchTemplates({ 
        category: this.getCategoryByProductId(productId) 
      });
      
      if (templates.templates.length > 0) {
        return templates.templates[0];
      }
    }

    return null;
  }

  // Save template (for user-created templates)
  async saveTemplate(template: Template): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.id) {
          this.cache.set(result.id, template);
        }
        return { success: true, id: result.id };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update existing template
  async updateTemplate(id: string, template: Template): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        this.cache.set(id, template);
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete template
  async deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        this.cache.delete(id);
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get template categories
  async getCategories(): Promise<TemplateCategory[]> {
    if (this.categoriesCache) {
      return this.categoriesCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/template-categories`);
      
      if (response.ok) {
        const categories = await response.json();
        this.categoriesCache = categories;
        return categories;
      } else {
        console.warn('Failed to fetch categories from API, using default categories');
        this.categoriesCache = DEFAULT_CATEGORIES;
        return DEFAULT_CATEGORIES;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      this.categoriesCache = DEFAULT_CATEGORIES;
      return DEFAULT_CATEGORIES;
    }
  }

  // Search templates with text query
  async searchTemplates(query: string, filters?: TemplateSearchFilters): Promise<TemplateSearchResult> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters?.isPremium !== undefined) params.append('isPremium', filters.isPremium.toString());
      if (filters?.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());

      const response = await fetch(`${this.baseUrl}/templates/search?${params.toString()}`);
      
      if (response.ok) {
        return await response.json();
      } else {
        console.warn('Failed to search templates from API, using local search');
        return this.searchSampleTemplates(query, filters);
      }
    } catch (error) {
      console.error('Error searching templates:', error);
      return this.searchSampleTemplates(query, filters);
    }
  }

  // Get popular templates
  async getPopularTemplates(limit: number = 10): Promise<Template[]> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/popular?limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.templates || [];
      } else {
        console.warn('Failed to fetch popular templates from API, using sample data');
        return SAMPLE_TEMPLATES.slice(0, limit);
      }
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      return SAMPLE_TEMPLATES.slice(0, limit);
    }
  }

  // Get recent templates
  async getRecentTemplates(limit: number = 10): Promise<Template[]> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/recent?limit=${limit}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.templates || [];
      } else {
        console.warn('Failed to fetch recent templates from API, using sample data');
        return SAMPLE_TEMPLATES.slice(0, limit);
      }
    } catch (error) {
      console.error('Error fetching recent templates:', error);
      return SAMPLE_TEMPLATES.slice(0, limit);
    }
  }

  // Helper methods for sample data
  private getSampleTemplates(filters?: TemplateSearchFilters): TemplateSearchResult {
    console.log("🔍 TemplateService: getSampleTemplates called with filters:", filters);
    let templates = [...SAMPLE_TEMPLATES];
    console.log("🔍 TemplateService: Initial sample templates count:", templates.length);

    // Apply filters
    if (filters?.category) {
      templates = templates.filter(t => t.metadata.category === filters.category);
    }

    if (filters?.tags?.length) {
      templates = templates.filter(t => 
        filters.tags!.some(tag => t.metadata.tags.includes(tag))
      );
    }

    if (filters?.isPremium !== undefined) {
      templates = templates.filter(t => t.metadata.isPremium === filters.isPremium);
    }

    if (filters?.isPublic !== undefined) {
      templates = templates.filter(t => t.metadata.isPublic === filters.isPublic);
    }

    if (filters?.minRating) {
      templates = templates.filter(t => (t.metadata.rating || 0) >= filters.minRating!);
    }

    if (filters?.language) {
      templates = templates.filter(t => t.metadata.language === filters.language);
    }

    const result = {
      templates,
      total: templates.length,
      page: 1,
      pageSize: templates.length,
      hasMore: false
    };
    console.log("🔍 TemplateService: Final filtered templates count:", templates.length);
    console.log("🔍 TemplateService: First template sample:", templates[0]);
    return result;
  }

  private getSampleTemplate(id: string): Template | null {
    return SAMPLE_TEMPLATES.find(t => t.metadata.id === id) || null;
  }

  private searchSampleTemplates(query: string, filters?: TemplateSearchFilters): TemplateSearchResult {
    const searchResult = this.getSampleTemplates(filters);
    
    if (!query.trim()) {
      return searchResult;
    }

    const searchLower = query.toLowerCase();
    const filtered = searchResult.templates.filter(template => 
      template.metadata.title.toLowerCase().includes(searchLower) ||
      template.metadata.description?.toLowerCase().includes(searchLower) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );

    return {
      ...searchResult,
      templates: filtered,
      total: filtered.length
    };
  }

  private getCategoryByProductId(productId: string): string {
    // Map product IDs to template categories
    const productCategoryMap: Record<string, string> = {
      'std_bc_55x85mm_300gsm': 'business-cards',
      'std_flyer_a4_300gsm': 'flyers',
      'std_poster_a3_300gsm': 'posters',
      'std_brochure_a4_300gsm': 'brochures',
      'std_letterhead_a4_300gsm': 'letterheads',
      'std_envelope_c6_300gsm': 'envelopes',
      'std_sticker_50x50mm_300gsm': 'stickers',
      'std_banner_300x100mm_300gsm': 'banners',
    };

    return productCategoryMap[productId] || 'business-cards';
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.categoriesCache = null;
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const templateService = new TemplateService();

// Export utility functions
export function createTemplateFromKonvaData(konvaData: any, metadata: Partial<Template['metadata']>): Template {
  const now = new Date().toISOString();
  
  return {
    metadata: {
      id: metadata.id || `template_${Date.now()}`,
      title: metadata.title || 'Untitled Template',
      description: metadata.description || 'User created template',
      category: metadata.category || 'business-cards',
      tags: metadata.tags || ['user-created'],
      createdAt: metadata.createdAt || now,
      updatedAt: now,
      author: metadata.author || 'User',
      version: '1.0',
      isPremium: false,
      isPublic: false,
      language: 'en',
      ...metadata
    },
    layers: konvaData.layers || [],
    background: konvaData.background || { color: '#ffffff' },
    variables: {},
    aiConfig: {
      canGenerateText: true,
      canSuggestColors: true,
      canOptimizeLayout: true,
      canReplaceImages: true
    }
  };
}

export function extractTemplateVariables(template: Template): Record<string, any> {
  const variables: Record<string, any> = {};
  
  template.layers.forEach(layer => {
    if (layer.editableColor && layer.colorVariable) {
      variables[layer.colorVariable] = layer.fill || layer.color || '#000000';
    }
  });

  return variables;
}

export function applyTemplateVariables(template: Template, variables: Record<string, any>): Template {
  const updatedTemplate = JSON.parse(JSON.stringify(template)); // Deep clone
  
  updatedTemplate.layers.forEach((layer: any) => {
    if (layer.editableColor && layer.colorVariable && variables[layer.colorVariable]) {
      if (layer.type === 'text') {
        layer.color = variables[layer.colorVariable];
      } else {
        layer.fill = variables[layer.colorVariable];
      }
    }
  });

  return updatedTemplate;
}
