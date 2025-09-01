import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid, List, Eye, Download, Star } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  baseProductId?: string;
  createdAt: string;
  templateData?: any; // Full template data for immediate loading
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
  currentProductId?: string;
}

const CATEGORIES = [
  'business-cards',
  'flyers',
  'posters',
  'brochures',
  'letterheads',
  'envelopes',
  'stickers',
  'banners'
];

const SAMPLE_TEMPLATES: Template[] = [
  {
    id: '1',
    title: 'Modern Blue Business Card',
    description: 'Professional business card with modern blue design',
    category: 'business-cards',
    tags: ['modern', 'professional', 'blue', 'corporate'],
    thumbnailUrl: '/api/placeholder/300/200',
    baseProductId: 'std_bc_55x85mm_300gsm',
    createdAt: new Date().toISOString(),
    templateData: {
      layers: [
        {
          id: 'background',
          type: 'rect',
          x: 0,
          y: 0,
          width: 55,
          height: 85,
          fill: '#3498db',
          editableColor: true,
          colorVariable: 'primaryColor'
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
          lockFont: true
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
          lockFont: true
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
          lockFont: false
        },
        {
          id: 'logo_placeholder',
          type: 'image',
          x: 20,
          y: 65,
          width: 15,
          height: 15,
          isPlaceholder: true,
          placeholderHint: 'Upload Your Logo'
        }
      ],
      background: '#3498db'
    }
  },
  {
    id: '2',
    title: 'Elegant White Business Card',
    description: 'Clean and elegant white business card design',
    category: 'business-cards',
    tags: ['elegant', 'clean', 'white', 'minimalist'],
    thumbnailUrl: '/api/placeholder/300/200',
    baseProductId: 'std_bc_55x85mm_300gsm',
    createdAt: new Date().toISOString(),
    templateData: {
      layers: [
        {
          id: 'background',
          type: 'rect',
          x: 0,
          y: 0,
          width: 55,
          height: 85,
          fill: '#ffffff',
          stroke: '#e0e0e0',
          strokeWidth: 1
        },
        {
          id: 'accent_line',
          type: 'rect',
          x: 0,
          y: 0,
          width: 55,
          height: 3,
          fill: '#2c3e50',
          editableColor: true,
          colorVariable: 'accentColor'
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
          lockFont: true
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
          lockFont: false
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
          lockFont: false
        }
      ],
      background: '#ffffff'
    }
  },
  {
    id: '3',
    title: 'Sale Flyer Template',
    description: 'Eye-catching sale flyer with bold design',
    category: 'flyers',
    tags: ['sale', 'bold', 'attention-grabbing', 'marketing'],
    thumbnailUrl: '/api/placeholder/300/200',
    baseProductId: 'std_flyer_a4_300gsm',
    createdAt: new Date().toISOString(),
    templateData: {
      layers: [
        {
          id: 'background',
          type: 'rect',
          x: 0,
          y: 0,
          width: 210,
          height: 297,
          fill: '#e74c3c',
          editableColor: true,
          colorVariable: 'primaryColor'
        },
        {
          id: 'sale_banner',
          type: 'rect',
          x: 20,
          y: 20,
          width: 170,
          height: 60,
          fill: '#ffffff',
          stroke: '#f39c12',
          strokeWidth: 3
        },
        {
          id: 'sale_text',
          type: 'text',
          content: 'MEGA SALE!',
          x: 105,
          y: 50,
          fontSize: 32,
          fontFamily: 'Arial',
          color: '#e74c3c',
          fontWeight: 'bold',
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Sale Title',
          lockFont: true
        },
        {
          id: 'description',
          type: 'text',
          content: 'Up to 70% OFF on selected items!',
          x: 105,
          y: 120,
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#ffffff',
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Sale Description',
          lockFont: false
        },
        {
          id: 'product_image',
          type: 'image',
          x: 60,
          y: 160,
          width: 90,
          height: 90,
          isPlaceholder: true,
          placeholderHint: 'Product Image'
        }
      ],
      background: '#e74c3c'
    }
  },
  {
    id: '4',
    title: 'Corporate Poster',
    description: 'Professional corporate poster template',
    category: 'posters',
    tags: ['corporate', 'professional', 'business', 'formal'],
    thumbnailUrl: '/api/placeholder/300/200',
    baseProductId: 'std_poster_a3_300gsm',
    createdAt: new Date().toISOString(),
    templateData: {
      layers: [
        {
          id: 'background',
          type: 'rect',
          x: 0,
          y: 0,
          width: 297,
          height: 420,
          fill: '#2c3e50',
          editableColor: true,
          colorVariable: 'primaryColor'
        },
        {
          id: 'header_bar',
          type: 'rect',
          x: 0,
          y: 0,
          width: 297,
          height: 80,
          fill: '#34495e'
        },
        {
          id: 'company_logo',
          type: 'image',
          x: 20,
          y: 20,
          width: 40,
          height: 40,
          isPlaceholder: true,
          placeholderHint: 'Company Logo'
        },
        {
          id: 'title',
          type: 'text',
          content: 'CORPORATE EVENT',
          x: 148.5,
          y: 120,
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#ffffff',
          fontWeight: 'bold',
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Event Title',
          lockFont: true
        },
        {
          id: 'subtitle',
          type: 'text',
          content: 'Professional Development Workshop',
          x: 148.5,
          y: 170,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#ecf0f1',
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Event Subtitle',
          lockFont: false
        },
        {
          id: 'date_time',
          type: 'text',
          content: 'Date: TBD • Time: TBD',
          x: 148.5,
          y: 220,
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#bdc3c7',
          textAlign: 'center',
          userEditable: true,
          fieldName: 'Date & Time',
          lockFont: false
        }
      ],
      background: '#2c3e50'
    }
  }
];

export function TemplateGallery({ onSelectTemplate, onClose, currentProductId }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>(SAMPLE_TEMPLATES);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(SAMPLE_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by current product if specified
    if (currentProductId) {
      filtered = filtered.filter(template => 
        !template.baseProductId || template.baseProductId === currentProductId
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, currentProductId]);

  // Load templates from API (when available)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTemplates(data.templates);
          }
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        // Keep using sample templates
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleTemplateSelect = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  const getCategoryLabel = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'business-cards': 'bg-blue-100 text-blue-800',
      'flyers': 'bg-green-100 text-green-800',
      'posters': 'bg-purple-100 text-purple-800',
      'brochures': 'bg-orange-100 text-orange-800',
      'letterheads': 'bg-gray-100 text-gray-800',
      'envelopes': 'bg-yellow-100 text-yellow-800',
      'stickers': 'bg-pink-100 text-pink-800',
      'banners': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
            <p className="text-gray-600 mt-1">Start with a professionally designed template</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search or category filters</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-[3/2] bg-gray-100 rounded-t-lg flex items-center justify-center">
                        {template.thumbnailUrl ? (
                          <img 
                            src={template.thumbnailUrl} 
                            alt={template.title}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="text-gray-400 text-center p-4">
                            <Eye className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Preview</p>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getCategoryColor(template.category)}>
                            {getCategoryLabel(template.category)}
                          </Badge>
                          <Star className="w-4 h-4 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {template.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-gray-100 rounded-l-lg flex items-center justify-center flex-shrink-0">
                        {template.thumbnailUrl ? (
                          <img 
                            src={template.thumbnailUrl} 
                            alt={template.title}
                            className="w-full h-full object-cover rounded-l-lg"
                          />
                        ) : (
                          <div className="text-gray-400 text-center p-2">
                            <Eye className="w-6 h-6 mx-auto mb-1" />
                            <p className="text-xs">Preview</p>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {template.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {template.description}
                            </p>
                          </div>
                          <Badge className={getCategoryColor(template.category)}>
                            {getCategoryLabel(template.category)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Import Custom Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
