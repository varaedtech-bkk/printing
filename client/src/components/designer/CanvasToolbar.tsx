import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Canvas, IText } from 'fabric';
import { 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Image as ImageIcon,
  Trash2, 
  Copy,
  Group,
  Ungroup,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Save,
  Palette,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  Crop,
  FlipHorizontal,
  FlipVertical,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Maximize,
  Undo2,
  Redo2
} from "lucide-react";

interface CanvasToolbarProps {
  selectedTool: string;
  onToolChange: (tool: string) => void;
  onAddText: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onGroupObjects: () => void;
  onUngroupObjects: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onUploadImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
  onSaveDesign: () => void;
  onAIAssistant: () => void;
  onSmartColors: () => void;
  onQuickStart: () => void;
  isCanvasLoading: boolean;
  canvasInitialized: boolean;
  saveDesignMutation: any;
  user: any;
  currentProduct: any;
  fabricEditorRef: any;
  forceRefreshCanvas?: () => void;
}

export function CanvasToolbar({
  selectedTool,
  onToolChange,
  onAddText,
  onDeleteSelected,
  onDuplicateSelected,
  onGroupObjects,
  onUngroupObjects,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUploadImage,
  onUndo,
  onRedo,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  onSaveDesign,
  onAIAssistant,
  onSmartColors,
  onQuickStart,
  isCanvasLoading,
  canvasInitialized,
  saveDesignMutation,
  user,
  currentProduct,
  fabricEditorRef,
  forceRefreshCanvas
}: CanvasToolbarProps) {
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 80 }); // Start below navbar
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('button')) {
      return; // Don't drag if clicking on buttons
    }
    
    setIsDragging(true);
    const rect = toolbarRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep toolbar within viewport bounds
    const maxX = window.innerWidth - 400; // Approximate toolbar width
    const maxY = window.innerHeight - 100; // Approximate toolbar height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(60, Math.min(newY, maxY)) // Keep above bottom
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Center toolbar horizontally on mount
  useEffect(() => {
    const centerX = (window.innerWidth - 400) / 2; // Approximate toolbar width
    setPosition(prev => ({ ...prev, x: centerX }));
  }, []);
  const [showShapes, setShowShapes] = useState(false);

  const tools = [
    { id: "select", label: "Select", icon: Move, description: "Select and move objects" },
    { id: "text", label: "Text", icon: Type, description: "Add text elements", onClick: onAddText },
    { id: "shapes", label: "Shapes", icon: Square, description: "Add geometric shapes" },
    { id: "image", label: "Image", icon: ImageIcon, description: "Upload and add images", onClick: onUploadImage },
    { id: "ai", label: "AI Tools", icon: Sparkles, description: "AI-powered design tools" }
  ];

  return (
    <div 
      ref={toolbarRef}
      className="fixed z-[55] cursor-move select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Main Compact Toolbar */}
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-2">
        <div className="flex items-center space-x-1">
          
          {/* Drag Handle */}
          <div className="flex items-center bg-gray-200 rounded-lg p-1 mr-2">
            <div className="w-4 h-4 flex items-center justify-center text-gray-500">
              ⋮⋮
            </div>
            <span className="text-xs text-gray-500 ml-1 hidden sm:inline">Drag</span>
          </div>

          {/* Reset Position Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const centerX = (window.innerWidth - 400) / 2;
              setPosition({ x: centerX, y: 80 });
            }}
            className="h-6 px-2 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 mr-2"
            title="Reset Position"
          >
            📍
          </Button>

          {/* Essential Tools - Always Visible */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => { 
                  if (tool.onClick) {
                    tool.onClick();
                  } else {
                    onToolChange(tool.id);
                  }
                }}
                disabled={isCanvasLoading || !canvasInitialized}
                className="h-8 px-2 text-xs font-medium min-w-[40px]"
                title={tool.description}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Object Actions */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicateSelected}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onGroupObjects}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs"
              title="Group"
            >
              <Group className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onUngroupObjects}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs"
              title="Ungroup"
            >
              <Ungroup className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteSelected}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View Controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetZoom}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs"
              title="Reset Zoom"
            >
              <Maximize className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* AI & Save */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveDesign}
              disabled={isCanvasLoading || !canvasInitialized || saveDesignMutation.isPending}
              className="h-8 px-2 text-xs"
              title="Save Design"
            >
              <Save className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={onAIAssistant}
              disabled={isCanvasLoading || !canvasInitialized}
              className="h-8 px-2 text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              title="AI Assistant"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Advanced Tools Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            className="h-8 px-2 text-xs"
            title="Advanced Tools"
          >
            {showAdvancedTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Advanced Tools Panel - Collapsible */}
        {showAdvancedTools && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              
              {/* Alignment Tools */}
              <div className="flex items-center bg-gray-50 rounded-lg p-1">
                <span className="text-xs text-gray-500 mr-2 px-2">Align:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAlignLeft}
                  disabled={isCanvasLoading || !canvasInitialized}
                  className="h-7 px-2 text-xs"
                  title="Align Left"
                >
                  <AlignLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAlignCenter}
                  disabled={isCanvasLoading || !canvasInitialized}
                  className="h-7 px-2 text-xs"
                  title="Align Center"
                >
                  <AlignCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAlignRight}
                  disabled={isCanvasLoading || !canvasInitialized}
                  className="h-7 px-2 text-xs"
                  title="Align Right"
                >
                  <AlignRight className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAlignTop}
                  disabled={isCanvasLoading || !canvasInitialized}
                  className="h-7 px-2 text-xs"
                  title="Align Top"
                >
                  <AlignVerticalJustifyCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAlignMiddle}
                  disabled={isCanvasLoading || !canvasInitialized}
                  className="h-7 px-2 text-xs"
                  title="Align Middle"
                >
                  <AlignVerticalJustifyCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAlignBottom}
                  disabled={isCanvasLoading || !canvasInitialized}
                  className="h-7 px-2 text-xs"
                  title="Align Bottom"
                >
                  <AlignVerticalJustifyCenter className="w-3 h-3" />
                </Button>
              </div>

              {/* Smart Tools */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSmartColors}
                  disabled={isCanvasLoading || !canvasInitialized}
                  className="h-7 px-2 text-xs bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700"
                  title="Smart Colors"
                >
                  <Palette className="w-3 h-3 mr-1" />
                  Colors
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onQuickStart}
                  disabled={isCanvasLoading || !canvasInitialized}
                  className="h-7 px-2 text-xs bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700"
                  title="Quick Start"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Start
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Shapes Panel - Context Sensitive */}
        {selectedTool === "shapes" && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 px-2">Shapes:</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                title="Rectangle"
              >
                <Square className="w-3 h-3 mr-1" />
                Rect
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                title="Circle"
              >
                <Circle className="w-3 h-3 mr-1" />
                Circle
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                title="Triangle"
              >
                <Triangle className="w-3 h-3 mr-1" />
                Triangle
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Status Indicator */}
      <div className="mt-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md px-3 py-1">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            canvasInitialized ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {canvasInitialized ? "Ready" : "Loading..."}
          </span>
          {currentProduct && (
            <span className="truncate max-w-[120px]" title={currentProduct.nameEn}>
              {currentProduct.nameEn}
            </span>
          )}
          <span className="text-gray-400">|</span>
          <span>{tools.find(t => t.id === selectedTool)?.label || "Select"}</span>
        </div>
      </div>
    </div>
  );
}
