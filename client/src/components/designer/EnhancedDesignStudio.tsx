import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Palette, 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Image as ImageIcon,
  Grid3X3,
  Brain,
  Sparkles,
  Wand2,
  Download,
  Save,
  Undo,
  Redo,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  X,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Star,
  Heart,
  TrendingUp,
  Users,
  Clock,
  Filter,
  Search,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';

interface EnhancedDesignStudioProps {
  selectedProduct: any;
  selectedElements: any[];
  canvasDimensions: { width: number; height: number };
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  editorRef: any;
  onDeleteSelected: () => void;
  onAddToCart: () => void;
  onSave: () => void;
  onTemplateGalleryOpen: () => void;
  onAIPanelOpen: () => void;
  onProductSelect: (product: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  showGuides: boolean;
  setShowGuides: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function EnhancedDesignStudio({
  selectedProduct,
  selectedElements,
  canvasDimensions,
  setCanvasDimensions,
  editorRef,
  onDeleteSelected,
  onAddToCart,
  onSave,
  onTemplateGalleryOpen,
  onAIPanelOpen,
  onProductSelect,
  activeTab,
  setActiveTab,
  showSidebar,
  setShowSidebar,
  zoom,
  setZoom,
  showGuides,
  setShowGuides,
  showGrid,
  setShowGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: EnhancedDesignStudioProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    canvas: true,
    tools: true,
    properties: true,
    layers: false,
    history: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader = ({ title, icon: Icon, isExpanded, onToggle, badge }: {
    title: string;
    icon: any;
    isExpanded: boolean;
    onToggle: () => void;
    badge?: string;
  }) => (
    <div 
      className="flex items-center justify-between p-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">{title}</span>
        {badge && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {badge}
          </Badge>
        )}
      </div>
      {isExpanded ? (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-500" />
      )}
    </div>
  );

  const ToolButton = ({ icon: Icon, label, onClick, isActive = false, variant = "outline" }: {
    icon: any;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  }) => (
    <Button
      variant={isActive ? "default" : variant}
      size="sm"
      onClick={onClick}
      className={`h-8 px-3 text-xs flex items-center space-x-1.5 ${
        isActive ? 'bg-blue-600 text-white' : ''
      }`}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </Button>
  );

  const PropertySlider = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = "" }: {
    label: string;
    value: number;
    onChange: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-600">{label}</Label>
        <span className="text-xs text-gray-900 font-medium">{value}{unit}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={onChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900">Design Studio</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(false)}
            className="h-7 w-7 p-0"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-6 px-2 text-xs"
            title="Undo"
          >
            <Undo className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-6 px-2 text-xs"
            title="Redo"
          >
            <Redo className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className="h-6 px-2 text-xs"
            title="Save"
          >
            <Save className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8 mx-3 mt-3">
            <TabsTrigger value="design" className="text-xs flex items-center space-x-1">
              <Palette className="w-3 h-3" />
              <span>Design</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs flex items-center space-x-1">
              <Grid3X3 className="w-3 h-3" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs flex items-center space-x-1">
              <Brain className="w-3 h-3" />
              <span>AI Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Design Tab */}
          <TabsContent value="design" className="mt-3 px-3 space-y-3">
            {/* Product Selection */}
            <Card>
              <SectionHeader
                title="Choose Product"
                icon={Settings}
                isExpanded={expandedSections.canvas}
                onToggle={() => toggleSection('canvas')}
                badge={selectedProduct ? selectedProduct.nameEn : 'None'}
              />
              {expandedSections.canvas && (
                <CardContent className="p-3 space-y-2">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {[
                      {
                        id: 'business-card',
                        nameEn: 'Business Card',
                        description: 'Standard business card size',
                        dimensions: { width: 360, height: 216 }, // 90mm x 54mm at 4px/mm
                        priceRange: '฿50-200'
                      },
                      {
                        id: 'postcard',
                        nameEn: 'Postcard',
                        description: 'Standard postcard size',
                        dimensions: { width: 592, height: 420 }, // 148mm x 105mm at 4px/mm
                        priceRange: '฿100-300'
                      },
                      {
                        id: 'a5-flyer',
                        nameEn: 'A5 Flyer',
                        description: 'Compact A5 size for flyers',
                        dimensions: { width: 592, height: 840 }, // 148mm x 210mm at 4px/mm
                        priceRange: '฿150-500'
                      },
                      {
                        id: 'a4-flyer',
                        nameEn: 'A4 Flyer',
                        description: 'Standard A4 size for detailed information',
                        dimensions: { width: 840, height: 1188 }, // 210mm x 297mm at 4px/mm
                        priceRange: '฿200-800'
                      },
                      {
                        id: 'a3-poster',
                        nameEn: 'A3 Poster',
                        description: 'Large format for impactful displays',
                        dimensions: { width: 1188, height: 1680 }, // 297mm x 420mm at 4px/mm
                        priceRange: '฿500-1500'
                      }
                    ].map((product) => (
                      <div
                        key={product.id}
                        className={`p-2 border rounded-lg cursor-pointer transition-all ${
                          selectedProduct?.id === product.id
                            ? "bg-blue-50 border-blue-500 shadow-sm"
                            : "hover:bg-gray-50 border-gray-200"
                        }`}
                        onClick={() => {
                          // Set the selected product and update canvas dimensions
                          const productData = {
                            ...product,
                            category: product.id.includes('card') ? 'business-cards' : 
                                     product.id.includes('flyer') ? 'flyers' : 'posters'
                          };
                          onProductSelect(productData);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-medium text-gray-900">
                              {product.nameEn}
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {product.dimensions.width}×{product.dimensions.height}mm
                              </span>
                              <span className="text-xs font-medium text-green-600">
                                {product.priceRange}
                              </span>
                            </div>
                          </div>
                          {selectedProduct?.id === product.id && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Quick Start Guide */}
            {!selectedProduct ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-blue-900 mb-1">Get Started</h3>
                      <p className="text-xs text-blue-700 mb-1">
                        Select a product type above to set your canvas size.
                      </p>
                      <div className="text-xs text-blue-600 space-y-0.5">
                        <p>• Choose from Business Cards, Flyers, or Posters</p>
                        <p>• Canvas will automatically resize</p>
                        <p>• Then use the tools below to add elements</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-green-900 mb-1">Ready to Design!</h3>
                      <p className="text-xs text-green-700 mb-1">
                        <strong>{selectedProduct.nameEn}</strong> ({selectedProduct.dimensions.width}×{selectedProduct.dimensions.height}mm)
                      </p>
                      <div className="text-xs text-green-600 space-y-0.5">
                        <p>• Use tools below to add elements</p>
                        <p>• Try Templates tab for quick designs</p>
                        <p>• Use AI Tools for smart suggestions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Canvas Settings */}
            <Card>
              <SectionHeader
                title="Canvas"
                icon={Settings}
                isExpanded={expandedSections.canvas}
                onToggle={() => toggleSection('canvas')}
                badge={`${canvasDimensions.width}×${canvasDimensions.height}`}
              />
              {expandedSections.canvas && (
                <CardContent className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Width</Label>
                      <Input
                        type="number"
                        value={canvasDimensions.width}
                        onChange={(e) => setCanvasDimensions({
                          ...canvasDimensions,
                          width: parseInt(e.target.value) || 400
                        })}
                        className="h-6 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Height</Label>
                      <Input
                        type="number"
                        value={canvasDimensions.height}
                        onChange={(e) => setCanvasDimensions({
                          ...canvasDimensions,
                          height: parseInt(e.target.value) || 300
                        })}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Zoom</Label>
                      <span className="text-xs text-gray-900 font-medium">{Math.round(zoom * 100)}%</span>
                    </div>
                    <Slider
                      value={[Math.round(zoom * 100)]}
                      onValueChange={(value) => setZoom(value[0] / 100)}
                      min={25}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-1">
                    <Button
                      variant={showGuides ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowGuides(!showGuides)}
                      className="h-6 px-2 text-xs flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Guides
                    </Button>
                    <Button
                      variant={showGrid ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowGrid(!showGrid)}
                      className="h-6 px-2 text-xs flex-1"
                    >
                      <Grid3X3 className="w-3 h-3 mr-1" />
                      Grid
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Design Tools */}
            <Card>
              <SectionHeader
                title="Tools"
                icon={Palette}
                isExpanded={expandedSections.tools}
                onToggle={() => toggleSection('tools')}
              />
              {expandedSections.tools && (
                <CardContent className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editorRef.current?.addText) {
                          const centerX = canvasDimensions.width / 2;
                          const centerY = canvasDimensions.height / 2;
                          editorRef.current.addText(centerX, centerY);
                        } else {
                          console.log('addText method not available');
                        }
                      }}
                      className="h-8 px-3 text-xs flex items-center justify-start space-x-2"
                      title="Add Text"
                    >
                      <Type className="w-4 h-4 flex-shrink-0" />
                      <span>Text</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editorRef.current?.addShape) {
                          const centerX = canvasDimensions.width / 2;
                          const centerY = canvasDimensions.height / 2;
                          editorRef.current.addShape('rectangle', centerX, centerY);
                        } else {
                          console.log('addShape method not available');
                        }
                      }}
                      className="h-8 px-3 text-xs flex items-center justify-start space-x-2"
                      title="Add Rectangle"
                    >
                      <Square className="w-4 h-4 flex-shrink-0" />
                      <span>Rectangle</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editorRef.current?.addShape) {
                          const centerX = canvasDimensions.width / 2;
                          const centerY = canvasDimensions.height / 2;
                          editorRef.current.addShape('circle', centerX, centerY);
                        } else {
                          console.log('addShape method not available');
                        }
                      }}
                      className="h-8 px-3 text-xs flex items-center justify-start space-x-2"
                      title="Add Circle"
                    >
                      <Circle className="w-4 h-4 flex-shrink-0" />
                      <span>Circle</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editorRef.current?.addShape) {
                          const centerX = canvasDimensions.width / 2;
                          const centerY = canvasDimensions.height / 2;
                          editorRef.current.addShape('triangle', centerX, centerY);
                        } else {
                          console.log('addShape method not available');
                        }
                      }}
                      className="h-8 px-3 text-xs flex items-center justify-start space-x-2"
                      title="Add Triangle"
                    >
                      <Triangle className="w-4 h-4 flex-shrink-0" />
                      <span>Triangle</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file && editorRef.current?.addImage) {
                            const url = URL.createObjectURL(file);
                            const centerX = canvasDimensions.width / 2;
                            const centerY = canvasDimensions.height / 2;
                            editorRef.current.addImage(url, centerX, centerY);
                          } else {
                            console.log('addImage method not available');
                          }
                        };
                        input.click();
                      }}
                      className="h-8 px-3 text-xs flex items-center justify-start space-x-2"
                      title="Add Image"
                    >
                      <ImageIcon className="w-4 h-4 flex-shrink-0" />
                      <span>Image</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('More tools coming soon');
                      }}
                      className="h-8 px-3 text-xs flex items-center justify-start space-x-2"
                      title="More Tools"
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span>More</span>
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Quick Actions */}
            {selectedElements.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex space-x-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onDeleteSelected}
                      className="h-6 px-2 text-xs flex-1"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editorRef.current?.duplicateSelected?.()}
                      className="h-6 px-2 text-xs flex-1"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Duplicate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {selectedElements.length} element{selectedElements.length !== 1 ? 's' : ''} selected
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-3 px-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Template Library</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={onTemplateGalleryOpen}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 h-8"
                >
                  <Grid3X3 className="w-3.5 h-3.5 mr-2" />
                  Browse Templates
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-3">
                    Access our full template library with AI-powered generation
                  </p>
                  
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        // Load sample business card template
                        const sampleTemplate = {
                          metadata: {
                            id: 'sample-business-card',
                            title: 'Sample Business Card',
                            category: 'business-cards'
                          },
                          layers: [
                            {
                              type: 'text',
                              x: canvasDimensions.width / 2,
                              y: canvasDimensions.height / 2 - 30,
                              text: 'Your Company Name',
                              fontSize: Math.max(16, Math.min(canvasDimensions.width, canvasDimensions.height) * 0.08),
                              fill: '#1f2937',
                              fontFamily: 'Arial, sans-serif',
                              textAlign: 'center'
                            },
                            {
                              type: 'text',
                              x: canvasDimensions.width / 2,
                              y: canvasDimensions.height / 2 + 5,
                              text: 'Your Name',
                              fontSize: Math.max(14, Math.min(canvasDimensions.width, canvasDimensions.height) * 0.06),
                              fill: '#374151',
                              fontFamily: 'Arial, sans-serif',
                              textAlign: 'center'
                            },
                            {
                              type: 'text',
                              x: canvasDimensions.width / 2,
                              y: canvasDimensions.height / 2 + 35,
                              text: 'your.email@company.com',
                              fontSize: Math.max(10, Math.min(canvasDimensions.width, canvasDimensions.height) * 0.04),
                              fill: '#6b7280',
                              fontFamily: 'Arial, sans-serif',
                              textAlign: 'center'
                            }
                          ]
                        };
                        if (editorRef.current?.loadTemplate) {
                          editorRef.current.loadTemplate(sampleTemplate);
                        }
                      }}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Sample
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        // Create blank template
                        if (editorRef.current?.clearCanvas) {
                          editorRef.current.clearCanvas();
                        }
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Blank
                    </Button>
                  </div>
                  
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Tip:</strong> Select a product first, then add elements using the Design tools!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai" className="mt-3 px-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Brain className="w-3.5 h-3.5" />
                  <span>AI Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={onAIPanelOpen}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 h-8"
                >
                  <Brain className="w-3.5 h-3.5 mr-2" />
                  Open AI Tools
                </Button>
                
                <div className="space-y-3">
                  <div className="text-xs text-gray-500 mb-2">Quick AI Actions:</div>
                  
                  <div className="grid grid-cols-1 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs justify-start"
                      onClick={() => {
                        // AI text suggestion
                        const suggestions = [
                          "Professional & Modern",
                          "Creative & Bold",
                          "Elegant & Sophisticated",
                          "Clean & Minimal"
                        ];
                        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
                        const textNode = editorRef.current?.addText?.(100, 100);
                        if (textNode) {
                          textNode.text(randomSuggestion);
                          textNode.fontSize(20);
                          textNode.fill('#333333');
                        }
                      }}
                    >
                      <Wand2 className="w-3 h-3 mr-2" />
                      Suggest Text
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs justify-start"
                      onClick={() => {
                        // AI color suggestion
                        const colorPalettes = [
                          ['#3B82F6', '#1E40AF', '#1E3A8A'],
                          ['#10B981', '#059669', '#047857'],
                          ['#F59E0B', '#D97706', '#B45309'],
                          ['#EF4444', '#DC2626', '#B91C1C']
                        ];
                        const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
                        // Apply random color to selected element
                        if (selectedElements.length > 0) {
                          const randomColor = randomPalette[Math.floor(Math.random() * randomPalette.length)];
                          editorRef.current?.updateFill?.(randomColor);
                        }
                      }}
                    >
                      <Palette className="w-3 h-3 mr-2" />
                      Suggest Colors
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs justify-start"
                      onClick={() => {
                        // AI layout optimization
                        if (selectedElements.length > 1) {
                          // Simple auto-alignment
                          selectedElements.forEach((element, index) => {
                            const x = 50 + (index * 100);
                            const y = 50;
                            editorRef.current?.updatePosition?.(element.id, x, y);
                          });
                        }
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-2" />
                      Optimize Layout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <Button
            onClick={onAddToCart}
            disabled={!selectedProduct}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-8"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Add to Cart
          </Button>
          
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="h-7 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Export functionality
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  const link = document.createElement('a');
                  link.download = 'design.png';
                  link.href = canvas.toDataURL();
                  link.click();
                }
              }}
              className="h-7 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
