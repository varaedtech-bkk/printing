import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Palette, Lightbulb, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIToolsPanelProps {
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  uploadedDesign: string | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadUploadedDesign: () => void;
  generateDesignMutation: any;
  generateColorPaletteMutation: any;
  currentProduct: any;
  fabricEditorRef: any;
  canvasDimensions: { width: number; height: number };
}

export function AIToolsPanel({
  aiPrompt,
  setAiPrompt,
  uploadedDesign,
  onFileUpload,
  onLoadUploadedDesign,
  generateDesignMutation,
  generateColorPaletteMutation,
  currentProduct,
  fabricEditorRef,
  canvasDimensions
}: AIToolsPanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const templates = [
    {
      name: "Business Card",
      icon: "👔",
      desc: "Professional layout",
      category: "Business",
      elements: ["Name", "Title", "Contact", "Logo"],
      aiPrompt: "Create a professional business card design with clean typography and modern layout"
    },
    {
      name: "Flyer",
      icon: "📄",
      desc: "Marketing material",
      category: "Marketing",
      elements: ["Headline", "Image", "Call-to-action", "Details"],
      aiPrompt: "Design an eye-catching marketing flyer with bold headlines and compelling visuals"
    },
    {
      name: "Poster",
      icon: "🎨",
      desc: "Large format",
      category: "Events",
      elements: ["Title", "Date", "Location", "Graphics"],
      aiPrompt: "Create a stunning event poster with vibrant colors and impactful messaging"
    },
    {
      name: "Banner",
      icon: "🏷️",
      desc: "Horizontal design",
      category: "Advertising",
      elements: ["Brand", "Message", "Visual", "CTA"],
      aiPrompt: "Design a horizontal banner with strong brand presence and clear call-to-action"
    },
    {
      name: "Menu",
      icon: "🍽️",
      desc: "Restaurant menu",
      category: "Food",
      elements: ["Logo", "Items", "Prices", "Description"],
      aiPrompt: "Create an appealing restaurant menu with elegant typography and food photography"
    },
    {
      name: "Certificate",
      icon: "🏆",
      desc: "Achievement design",
      category: "Official",
      elements: ["Title", "Name", "Date", "Signature"],
      aiPrompt: "Design a formal certificate with elegant borders and professional typography"
    },
    {
      name: "Invitation",
      icon: "💌",
      desc: "Event invitation",
      category: "Events",
      elements: ["Event", "Date", "Time", "RSVP"],
      aiPrompt: "Create a beautiful event invitation with decorative elements and clear details"
    },
    {
      name: "Logo",
      icon: "🎯",
      desc: "Brand identity",
      category: "Branding",
      elements: ["Symbol", "Text", "Colors", "Style"],
      aiPrompt: "Design a memorable logo with unique symbols and brand colors"
    }
  ];

  const loadTemplate = async (template: typeof templates[0]) => {
    if (!fabricEditorRef.current) {
      setLastError("Canvas editor not ready. Please wait for initialization.");
      return;
    }

    setIsLoadingTemplate(true);
    setLastError(null);

    try {
      // Clear the canvas first
      if (fabricEditorRef.current.clearCanvas) {
        fabricEditorRef.current.clearCanvas();
      }

      // Add a simple background rectangle
      if (fabricEditorRef.current.addShape) {
        fabricEditorRef.current.addShape('rectangle', {
          x: 0,
          y: 0,
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          color: '#f8f9fa'
        });
      }

      // Add template-specific elements based on type
      if (template.name === "Business Card" && fabricEditorRef.current.addText) {
        // Add business card elements
        fabricEditorRef.current.addText('YOUR NAME', {
          x: 20,
          y: 30,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#1a1a1a'
        });
        
        fabricEditorRef.current.addText('Job Title', {
          x: 20,
          y: 55,
          fontSize: 12,
          fontFamily: 'Arial',
          color: '#666666'
        });
        
        fabricEditorRef.current.addText('contact@company.com', {
          x: 20,
          y: 75,
          fontSize: 11,
          fontFamily: 'Arial',
          color: '#0066cc'
        });
      } else if (template.name === "Flyer" && fabricEditorRef.current.addText) {
        // Add flyer elements
        fabricEditorRef.current.addText('HEADLINE', {
          x: 50,
          y: 50,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#1a1a1a'
        });
        
        fabricEditorRef.current.addText('Your compelling message here', {
          x: 50,
          y: 100,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#333333'
        });
      }

      // Set AI prompt based on template
      if (template.aiPrompt) {
        setAiPrompt(template.aiPrompt);
      }

      toast({
        title: `${template.name} Template Loaded!`,
        description: `${template.desc} - Editable elements: ${template.elements.join(", ")}`,
      });

      setLastError(null);
    } catch (error) {
      console.error('Template loading error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load template';
      setLastError(`Template loading failed: ${errorMessage}`);
      
      toast({
        title: "Template Loading Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleAIGeneration = () => {
    if (!aiPrompt.trim()) {
      setLastError("Please enter a design description first.");
      return;
    }

    setLastError(null);
    try {
      generateDesignMutation.mutate(aiPrompt);
    } catch (error) {
      console.error('AI generation error:', error);
      setLastError(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleColorPaletteGeneration = () => {
    setLastError(null);
    try {
      generateColorPaletteMutation.mutate({
        description: aiPrompt || "Professional business",
        industry: "General"
      });
    } catch (error) {
      console.error('Color palette generation error:', error);
      setLastError(`Color palette generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test AI functionality
  const testAIFunctionality = () => {
    setLastError(null);
    
    // Check if mutations are available
    if (!generateDesignMutation || !generateColorPaletteMutation) {
      setLastError("AI mutations not available. Please check your configuration.");
      return;
    }

    // Check if we have a canvas reference
    if (!fabricEditorRef.current) {
      setLastError("Canvas editor not ready. Please wait for initialization.");
      return;
    }

    // Test basic functionality
    try {
      // Try to add a test text element
      if (fabricEditorRef.current.addText) {
        fabricEditorRef.current.addText('AI Test', {
          x: 100,
          y: 100,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#FF0000'
        });
        
        toast({
          title: "AI Test Successful",
          description: "Basic canvas functionality is working. AI features should be available.",
        });
        
        setLastError(null);
      } else {
        setLastError("Canvas text functionality not available.");
      }
    } catch (error) {
      console.error('AI test error:', error);
      setLastError(`AI test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-700">
          <Sparkles className="w-5 h-5 mr-2" />
          Design Tools & Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {lastError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{lastError}</AlertDescription>
          </Alert>
        )}

        {/* Template Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Choose a Template
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {templates.map((template) => (
              <Card
                key={template.name}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  isLoadingTemplate ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !isLoadingTemplate && loadTemplate(template)}
              >
                <CardContent className="p-3 text-center">
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.desc}</div>
                  <div className="text-xs text-blue-600 mt-1">{template.category}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          {isLoadingTemplate && (
            <div className="text-center text-sm text-gray-500 mt-2">
              Loading template...
            </div>
          )}
        </div>

        {/* AI-Powered Quick Start */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            AI Quick Start Suggestions
          </Label>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => setAiPrompt("Create a modern, professional business card with clean typography and subtle color accents")}
            >
              <div>
                <div className="font-medium text-sm">Modern Business Card</div>
                <div className="text-xs text-gray-500">Clean, professional design</div>
              </div>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => setAiPrompt("Design a vibrant marketing flyer with bold headlines, eye-catching colors, and clear call-to-action")}
            >
              <div>
                <div className="font-medium text-sm">Marketing Flyer</div>
                <div className="text-xs text-gray-500">Bold and attention-grabbing</div>
              </div>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => setAiPrompt("Create an elegant event poster with beautiful typography, date/time details, and decorative elements")}
            >
              <div>
                <div className="font-medium text-sm">Event Poster</div>
                <div className="text-xs text-gray-500">Elegant and informative</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Upload Design */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Or Upload Your Own Design
          </Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
              disabled={isLoadingTemplate}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Design
            </Button>
            {uploadedDesign && (
              <Button
                onClick={onLoadUploadedDesign}
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoadingTemplate}
              >
                Load Design
              </Button>
            )}
          </div>
          {uploadedDesign && (
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Design uploaded and ready to load
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={onFileUpload}
            className="hidden"
          />
        </div>

        {/* AI Generation */}
        <div>
          <Label htmlFor="ai-prompt">Describe Your Design Vision</Label>
          <Textarea
            id="ai-prompt"
            placeholder="e.g., Create a professional business card with modern typography and clean layout. Include company name and contact details."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            data-testid="ai-prompt-input"
            rows={3}
            disabled={isLoadingTemplate}
          />
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          <Button
            onClick={handleAIGeneration}
            disabled={generateDesignMutation.isPending || isLoadingTemplate || !aiPrompt.trim()}
            data-testid="generate-design-button"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {generateDesignMutation.isPending ? (
              "Generating..."
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleColorPaletteGeneration}
            disabled={generateColorPaletteMutation.isPending || isLoadingTemplate}
            data-testid="smart-colors-button"
          >
            {generateColorPaletteMutation.isPending ? (
              "Generating..."
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" />
                Smart Colors
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={testAIFunctionality}
            data-testid="test-ai-button"
            disabled={isLoadingTemplate}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Test AI
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              const prompt = `Create a professional ${currentProduct?.nameEn?.toLowerCase() || 'design'} with modern design`;
              setAiPrompt(prompt);
              setLastError(null);
            }}
            data-testid="quick-start-button"
            disabled={isLoadingTemplate}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Quick Start
          </Button>
        </div>

        {/* Status Messages */}
        {generateDesignMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Design generation failed: {generateDesignMutation.error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {generateColorPaletteMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Color palette generation failed: {generateColorPaletteMutation.error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {generateDesignMutation.isSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Design generated successfully! Check the canvas for your new design.
            </AlertDescription>
          </Alert>
        )}

        {generateColorPaletteMutation.isSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Color palette generated! Check the properties panel for color suggestions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
