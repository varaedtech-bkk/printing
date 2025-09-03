import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid, List, Eye, Download, Star, Sparkles, Brain, Zap, X, Plus } from 'lucide-react';
import { Template, TemplateCategory } from '@/lib/template-schema';
import { templateService } from '@/lib/template-service';
import { aiService, createAITemplateRequest } from '@/lib/ai-service';

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
  currentProductId?: string;
}

// AI Template Generation Component
const AITemplateGenerator: React.FC<{
  onGenerate: (template: Template) => void;
  onClose: () => void;
  currentProductId?: string;
}> = ({ onGenerate, onClose, currentProductId }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [productType, setProductType] = useState('Business Card');
  const [keywords, setKeywords] = useState('');
  const [style, setStyle] = useState('modern');
  const [industry, setIndustry] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const request = createAITemplateRequest(
        productType,
        keywords.split(',').map(k => k.trim()).filter(k => k),
        {
          style: style as any,
          industry: industry || undefined,
          dimensions: currentProductId ? { width: 55, height: 85, unit: 'mm' } : undefined
        }
      );

      const response = await aiService.generateTemplate(request);
      onGenerate(response.template);
    } catch (error) {
      console.error('Failed to generate AI template:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Template Generator
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="productType">Product Type</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Business Card">Business Card</SelectItem>
                <SelectItem value="Flyer">Flyer</SelectItem>
                <SelectItem value="Poster">Poster</SelectItem>
                <SelectItem value="Brochure">Brochure</SelectItem>
                <SelectItem value="Letterhead">Letterhead</SelectItem>
                <SelectItem value="Banner">Banner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              placeholder="modern, professional, blue, corporate"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="style">Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="elegant">Elegant</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="industry">Industry (optional)</Label>
            <Input
              id="industry"
              placeholder="Technology, Healthcare, Finance..."
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function TemplateGallery({ onSelectTemplate, onClose, currentProductId }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Load templates and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load categories
        const categoriesData = await templateService.getCategories();
        setCategories(categoriesData);
        
        // Load templates
        const filters = {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          isPublic: true
        };
        
        const templatesResult = await templateService.fetchTemplates(filters);
        setTemplates(templatesResult.templates);
      } catch (error) {
        console.error('Failed to load template data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCategory]);

  // Filter templates based on search and category
  useEffect(() => {
    let filtered = templates || [];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by current product if specified
    if (currentProductId) {
      filtered = filtered.filter(template => 
        !template.metadata.baseProductId || template.metadata.baseProductId === currentProductId
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, currentProductId]);

  const handleTemplateSelect = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleAIGenerate = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  const getCategoryLabel = (category: string) => {
    const categoryData = categories.find(c => c.id === category);
    return categoryData?.name || category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find(c => c.id === category);
    if (categoryData?.color) {
      return `bg-${categoryData.color}-100 text-${categoryData.color}-800`;
    }
    
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
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Choose a Template</h2>
            <p className="text-gray-500 text-sm">Start with a professionally designed template or create one with AI</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAIGenerator(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 border-0"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Generate
            </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b bg-gray-50">
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
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
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

        {/* Quick Start Templates */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Start</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Blank Canvas Option */}
            <div
              className="bg-white rounded-lg p-3 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                // Clear canvas and start fresh
                onSelectTemplate(null as any);
                onClose();
              }}
            >
              <div className="aspect-[3/2] bg-gradient-to-br from-green-100 to-blue-100 rounded mb-2 flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xs font-medium text-gray-900">Blank Canvas</h4>
              <p className="text-xs text-gray-500">Start from scratch</p>
            </div>

            {filteredTemplates?.slice(0, 3).map((template) => (
              <div
                key={`quick-${template.metadata.id}`}
                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="aspect-[3/2] bg-gray-100 rounded mb-2 flex items-center justify-center">
                  {template.metadata.thumbnailUrl ? (
                    <img
                      src={template.metadata.thumbnailUrl}
                      alt={template.metadata.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-gray-400 text-center p-1">
                      <Eye className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-xs">Preview</p>
                    </div>
                  )}
                </div>
                <h4 className="text-xs font-medium text-gray-900 truncate">{template.metadata.title}</h4>
                <p className="text-xs text-gray-500 truncate">{template.metadata.category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading templates...</p>
            </div>
          ) : !filteredTemplates || filteredTemplates.length === 0 ? (
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
              {filteredTemplates?.map((template) => (
                <Card 
                  key={template.metadata.id} 
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-[3/2] bg-gray-100 rounded-t-lg flex items-center justify-center">
                        {template.metadata.thumbnailUrl ? (
                          <img 
                            src={template.metadata.thumbnailUrl} 
                            alt={template.metadata.title}
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
                          <Badge className={getCategoryColor(template.metadata.category)}>
                            {getCategoryLabel(template.metadata.category)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {template.metadata.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-gray-600">{template.metadata.rating}</span>
                              </div>
                            )}
                            {template.metadata.isPremium && (
                              <Badge variant="outline" className="text-xs text-purple-600">
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {template.metadata.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {template.metadata.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.metadata.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.metadata.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.metadata.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        {template.metadata.downloads && (
                          <div className="text-xs text-gray-500 mt-2">
                            {template.metadata.downloads.toLocaleString()} downloads
                          </div>
                        )}
                      </CardContent>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-gray-100 rounded-l-lg flex items-center justify-center flex-shrink-0">
                        {template.metadata.thumbnailUrl ? (
                          <img 
                            src={template.metadata.thumbnailUrl} 
                            alt={template.metadata.title}
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
                              {template.metadata.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {template.metadata.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(template.metadata.category)}>
                              {getCategoryLabel(template.metadata.category)}
                            </Badge>
                            {template.metadata.isPremium && (
                              <Badge variant="outline" className="text-xs text-purple-600">
                                Premium
                          </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {template.metadata.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.metadata.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.metadata.tags.length - 2}
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
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredTemplates?.length || 0} template{(filteredTemplates?.length || 0) !== 1 ? 's' : ''} found
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

      {/* AI Template Generator Modal */}
      {showAIGenerator && (
        <AITemplateGenerator
          onGenerate={handleAIGenerate}
          onClose={() => setShowAIGenerator(false)}
          currentProductId={currentProductId}
        />
      )}
    </div>
  );
}
