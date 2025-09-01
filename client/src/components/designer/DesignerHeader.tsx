import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Undo, 
  Redo, 
  Save, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignVerticalJustifyCenter, 
  AlignHorizontalJustifyCenter,
  Sparkles,
  Palette,
  Lightbulb,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Product } from "@shared/prisma-schema";

interface DesignerHeaderProps {
  designName: string;
  setDesignName: (name: string) => void;
  undo: () => void;
  redo: () => void;
  handleSaveDesign: () => Promise<any>;
  alignObjects: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  generateColorPaletteMutation: any;
  generateDesignMutation: any;
  saveDesignMutation: any;
  user: any;
  currentProduct: Product;
  onTemplateClick: () => void;
}

export function DesignerHeader({
  designName,
  setDesignName,
  undo,
  redo,
  handleSaveDesign,
  alignObjects,
  generateColorPaletteMutation,
  generateDesignMutation,
  saveDesignMutation,
  user,
  currentProduct,
  onTemplateClick
}: DesignerHeaderProps) {
  const { toast } = useToast();
  const [aiPrompt, setAiPrompt] = useState("Professional business design");

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Design Name and Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="design-name" className="text-sm font-medium text-gray-700">
              Design Name:
            </Label>
            <Input
              id="design-name"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="w-48 text-sm"
              placeholder="Enter design name"
            />
          </div>
          <div className="text-sm text-gray-500">
            {currentProduct?.nameEn} • {(currentProduct?.specifications as any)?.size || 'Custom Size'}
          </div>
        </div>

        {/* Main Actions */}
        <div className="flex items-center space-x-2">
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              className="px-2"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              className="px-2"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          {/* Alignment Tools */}
          <div className="flex items-center space-x-1 border-l border-gray-300 pl-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignObjects('left')}
              className="px-2"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignObjects('center')}
              className="px-2"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignObjects('right')}
              className="px-2"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignObjects('top')}
              className="px-2"
              title="Align Top"
            >
              <AlignVerticalJustifyCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignObjects('middle')}
              className="px-2"
              title="Align Middle"
            >
              <AlignHorizontalJustifyCenter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignObjects('bottom')}
              className="px-2"
              title="Align Bottom"
            >
              <AlignVerticalJustifyCenter className="w-4 h-4 rotate-180" />
            </Button>
          </div>

          {/* Template Button */}
          <div className="flex items-center space-x-1 border-l border-gray-300 pl-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTemplateClick}
              className="px-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              title="Start with Template"
            >
              <FileText className="w-4 h-4" />
            </Button>
          </div>

          {/* AI Tools */}
          <div className="flex items-center space-x-1 border-l border-gray-300 pl-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const description = aiPrompt?.trim() || "Professional business";
                if (description.length < 3) {
                  toast({
                    title: "Description Too Short",
                    description: "Please enter a longer description for better color suggestions.",
                    variant: "destructive",
                  });
                  return;
                }
                
                console.log('🎨 Generating color palette with:', { description, industry: "General" });
                generateColorPaletteMutation.mutate({
                  description,
                  industry: "General"
                });
              }}
              disabled={generateColorPaletteMutation.isPending}
              className="px-2"
              title="Generate Smart Colors"
            >
              <Palette className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateDesignMutation.mutate(aiPrompt)}
              disabled={generateDesignMutation.isPending}
              className="px-2"
              title="Generate AI Design"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiPrompt("Create a professional " + currentProduct?.nameEn.toLowerCase() + " with modern design")}
              className="px-2"
              title="Quick Start"
            >
              <Lightbulb className="w-4 h-4" />
            </Button>
          </div>

          {/* Save Button */}
          <div className="border-l border-gray-300 pl-2">
            <Button
              onClick={handleSaveDesign}
              disabled={saveDesignMutation.isPending || !user}
              className="bg-primary hover:bg-primary-600"
              title="Save Design"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveDesignMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Prompt Input */}
      <div className="mt-3">
        <Input
          placeholder="Describe your design vision (e.g., Create a professional business card with modern typography)"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
}
