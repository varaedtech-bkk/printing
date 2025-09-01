import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Sparkles, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Layout,
  Wand2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  Copy,
  Eye
} from 'lucide-react';
import { 
  aiFeatures,
  AITextRewriteRequest,
  AITextRewriteResult,
  AIImageGenerationRequest,
  AIImageGenerationResult,
  AILayoutSuggestion,
  AIDesignAnalysis
} from '@/lib/ai-enhanced-features';

interface AIEnhancedToolsPanelProps {
  selectedElement?: any;
  onTextUpdate?: (text: string) => void;
  onImageAdd?: (imageUrl: string) => void;
  onLayoutApply?: (suggestions: AILayoutSuggestion[]) => void;
  onColorPaletteApply?: (palette: any) => void;
  className?: string;
}

export function AIEnhancedToolsPanel({
  selectedElement,
  onTextUpdate,
  onImageAdd,
  onLayoutApply,
  onColorPaletteApply,
  className = ''
}: AIEnhancedToolsPanelProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);

  // Text Rewrite State
  const [textRewriteRequest, setTextRewriteRequest] = useState<AITextRewriteRequest>({
    originalText: '',
    tone: 'professional',
    length: 'same',
    language: 'en'
  });
  const [textRewriteResult, setTextRewriteResult] = useState<AITextRewriteResult | null>(null);

  // Image Generation State
  const [imageRequest, setImageRequest] = useState<AIImageGenerationRequest>({
    prompt: '',
    style: 'realistic',
    aspectRatio: '1:1',
    size: 'medium'
  });
  const [generatedImages, setGeneratedImages] = useState<AIImageGenerationResult[]>([]);

  // Layout Analysis State
  const [layoutSuggestions, setLayoutSuggestions] = useState<AILayoutSuggestion[]>([]);
  const [designAnalysis, setDesignAnalysis] = useState<AIDesignAnalysis | null>(null);

  // Color Palette State
  const [colorPalette, setColorPalette] = useState<any>(null);
  const [industry, setIndustry] = useState('general');
  const [mood, setMood] = useState('professional');

  // Handle text rewrite
  const handleTextRewrite = async () => {
    if (!textRewriteRequest.originalText.trim()) return;

    setIsLoading(true);
    try {
      const result = await aiFeatures.rewriteText(textRewriteRequest);
      setTextRewriteResult(result);
      setCurrentResult(result);
    } catch (error) {
      console.error('Text rewrite failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image generation
  const handleImageGeneration = async () => {
    if (!imageRequest.prompt.trim()) return;

    setIsLoading(true);
    try {
      const result = await aiFeatures.generateImage(imageRequest);
      setGeneratedImages(prev => [result, ...prev.slice(0, 4)]); // Keep last 5
      setCurrentResult(result);
    } catch (error) {
      console.error('Image generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle layout analysis
  const handleLayoutAnalysis = async () => {
    setIsLoading(true);
    try {
      // This would need the current design elements
      const elements: any[] = []; // Get from editor state
      const suggestions = await aiFeatures.analyzeLayout(elements, 'business-card');
      setLayoutSuggestions(suggestions);
      setCurrentResult({ suggestions });
    } catch (error) {
      console.error('Layout analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle color palette generation
  const handleColorPaletteGeneration = async () => {
    setIsLoading(true);
    try {
      const palette = await aiFeatures.generateSmartColorPalette(industry, mood);
      setColorPalette(palette);
      setCurrentResult(palette);
    } catch (error) {
      console.error('Color palette generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply text rewrite result
  const applyTextRewrite = (text: string) => {
    onTextUpdate?.(text);
    setTextRewriteResult(null);
  };

  // Apply generated image
  const applyGeneratedImage = (imageUrl: string) => {
    onImageAdd?.(imageUrl);
  };

  // Apply layout suggestions
  const applyLayoutSuggestions = () => {
    onLayoutApply?.(layoutSuggestions);
  };

  // Apply color palette
  const applyColorPalette = () => {
    onColorPaletteApply?.(colorPalette);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Design Assistant
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Type className="w-3 h-3" />
              Text
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Image
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-1">
              <Layout className="w-3 h-3" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Colors
            </TabsTrigger>
          </TabsList>

          {/* Text Rewrite Tab */}
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="original-text">Original Text</Label>
              <Textarea
                id="original-text"
                placeholder="Enter text to rewrite..."
                value={textRewriteRequest.originalText}
                onChange={(e) => setTextRewriteRequest(prev => ({
                  ...prev,
                  originalText: e.target.value
                }))}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={textRewriteRequest.tone}
                    onValueChange={(value) => setTextRewriteRequest(prev => ({
                      ...prev,
                      tone: value as any
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="length">Length</Label>
                  <Select
                    value={textRewriteRequest.length}
                    onValueChange={(value) => setTextRewriteRequest(prev => ({
                      ...prev,
                      length: value as any
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shorter">Shorter</SelectItem>
                      <SelectItem value="same">Same</SelectItem>
                      <SelectItem value="longer">Longer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleTextRewrite}
                disabled={isLoading || !textRewriteRequest.originalText.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Rewrite Text
              </Button>
            </div>

            {/* Text Rewrite Results */}
            {textRewriteResult && (
              <div className="space-y-3">
                <Separator />
                <div className="space-y-2">
                  <Label>Rewritten Text</Label>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm">{textRewriteResult.rewrittenText}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => applyTextRewrite(textRewriteResult.rewrittenText)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(textRewriteResult.rewrittenText)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                {textRewriteResult.alternatives.length > 0 && (
                  <div className="space-y-2">
                    <Label>Alternative Versions</Label>
                    <div className="space-y-2">
                      {textRewriteResult.alternatives.map((alt, index) => (
                        <div key={index} className="p-2 bg-gray-50 border rounded-lg">
                          <p className="text-sm">{alt}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applyTextRewrite(alt)}
                            >
                              Apply
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(alt)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Image Generation Tab */}
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="image-prompt">Describe the image you want</Label>
              <Textarea
                id="image-prompt"
                placeholder="e.g., A modern business logo with blue and white colors, minimalist design"
                value={imageRequest.prompt}
                onChange={(e) => setImageRequest(prev => ({
                  ...prev,
                  prompt: e.target.value
                }))}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="style">Style</Label>
                  <Select
                    value={imageRequest.style}
                    onValueChange={(value) => setImageRequest(prev => ({
                      ...prev,
                      style: value as any
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="illustration">Illustration</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                  <Select
                    value={imageRequest.aspectRatio}
                    onValueChange={(value) => setImageRequest(prev => ({
                      ...prev,
                      aspectRatio: value as any
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="4:3">Landscape (4:3)</SelectItem>
                      <SelectItem value="3:4">Portrait (3:4)</SelectItem>
                      <SelectItem value="16:9">Wide (16:9)</SelectItem>
                      <SelectItem value="9:16">Tall (9:16)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleImageGeneration}
                disabled={isLoading || !imageRequest.prompt.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Generate Image
              </Button>
            </div>

            {/* Generated Images */}
            {generatedImages.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <Label>Generated Images</Label>
                <div className="grid grid-cols-2 gap-3">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => applyGeneratedImage(image.imageUrl)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Use Image
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Layout Analysis Tab */}
          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                AI will analyze your current design and suggest improvements for layout, spacing, and visual hierarchy.
              </p>

              <Button
                onClick={handleLayoutAnalysis}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Analyze Layout
              </Button>
            </div>

            {/* Layout Suggestions */}
            {layoutSuggestions.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <Label>Layout Suggestions</Label>
                <div className="space-y-2">
                  {layoutSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{suggestion.description}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Confidence: {Math.round(suggestion.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={applyLayoutSuggestions}
                  className="w-full"
                  variant="outline"
                >
                  Apply All Suggestions
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Color Palette Tab */}
          <TabsContent value="colors" className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mood">Mood</Label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="soft">Soft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleColorPaletteGeneration}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Palette className="w-4 h-4 mr-2" />
                )}
                Generate Color Palette
              </Button>
            </div>

            {/* Color Palette Results */}
            {colorPalette && (
              <div className="space-y-3">
                <Separator />
                <Label>Generated Palette</Label>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Primary Colors</p>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: colorPalette.primary }}
                        title={colorPalette.primary}
                      />
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: colorPalette.secondary }}
                        title={colorPalette.secondary}
                      />
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: colorPalette.accent }}
                        title={colorPalette.accent}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Neutral Colors</p>
                    <div className="flex gap-2">
                      {colorPalette.neutral.map((color: string, index: number) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">{colorPalette.reasoning}</p>

                  <Button
                    onClick={applyColorPalette}
                    className="w-full"
                  >
                    Apply Palette
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
