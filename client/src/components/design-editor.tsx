import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MousePointer, 
  Type, 
  Image as ImageIcon, 
  Sparkles,
  Save,
  Download,
  Lightbulb,
  Undo,
  Redo,
  Layers
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function DesignEditor() {
  const { t } = useI18n();
  const [selectedTool, setSelectedTool] = useState("select");
  const [fontSize, setFontSize] = useState([16]);
  const [selectedFont, setSelectedFont] = useState("Sarabun");

  const tools = [
    { id: "select", icon: MousePointer, label: "Select", testId: "tool-select" },
    { id: "text", icon: Type, label: "Text", testId: "tool-text" },
    { id: "image", icon: ImageIcon, label: "Image", testId: "tool-image" },
    { id: "ai", icon: Sparkles, label: "AI Magic", testId: "tool-ai" },
  ];

  const colorPalette = [
    "#3B82F6", // Primary blue
    "#8B5CF6", // Purple
    "#F97316", // Orange
    "#1F2937", // Dark gray
    "#EF4444", // Red
    "#10B981", // Green
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4" data-testid="design-editor-badge">
            <Sparkles className="w-4 h-4 mr-2" />
            Advanced Tools
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('designEditor.advancedTools')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('designEditor.dragDrop')}
          </p>
        </div>

        <Card className="shadow-2xl overflow-hidden rounded-3xl">
          {/* Editor Header */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <span className="text-white font-medium">SRC AI Designer</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm"
                className="bg-purple-500 text-white hover:bg-purple-600"
                data-testid="ai-assistant-button"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI Assistant
              </Button>
              <Button 
                size="sm"
                className="bg-primary text-white hover:bg-primary-600"
                data-testid="save-project-button"
              >
                <Save className="w-4 h-4 mr-1" />
                {t('designEditor.save')}
              </Button>
            </div>
          </div>

          <div className="flex">
            {/* Toolbar */}
            <div className="w-20 bg-gray-200 p-4 space-y-4">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  className="w-12 h-12 p-0"
                  onClick={() => setSelectedTool(tool.id)}
                  data-testid={tool.testId}
                  title={tool.label}
                >
                  <tool.icon className="w-5 h-5" />
                </Button>
              ))}
              
              {/* Action Buttons */}
              <div className="pt-4 border-t space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-12 h-12 p-0"
                  data-testid="undo-button"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-12 h-12 p-0"
                  data-testid="redo-button"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-white p-8 min-h-96">
              <div className="max-w-3xl mx-auto">
                {/* Canvas */}
                <Card className="shadow-lg mb-8">
                  <div 
                    className="bg-white rounded-lg p-8 mx-auto relative border-2 border-dashed border-gray-300 hover:border-primary transition-colors"
                    style={{ width: "400px", height: "240px" }}
                    data-testid="design-canvas"
                  >
                    <div className="absolute inset-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 gradient-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <div className="text-white text-xl">👤</div>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1" data-testid="canvas-title">จอห์น สมิธ</h3>
                        <p className="text-sm text-gray-600" data-testid="canvas-subtitle">นักพัฒนาซอฟต์แวร์</p>
                        <p className="text-xs text-gray-500 mt-2" data-testid="canvas-contact">
                          john@example.com | 081-234-5678
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline"
                    data-testid="add-text-button"
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Add Text
                  </Button>
                  <Button 
                    variant="outline"
                    data-testid="upload-image-button"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button 
                    variant="outline"
                    data-testid="generate-ai-button"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            <div className="w-80 bg-gray-50 p-6 space-y-6">
              {/* Font Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center">
                    <Type className="w-4 h-4 mr-2" />
                    Font Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                    <Select value={selectedFont} onValueChange={setSelectedFont}>
                      <SelectTrigger data-testid="font-family-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sarabun">Sarabun</SelectItem>
                        <SelectItem value="Prompt">Prompt</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Size: {fontSize[0]}px</label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={8}
                      max={48}
                      step={1}
                      data-testid="font-size-slider"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Colors */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center">
                    <div className="w-4 h-4 bg-primary rounded mr-2"></div>
                    Colors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {colorPalette.map((color, index) => (
                      <button
                        key={index}
                        className="w-12 h-12 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        data-testid={`color-option-${index}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    data-testid="color-picker-button"
                  >
                    Custom Color
                  </Button>
                </CardContent>
              </Card>

              {/* Layers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    Layers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-3 bg-white rounded border border-primary-200">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Background</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Type className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Text Layer</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Suggestions */}
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                    <h4 className="font-semibold text-purple-900 text-sm">{t('designEditor.aiTips')}</h4>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">{t('designEditor.aiTipText')}</p>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="text-purple-600 border-purple-300 hover:bg-purple-100"
                    data-testid="apply-ai-suggestion-button"
                  >
                    {t('designEditor.applyTip')}
                  </Button>
                </CardContent>
              </Card>

              {/* Export Actions */}
              <div className="space-y-3 pt-6 border-t">
                <Button 
                  className="w-full bg-primary hover:bg-primary-600"
                  data-testid="export-print-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export for Print
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  data-testid="save-draft-button"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
