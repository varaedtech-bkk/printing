import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Type,
  Palette,
  Layout,
  Image as ImageIcon,
  Wand2,
  Loader2
} from 'lucide-react';
import { AITextSuggestion, AIColorPalette, AILayoutSuggestion, AIImageSuggestion } from '@/lib/ai-service';

// Import new AI components
import { useToast } from '@/hooks/use-toast';

// Import new AI components
import { AITextTab } from './ai/AITextTab';
import { AIColorsTab } from './ai/AIColorsTab';
import { AILayoutTab } from './ai/AILayoutTab';
import { AIImagesTab } from './ai/AIImagesTab';
import { AIContextSettings } from './ai/AIContextSettings';

interface AIEnhancedToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  editorRef: any;
  selectedElementData: any;
  onElementUpdate?: (elementData: any) => void;
  
  // Mutations
  generateImageMutation: any;
  removeBackgroundMutation: any;
  generateTextMutation: any;
  generateColorPaletteMutation: any;
  beautifyDesignMutation: any;
  generateLayoutSuggestionsMutation: any;
  generateImageSuggestionsMutation: any;
}

export function AIEnhancedToolsPanel({
  isOpen,
  onClose,
  editorRef,
  selectedElementData,
  onElementUpdate,
  
  // Mutations
  generateImageMutation,
  removeBackgroundMutation,
  generateTextMutation,
  generateColorPaletteMutation,
  beautifyDesignMutation,
  generateLayoutSuggestionsMutation,
  generateImageSuggestionsMutation,
}: AIEnhancedToolsPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'text' | 'colors' | 'layout' | 'images'>('text');
  
  // AI suggestions state - This will be replaced by mutation data
  const [textSuggestions, setTextSuggestions] = useState<AITextSuggestion[]>([]);
  const [colorPalettes, setColorPalettes] = useState<AIColorPalette[]>([]);
  const [layoutSuggestions, setLayoutSuggestions] = useState<AILayoutSuggestion[]>([]);
  const [imageSuggestions, setImageSuggestions] = useState<AIImageSuggestion[]>([]);
  
  // Generation context
  const [productType, setProductType] = useState('Business Card');
  const [industry, setIndustry] = useState('');
  const [style, setStyle] = useState('modern');

  // Generate text suggestions
  const generateTextSuggestions = useCallback(async () => {
    if (!selectedElementData || selectedElementData.type !== 'text') {
      toast({
        title: "No text selected",
        description: "Please select a text element to generate suggestions",
        variant: "destructive"
      });
      return;
    }

    generateTextMutation?.mutate({
      elementId: selectedElementData.id,
      content: selectedElementData.content || '',
      productType,
      industry: industry || undefined,
      style: style || undefined
    });
  }, [selectedElementData, productType, industry, style, toast, generateTextMutation]);

  // Generate color suggestions
  const generateColorSuggestions = useCallback(async () => {
    const currentColors = selectedElementData ? [selectedElementData.style?.color || selectedElementData.style?.fill] : [];
    generateColorPaletteMutation?.mutate({
      currentColors: currentColors.filter(Boolean),
      productType,
      style: style || undefined,
      industry: industry || undefined
    });
  }, [selectedElementData, productType, industry, style, generateColorPaletteMutation]);

  // Generate layout suggestions
  const generateLayoutSuggestions = useCallback(async () => {
    const currentTemplate = editorRef?.current?.getCurrentTemplate();
    if (currentTemplate) {
      generateLayoutSuggestionsMutation?.mutate(currentTemplate);
    } else {
      toast({
        title: "No template loaded",
        description: "Please load a template first to generate layout suggestions",
        variant: "destructive"
      });
    }
  }, [editorRef, toast, generateLayoutSuggestionsMutation]);

  // Generate image suggestions
  const generateImageSuggestions = useCallback(async () => {
    if (!selectedElementData || selectedElementData.type !== 'image') {
      toast({
        title: "No image selected",
        description: "Please select an image element to generate suggestions",
        variant: "destructive"
      });
      return;
    }

    generateImageSuggestionsMutation?.mutate({
      element: selectedElementData,
      productType,
      style: style || undefined,
      industry: industry || undefined,
      keywords: [productType, style, industry].filter(Boolean)
    });
  }, [selectedElementData, productType, industry, style, generateImageSuggestionsMutation]);

  // Apply text suggestion
  const applyTextSuggestion = useCallback((suggestion: AITextSuggestion) => {
    if (editorRef?.current?.updateTextContent) {
      const success = editorRef.current.updateTextContent(suggestion.text);
      if (success) {
        toast({
          title: "Text updated",
          description: "Text content has been updated with AI suggestion"
        });
        onElementUpdate?.(selectedElementData);
      }
    }
  }, [editorRef, toast, onElementUpdate, selectedElementData]);

  // Apply color palette
  const applyColorPalette = useCallback((palette: AIColorPalette) => {
    if (selectedElementData) {
      if (selectedElementData.type === 'text' && editorRef?.current?.updateColor) {
        editorRef.current.updateColor(palette.text);
      } else if (selectedElementData.type !== 'text' && editorRef?.current?.updateShapeFillColor) {
        editorRef.current.updateShapeFillColor(palette.primary);
      }
      
      toast({
        title: "Colors applied",
        description: `Applied ${palette.name} color palette`
      });
      onElementUpdate?.(selectedElementData);
    }
  }, [selectedElementData, editorRef, toast, onElementUpdate]);

  // Apply layout suggestion
  const applyLayoutSuggestion = useCallback((suggestion: AILayoutSuggestion) => {
    if (editorRef?.current?.loadTemplate) {
      // This would require more complex implementation to apply individual changes
      toast({
        title: "Layout suggestion",
        description: suggestion.description
      });
    }
  }, [editorRef, toast]);

  // Beautify with AI
  const beautifyWithAI = useCallback(async () => {
    beautifyDesignMutation?.mutate();
  }, [beautifyDesignMutation]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Context Settings */}
        <AIContextSettings
          productType={productType}
          setProductType={setProductType}
          style={style}
          setStyle={setStyle}
          industry={industry}
          setIndustry={setIndustry}
        />

        <Separator />

        {/* AI Tools Tabs */}
              <div className="space-y-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
            <Button
              variant={activeTab === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('text')}
              className="flex-1 h-8 text-xs"
            >
              <Type className="w-3 h-3 mr-1" />
              Text
            </Button>
            <Button
              variant={activeTab === 'colors' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('colors')}
              className="flex-1 h-8 text-xs"
            >
              <Palette className="w-3 h-3 mr-1" />
              Colors
            </Button>
                      <Button
              variant={activeTab === 'layout' ? 'default' : 'ghost'}
                        size="sm"
              onClick={() => setActiveTab('layout')}
              className="flex-1 h-8 text-xs"
                      >
              <Layout className="w-3 h-3 mr-1" />
              Layout
                      </Button>
                      <Button
              variant={activeTab === 'images' ? 'default' : 'ghost'}
                        size="sm"
              onClick={() => setActiveTab('images')}
              className="flex-1 h-8 text-xs"
                      >
              <ImageIcon className="w-3 h-3 mr-1" />
              Images
                      </Button>
                </div>

          {/* Text Suggestions */}
          {activeTab === 'text' && (
            <AITextTab
              isLoading={generateTextMutation?.isLoading || false}
              textSuggestions={[]} // TODO: Get from mutation data
              onGenerateText={generateTextSuggestions}
              onApplyTextSuggestion={applyTextSuggestion}
              canGenerate={!!selectedElementData && selectedElementData.type === 'text'}
            />
          )}

          {/* Color Suggestions */}
          {activeTab === 'colors' && (
            <AIColorsTab
              isLoading={generateColorPaletteMutation?.isLoading || false}
              colorPalettes={[]} // TODO: Get from mutation data
              onGenerateColors={generateColorSuggestions}
              onApplyColorPalette={applyColorPalette}
            />
          )}

          {/* Layout Suggestions */}
          {activeTab === 'layout' && (
            <AILayoutTab
              isLoading={generateLayoutSuggestionsMutation?.isLoading || false}
              layoutSuggestions={[]} // TODO: Get from mutation data
              onGenerateLayout={generateLayoutSuggestions}
              onApplyLayoutSuggestion={applyLayoutSuggestion}
            />
          )}

          {/* Image Suggestions */}
          {activeTab === 'images' && (
            <AIImagesTab
              isLoading={generateImageSuggestionsMutation?.isLoading || false}
              imageSuggestions={[]} // TODO: Get from mutation data
              onGenerateImages={generateImageSuggestions}
              canGenerate={!!selectedElementData && selectedElementData.type === 'image'}
            />
          )}
                  </div>

        <Separator />

        {/* Global AI Actions */}
        <div className="space-y-2">
                  <Button
            onClick={beautifyWithAI}
            disabled={beautifyDesignMutation?.isLoading || false}
            className="w-full h-8 text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {beautifyDesignMutation?.isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Beautifying...
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-2" />
                Beautify with AI
              </>
            )}
                  </Button>
          
          <div className="text-xs text-gray-600 text-center">
            AI suggestions are generated based on your context and design best practices
                </div>
              </div>
      </CardContent>
    </Card>
  );
}