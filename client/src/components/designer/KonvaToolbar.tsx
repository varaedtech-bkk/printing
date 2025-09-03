import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Square,
  Circle,
  Triangle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Download,
  Save,
  Undo,
  Redo,
  Trash2,
  Copy,
  Eye,
  Grid,
  Sparkles,
  Palette,
  MousePointer2
} from 'lucide-react';

interface KonvaToolbarProps {
  selectedTool: string;
  onToolChange: (tool: string) => void;
  onAddText: () => void;
  onAddShape: (shapeType: 'rectangle' | 'circle' | 'ellipse' | 'triangle') => void;
  onAddImage: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAlign: (alignment: string) => void;
  onExport: () => void;
  onSave: () => void;
  onToggleGuides: () => void;
  onToggleGrid: () => void;
  onGenerateColors: () => void;
  onAIAssistant: () => void;
  selectedElements: any[];
  canUndo: boolean;
  canRedo: boolean;
  showGuides: boolean;
  showGrid: boolean;
  className?: string;
}

export function KonvaToolbar({
  selectedTool,
  onToolChange,
  onAddText,
  onAddShape,
  onAddImage,
  onDeleteSelected,
  onDuplicateSelected,
  onUndo,
  onRedo,
  onAlign,
  onExport,
  onSave,
  onToggleGuides,
  onToggleGrid,
  onGenerateColors,
  onAIAssistant,
  selectedElements,
  canUndo,
  canRedo,
  showGuides,
  showGrid,
  className = ''
}: KonvaToolbarProps) {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);

  const hasSelection = selectedElements.length > 0;

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select', description: 'Select and move elements' },
    { id: 'text', icon: 'T', label: 'Text', description: 'Add text elements' },
    { id: 'shape', icon: '⬜', label: 'Shapes', description: 'Add geometric shapes' },
    { id: 'image', icon: '🖼️', label: 'Image', description: 'Add images' },
    { id: 'ai', icon: '✨', label: 'AI Tools', description: 'AI-powered design tools' }
  ];

  const shapes = [
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'ellipse', icon: Circle, label: 'Ellipse' },
    { type: 'triangle', icon: Triangle, label: 'Triangle' }
  ];

  const alignments = [
    { type: 'left', icon: AlignLeft, label: 'Align Left' },
    { type: 'center', icon: AlignCenter, label: 'Align Center' },
    { type: 'right', icon: AlignRight, label: 'Align Right' }
  ];

  return (
    <div className={`bg-white border-b shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-2 lg:px-4 py-2 gap-2">
        {/* Left side - Tools */}
        <div className="flex items-center gap-1 lg:gap-2 overflow-x-auto">
          {/* Tool Selection */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={`px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedTool === tool.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title={tool.description}
              >
                <tool.icon className="w-4 h-4" />
                <span className="ml-1 lg:ml-2 hidden sm:inline">{tool.label}</span>
              </button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddText}
              className="h-8 px-2 lg:px-3"
              title="Add Text"
            >
              <span className="text-sm font-bold">T</span>
              <span className="ml-1 hidden lg:inline">Text</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 lg:px-3"
                  title="Add Shape"
                >
                  <Square className="w-4 h-4" />
                  <span className="ml-1 hidden lg:inline">Shape</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {shapes.map((shape) => (
                  <DropdownMenuItem
                    key={shape.type}
                    onClick={() => onAddShape(shape.type as any)}
                  >
                    <shape.icon className="w-4 h-4 mr-2" />
                    {shape.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={onAddImage}
              className="h-8 px-2 lg:px-3"
              title="Add Image"
            >
              <span className="text-lg">🖼️</span>
              <span className="ml-1 hidden lg:inline">Image</span>
            </Button>
          </div>
        </div>

        {/* Center - Object Actions */}
        <div className="flex items-center gap-1 hidden md:flex">
          <Separator orientation="vertical" className="h-8" />

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 px-2"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 px-2"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-8" />

            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicateSelected}
              disabled={!hasSelection}
              className="h-8 px-2"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              className="h-8 px-2 text-red-600 hover:text-red-700"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-8" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasSelection}
                  className="h-8 px-2"
                  title="Align"
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {alignments.map((alignment) => (
                  <DropdownMenuItem
                    key={alignment.type}
                    onClick={() => onAlign(alignment.type)}
                  >
                    <alignment.icon className="w-4 h-4 mr-2" />
                    {alignment.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right side - View & Export */}
        <div className="flex items-center gap-1">
          <Separator orientation="vertical" className="h-8 hidden md:block" />

          <div className="flex items-center gap-1">
            <Button
              variant={showGuides ? "default" : "outline"}
              size="sm"
              onClick={onToggleGuides}
              className="h-8 px-2"
              title="Toggle Guides"
            >
              <Eye className="w-4 h-4" />
            </Button>

            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={onToggleGrid}
              className="h-8 px-2"
              title="Toggle Grid"
            >
              <Grid className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-8" />

            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateColors}
              className="h-8 px-2"
              title="Generate Colors"
            >
              <Palette className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onAIAssistant}
              className="h-8 px-2"
              title="AI Assistant"
            >
              <Sparkles className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-8" />

            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="h-8 px-2"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8 px-2"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Actions Bar */}
      <div className="md:hidden border-t border-gray-200 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 px-2"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 px-2"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              className="h-8 px-2 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="h-8 px-2"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8 px-2"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
