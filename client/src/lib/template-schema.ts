// Template Schema and Types for Web2Print Editor
export interface TemplateLayer {
  id: string;
  type: 'text' | 'image' | 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'line' | 'group';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  
  // Text specific properties
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'line-through';
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  
  // Image specific properties
  src?: string;
  alt?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  isPlaceholder?: boolean;
  placeholderHint?: string;
  
  // Shape specific properties
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  radius?: number; // for circles
  radiusX?: number; // for ellipses
  radiusY?: number; // for ellipses
  sides?: number; // for polygons
  points?: number[]; // for custom shapes
  
  // Group specific properties
  children?: TemplateLayer[];
  
  // Template metadata
  userEditable?: boolean;
  fieldName?: string;
  lockFont?: boolean;
  lockPosition?: boolean;
  lockSize?: boolean;
  lockRotation?: boolean;
  editableColor?: boolean;
  colorVariable?: string;
  
  // AI enhancement properties
  aiSuggestions?: {
    textAlternatives?: string[];
    colorPalettes?: string[][];
    layoutSuggestions?: string[];
  };
}

export interface TemplateMetadata {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  baseProductId?: string;
  createdAt: string;
  updatedAt?: string;
  author?: string;
  version?: string;
  rating?: number;
  downloads?: number;
  isPremium?: boolean;
  isPublic?: boolean;
  language?: string;
  dimensions?: {
    width: number;
    height: number;
    unit: 'mm' | 'px' | 'in';
  };
}

export interface Template {
  metadata: TemplateMetadata;
  layers: TemplateLayer[];
  background?: {
    color?: string;
    image?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      stops: number[];
      angle?: number;
    };
  };
  variables?: {
    [key: string]: {
      type: 'color' | 'text' | 'number' | 'boolean';
      defaultValue: any;
      label: string;
      description?: string;
      options?: any[];
    };
  };
  aiConfig?: {
    canGenerateText?: boolean;
    canSuggestColors?: boolean;
    canOptimizeLayout?: boolean;
    canReplaceImages?: boolean;
    promptTemplates?: {
      textGeneration?: string;
      colorSuggestion?: string;
      layoutOptimization?: string;
    };
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface TemplateSearchFilters {
  category?: string;
  tags?: string[];
  isPremium?: boolean;
  isPublic?: boolean;
  language?: string;
  minRating?: number;
  dateRange?: {
    from: string;
    to: string;
  };
  dimensions?: {
    width?: { min?: number; max?: number };
    height?: { min?: number; max?: number };
  };
}

export interface TemplateSearchResult {
  templates: Template[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Template validation functions
export function validateTemplate(template: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!template.metadata) {
    errors.push('Template must have metadata');
  } else {
    if (!template.metadata.id) errors.push('Template metadata must have id');
    if (!template.metadata.title) errors.push('Template metadata must have title');
    if (!template.metadata.category) errors.push('Template metadata must have category');
  }
  
  if (!template.layers || !Array.isArray(template.layers)) {
    errors.push('Template must have layers array');
  } else {
    template.layers.forEach((layer: any, index: number) => {
      if (!layer.id) errors.push(`Layer ${index} must have id`);
      if (!layer.type) errors.push(`Layer ${index} must have type`);
      if (typeof layer.x !== 'number') errors.push(`Layer ${index} must have numeric x`);
      if (typeof layer.y !== 'number') errors.push(`Layer ${index} must have numeric y`);
      
      if (layer.type === 'text' && !layer.content) {
        errors.push(`Text layer ${index} must have content`);
      }
      if (layer.type === 'image' && !layer.src && !layer.isPlaceholder) {
        errors.push(`Image layer ${index} must have src or be marked as placeholder`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Template conversion functions
export function templateToKonvaData(template: Template): any {
  return {
    layers: template.layers.map(layer => ({
      id: layer.id,
      type: layer.type,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      rotation: layer.rotation || 0,
      scaleX: layer.scaleX || 1,
      scaleY: layer.scaleY || 1,
      opacity: layer.opacity || 1,
      visible: layer.visible !== false,
      
      // Text properties
      content: layer.content,
      fontSize: layer.fontSize,
      fontFamily: layer.fontFamily,
      fontWeight: layer.fontWeight,
      fontStyle: layer.fontStyle,
      textAlign: layer.textAlign,
      textDecoration: layer.textDecoration,
      color: layer.color,
      
      // Image properties
      src: layer.src,
      isPlaceholder: layer.isPlaceholder,
      placeholderHint: layer.placeholderHint,
      
      // Shape properties
      fill: layer.fill,
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth,
      radius: layer.radius,
      radiusX: layer.radiusX,
      radiusY: layer.radiusY,
      sides: layer.sides,
    }))
  };
}

export function konvaDataToTemplate(konvaData: any, metadata: TemplateMetadata): Template {
  return {
    metadata,
    layers: konvaData.layers.map((layer: any) => ({
      id: layer.id,
      type: layer.type,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      rotation: layer.rotation,
      scaleX: layer.scaleX,
      scaleY: layer.scaleY,
      opacity: layer.opacity,
      visible: layer.visible,
      
      // Text properties
      content: layer.content,
      fontSize: layer.fontSize,
      fontFamily: layer.fontFamily,
      fontWeight: layer.fontWeight,
      fontStyle: layer.fontStyle,
      textAlign: layer.textAlign,
      textDecoration: layer.textDecoration,
      color: layer.color,
      
      // Image properties
      src: layer.src,
      isPlaceholder: layer.isPlaceholder,
      placeholderHint: layer.placeholderHint,
      
      // Shape properties
      fill: layer.fill,
      stroke: layer.stroke,
      strokeWidth: layer.strokeWidth,
      radius: layer.radius,
      radiusX: layer.radiusX,
      radiusY: layer.radiusY,
      sides: layer.sides,
    }))
  };
}

// Default template categories
export const DEFAULT_CATEGORIES: TemplateCategory[] = [
  { id: 'business-cards', name: 'Business Cards', icon: '💼', color: '#3B82F6' },
  { id: 'flyers', name: 'Flyers', icon: '📄', color: '#10B981' },
  { id: 'posters', name: 'Posters', icon: '🎨', color: '#8B5CF6' },
  { id: 'brochures', name: 'Brochures', icon: '📋', color: '#F59E0B' },
  { id: 'letterheads', name: 'Letterheads', icon: '📝', color: '#EF4444' },
  { id: 'envelopes', name: 'Envelopes', icon: '✉️', color: '#6B7280' },
  { id: 'stickers', name: 'Stickers', icon: '🏷️', color: '#EC4899' },
  { id: 'banners', name: 'Banners', icon: '🚩', color: '#14B8A6' },
  { id: 'invitations', name: 'Invitations', icon: '🎫', color: '#F97316' },
  { id: 'certificates', name: 'Certificates', icon: '🏆', color: '#84CC16' },
];

// Sample templates with proper schema
export const SAMPLE_TEMPLATES: Template[] = [
  {
    metadata: {
      id: 'modern-business-card',
      title: 'Modern Blue Business Card',
      description: 'Professional business card with modern blue design and clean typography',
      category: 'business-cards',
      tags: ['modern', 'professional', 'blue', 'corporate', 'clean'],
      thumbnailUrl: '/api/placeholder/300/200',
      baseProductId: 'std_bc_55x85mm_300gsm',
      createdAt: new Date().toISOString(),
      author: 'Design Team',
      version: '1.0',
      rating: 4.8,
      downloads: 1250,
      isPremium: false,
      isPublic: true,
      language: 'en',
      dimensions: { width: 55, height: 85, unit: 'mm' }
    },
    layers: [
      {
        id: 'background',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 55,
        height: 85,
        fill: '#3498db',
        editableColor: true,
        colorVariable: 'primaryColor',
        userEditable: false,
        lockPosition: true,
        lockSize: true
      },
      {
        id: 'company_name',
        type: 'text',
        content: 'YOUR COMPANY NAME',
        x: 10,
        y: 15,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        userEditable: true,
        fieldName: 'Company Name',
        lockFont: true,
        lockPosition: false,
        lockSize: false
      },
      {
        id: 'person_name',
        type: 'text',
        content: 'YOUR NAME',
        x: 10,
        y: 35,
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        userEditable: true,
        fieldName: 'Full Name',
        lockFont: true,
        lockPosition: false,
        lockSize: false
      },
      {
        id: 'job_title',
        type: 'text',
        content: 'Job Title',
        x: 10,
        y: 55,
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#ffffff',
        textAlign: 'center',
        userEditable: true,
        fieldName: 'Job Title',
        lockFont: false,
        lockPosition: false,
        lockSize: false
      },
      {
        id: 'logo_placeholder',
        type: 'image',
        x: 20,
        y: 65,
        width: 15,
        height: 15,
        isPlaceholder: true,
        placeholderHint: 'Upload Your Logo',
        userEditable: true,
        lockPosition: false,
        lockSize: false
      }
    ],
    background: {
      color: '#3498db'
    },
    variables: {
      primaryColor: {
        type: 'color',
        defaultValue: '#3498db',
        label: 'Primary Color',
        description: 'Main brand color for the design'
      }
    },
    aiConfig: {
      canGenerateText: true,
      canSuggestColors: true,
      canOptimizeLayout: true,
      canReplaceImages: true,
      promptTemplates: {
        textGeneration: 'Generate professional business card text for a {jobTitle} at {companyName}',
        colorSuggestion: 'Suggest modern color palettes for a professional business card',
        layoutOptimization: 'Optimize the layout of this business card for better visual hierarchy'
      }
    }
  },
  {
    metadata: {
      id: 'elegant-white-business-card',
      title: 'Elegant White Business Card',
      description: 'Clean and elegant white business card with sophisticated typography',
      category: 'business-cards',
      tags: ['elegant', 'clean', 'white', 'minimalist', 'sophisticated'],
      thumbnailUrl: '/api/placeholder/300/200',
      baseProductId: 'std_bc_55x85mm_300gsm',
      createdAt: new Date().toISOString(),
      author: 'Design Team',
      version: '1.0',
      rating: 4.6,
      downloads: 980,
      isPremium: false,
      isPublic: true,
      language: 'en',
      dimensions: { width: 55, height: 85, unit: 'mm' }
    },
    layers: [
      {
        id: 'background',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 55,
        height: 85,
        fill: '#ffffff',
        stroke: '#e0e0e0',
        strokeWidth: 1,
        userEditable: false,
        lockPosition: true,
        lockSize: true
      },
      {
        id: 'accent_line',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 55,
        height: 3,
        fill: '#2c3e50',
        editableColor: true,
        colorVariable: 'accentColor',
        userEditable: false,
        lockPosition: true,
        lockSize: true
      },
      {
        id: 'person_name',
        type: 'text',
        content: 'YOUR NAME',
        x: 10,
        y: 20,
        fontSize: 20,
        fontFamily: 'Georgia',
        color: '#2c3e50',
        fontWeight: 'bold',
        textAlign: 'left',
        userEditable: true,
        fieldName: 'Full Name',
        lockFont: true,
        lockPosition: false,
        lockSize: false
      },
      {
        id: 'job_title',
        type: 'text',
        content: 'Professional Title',
        x: 10,
        y: 40,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#7f8c8d',
        textAlign: 'left',
        userEditable: true,
        fieldName: 'Job Title',
        lockFont: false,
        lockPosition: false,
        lockSize: false
      },
      {
        id: 'contact_info',
        type: 'text',
        content: 'email@company.com • +1 (555) 123-4567',
        x: 10,
        y: 60,
        fontSize: 12,
        fontFamily: 'Arial',
        color: '#34495e',
        textAlign: 'left',
        userEditable: true,
        fieldName: 'Contact Info',
        lockFont: false,
        lockPosition: false,
        lockSize: false
      }
    ],
    background: {
      color: '#ffffff'
    },
    variables: {
      accentColor: {
        type: 'color',
        defaultValue: '#2c3e50',
        label: 'Accent Color',
        description: 'Accent color for the design elements'
      }
    },
    aiConfig: {
      canGenerateText: true,
      canSuggestColors: true,
      canOptimizeLayout: true,
      canReplaceImages: false,
      promptTemplates: {
        textGeneration: 'Generate elegant business card text for a {jobTitle}',
        colorSuggestion: 'Suggest sophisticated color palettes for an elegant business card',
        layoutOptimization: 'Optimize the typography and spacing of this elegant business card'
      }
    }
  }
];
