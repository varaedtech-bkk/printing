import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EditorStage from '@/components/designer/EditorStage';
import { CheckCircle, Settings, Menu, Type } from 'lucide-react';

interface CanvasContainerProps {
  canvasDimensions: { width: number; height: number };
  selectedElements: any[];
  zoom: number;
  showSidebar: boolean;
  showPropertiesPanel: boolean;
  selectedProduct: any;
  selectedTool: string;
  onSidebarToggle: () => void;
  onPropertiesToggle: () => void;
  onStateChange: (state: any) => void;
  onElementSelect: (element: any) => void;
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: (shape: "rectangle" | "circle" | "ellipse" | "triangle") => void;
  editorRef: React.RefObject<any>;
}

export function CanvasContainer({
  canvasDimensions,
  selectedElements,
  zoom,
  showSidebar,
  showPropertiesPanel,
  selectedProduct,
  selectedTool,
  onSidebarToggle,
  onPropertiesToggle,
  onStateChange,
  onElementSelect,
  onAddText,
  onAddImage,
  onAddShape,
  editorRef,
}: CanvasContainerProps) {
  return (
    <div className="flex-1 relative bg-gray-100 overflow-hidden min-w-0">
      {/* Top Toolbar Area - Reserved space */}
      <div className="absolute top-0 left-0 right-0 h-12 md:h-16 bg-transparent z-40 pointer-events-none">
        <div className="h-full flex items-center justify-between px-2 md:px-4">
          {/* Left side - Sidebar toggle */}
          {!showSidebar && (
            <div className="hidden md:block pointer-events-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onSidebarToggle}
                className="bg-white shadow-lg"
                title="Show Products"
              >
                <Menu className="w-4 h-4 mr-2" />
                Show Products
              </Button>
            </div>
          )}

          {/* Right side - Selection info and Properties toggle */}
          <div className="flex items-center space-x-2">
            {selectedElements.length > 0 && (
              <div className="pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedElements.length} selected
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Properties Panel Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={onPropertiesToggle}
              className="bg-white shadow-lg"
              title={showPropertiesPanel ? "Hide Properties" : "Show Properties"}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showPropertiesPanel ? "Hide" : "Properties"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 overflow-hidden bg-gray-100 pt-16 md:pt-20">
        <div className="w-full h-full">
          <EditorStage
            ref={editorRef}
            widthMm={canvasDimensions.width}
            heightMm={canvasDimensions.height}
            onStateChange={onStateChange}
            onElementSelect={onElementSelect}
          />

          {/* Fallback text input when text tool is selected */}
          {selectedTool === "text" && (
            <div className="fixed top-20 md:top-24 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 md:p-3 border z-20 max-w-[90%] md:max-w-none">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Type your text here..."
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const text = e.currentTarget.value.trim();
                      if (text) {
                        if (editorRef.current?.addText) {
                          editorRef.current.addText(text);
                        }
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Type your text here..."]') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      const text = input.value.trim();
                      if (editorRef.current?.addText) {
                        editorRef.current.addText(text);
                      }
                      input.value = '';
                    }
                  }}
                  className="px-3 py-1 text-xs"
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to place text on canvas</p>
            </div>
          )}

          {/* Canvas Info Overlay */}
          <div className="fixed bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 md:p-3 shadow-sm z-10">
            <div className="text-xs md:text-xs text-gray-600 space-y-0.5">
              <div className="flex items-center space-x-2 md:space-x-1">
                <span className="hidden md:inline">Size:</span>
                <span className="md:hidden">📐</span>
                <span className="font-medium">
                  {selectedProduct?.dimensions ? `${selectedProduct.dimensions.width}×${selectedProduct.dimensions.height}mm` : `${canvasDimensions.width}×${canvasDimensions.height}mm`}
                </span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-1">
                <span className="hidden md:inline">Elements:</span>
                <span className="md:hidden">🎨</span>
                <span className="font-medium">{selectedElements.length}</span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-1">
                <span className="hidden md:inline">Zoom:</span>
                <span className="md:hidden">🔍</span>
                <span className="font-medium">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
