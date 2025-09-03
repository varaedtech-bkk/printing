import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  Type,
  ImageIcon,
  Square,
  Bold,
  Italic,
  ShoppingCart,
  Download,
  Sparkles,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Circle,
  Triangle,
  Group,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Underline,
  Strikethrough,
  Check,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertiesPanelProps {
  selectedElementData: any;
  selectedColors: string[];
  canvasDimensions: { width: number; height: number };
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  editorRef: any; // Changed from fabricEditorRef to editorRef for Konva
  onDeleteSelected: () => void;
  onAddToCart: () => void;
  onDownloadPreview: () => void;
  generateColorPaletteMutation: any;
  validateForPrint: () => string[];
  exportForPrint: () => any;
  quantity: number;
  setQuantity: (quantity: number) => void;
  designName: string;
  setDesignName: (name: string) => void;
  onPropertyChange: (property: string, value: any) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  resizeCanvas?: (width: number, height: number) => boolean;
  forceRefreshCanvas?: () => void;
  createTestObject?: () => boolean;
}

// Property update status
interface UpdateStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function PropertiesPanel({
  selectedElementData,
  selectedColors,
  canvasDimensions,
  setCanvasDimensions,
  editorRef,
  onDeleteSelected,
  onAddToCart,
  onDownloadPreview,
  generateColorPaletteMutation,
  validateForPrint,
  exportForPrint,
  quantity,
  setQuantity,
  designName,
  setDesignName,
  onPropertyChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  resizeCanvas,
  forceRefreshCanvas,
  createTestObject
}: PropertiesPanelProps) {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("properties");
  const [layersUpdateTrigger, setLayersUpdateTrigger] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(canvasDimensions.width);
  const [canvasHeight, setCanvasHeight] = useState(canvasDimensions.height);

  // Draggable state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Constrain to viewport
      const maxX = window.innerWidth - 320; // Panel width
      const maxY = window.innerHeight - 200; // Minimum height

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Property update status tracking
  const [updateStatus, setUpdateStatus] = useState<Record<string, UpdateStatus>>({});

  // Update local state when canvasDimensions change
  useEffect(() => {
    setCanvasWidth(canvasDimensions.width);
    setCanvasHeight(canvasDimensions.height);
  }, [canvasDimensions]);

  // Reset update status when element changes
  useEffect(() => {
    setUpdateStatus({});
  }, [selectedElementData?.id]);

  // Debug logging for selectedElementData
  useEffect(() => {
    console.log('🔍 PropertiesPanel - selectedElementData changed:', selectedElementData);
    console.log('🔍 PropertiesPanel - full element data:', JSON.stringify(selectedElementData, null, 2));
    if (selectedElementData) {
      console.log('🔍 PropertiesPanel - selectedElementData details:', {
        type: selectedElementData.type,
        content: selectedElementData.content,
        style: selectedElementData.style,
        color: selectedElementData.style?.color,
        hasText: selectedElementData.content !== undefined,
        isTextType: selectedElementData.type === 'text',
        isImageType: selectedElementData.type === 'image',
        hasPosition: !!selectedElementData.position,
        hasSize: !!selectedElementData.size,
        hasStyle: !!selectedElementData.style
      });
    } else {
      console.log('🔍 PropertiesPanel - No element selected');
    }
  }, [selectedElementData]);

  // Utility function to handle property updates with error handling
  const updateProperty = useCallback(async (
    propertyName: string,
    updateFn: () => boolean,
    successMessage?: string
  ) => {
    setUpdateStatus(prev => ({
      ...prev,
      [propertyName]: { loading: true, error: null, success: false }
    }));

    try {
      const success = updateFn();

      if (success) {
        setUpdateStatus(prev => ({
          ...prev,
          [propertyName]: { loading: false, error: null, success: true }
        }));

        // Clear success state after a delay
        setTimeout(() => {
          setUpdateStatus(prev => ({
            ...prev,
            [propertyName]: { loading: false, error: null, success: false }
          }));
        }, 2000);

        if (successMessage) {
          toast({
            title: "Updated",
            description: successMessage,
          });
        }
      } else {
        throw new Error(`${propertyName} update failed`);
      }
    } catch (error) {
      console.error(`Failed to update ${propertyName}:`, error);
      setUpdateStatus(prev => ({
        ...prev,
        [propertyName]: {
          loading: false,
          error: `Failed to update ${propertyName}`,
          success: false
        }
      }));

      toast({
        title: "Update Failed",
        description: `Failed to update ${propertyName}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Enhanced debounced property update with different delays for different operations
  const debouncedUpdateProperty = useMemo(() => {
    const timeouts = new Map<string, NodeJS.Timeout>();

    return (propertyName: string, updateFn: () => boolean, successMessage?: string, delay: number = 150) => {
      // Clear existing timeout for this property
      const existingTimeout = timeouts.get(propertyName);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeoutId = setTimeout(() => {
        updateProperty(propertyName, updateFn, successMessage);
        timeouts.delete(propertyName); // Clean up after execution
      }, delay);

      timeouts.set(propertyName, timeoutId);
    };
  }, [updateProperty]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // This would be called on unmount, but we can't access the timeouts map here
      // The timeouts will be cleaned up by the garbage collector
    };
  }, []);

  const presetSizes = [
    { id: 'business-card', name: 'Business Card', width: 350, height: 200, icon: '💼' },
    { id: 'flyer', name: 'Flyer', width: 300, height: 400, icon: '📄' },
    { id: 'poster', name: 'Poster', width: 350, height: 500, icon: '🎨' },
    { id: 'banner', name: 'Banner', width: 500, height: 200, icon: '🏷️' },
    { id: 'a4', name: 'A4 Paper', width: 400, height: 565, icon: '📋' },
    { id: 'a3', name: 'A3 Paper', width: 565, height: 400, icon: '📊' },
  ];

  if (isCollapsed) {
    return (
      <div className="w-full h-full bg-white flex items-start justify-center pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="border border-gray-200 rounded-lg shadow-sm p-2"
          title="Show Properties Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    );
  }





  return (
    <div
      ref={panelRef}
      className="h-full flex flex-col bg-white"
    >
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Properties</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0 hover:bg-gray-200"
            title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
            <TabsTrigger value="canvas" className="text-xs">Canvas</TabsTrigger>
            <TabsTrigger value="layers" className="text-xs">Layers</TabsTrigger>
          </TabsList>
          
          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4 mt-4">
            {selectedElementData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Selected Element</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeleteSelected}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>

                {/* Element Type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Type className="w-4 h-4" />
                    <span>
                      {selectedElementData && selectedElementData.type === 'text' ? 'Text Element' :
                       selectedElementData && selectedElementData.type === 'image' ? 'Image Element' :
                       selectedElementData && selectedElementData.type === 'rectangle' ? 'Rectangle' :
                       selectedElementData && selectedElementData.type === 'circle' ? 'Circle' :
                       selectedElementData && selectedElementData.type === 'ellipse' ? 'Ellipse' :
                       selectedElementData && selectedElementData.type === 'triangle' ? 'Triangle' :
                       selectedElementData ? 'Shape Element' : 'Unknown Element'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editorRef?.current?.duplicateSelected()}
                      className="h-6 px-2 text-xs"
                      title="Duplicate Element"
                    >
                      <Square className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDeleteSelected}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                      title="Delete Element"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Quick Actions</Label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editorRef?.current?.alignObjects) {
                          editorRef.current.alignObjects('left');
                        }
                      }}
                      className="h-7 px-2 text-xs"
                      title="Align Left"
                    >
                      <AlignLeft className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editorRef?.current?.alignObjects) {
                          editorRef.current.alignObjects('center');
                        }
                      }}
                      className="h-7 px-2 text-xs"
                      title="Align Center"
                    >
                      <AlignCenter className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editorRef?.current?.alignObjects) {
                          editorRef.current.alignObjects('right');
                        }
                      }}
                      className="h-7 px-2 text-xs"
                      title="Align Right"
                    >
                      <AlignRight className="w-3 h-3" />
                    </Button>
                    {selectedElementData?.type === 'text' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editorRef?.current?.updateFontWeight) {
                            const currentWeight = selectedElementData.style?.fontWeight;
                            const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
                            editorRef.current.updateFontWeight(newWeight);
                          }
                        }}
                        className="h-7 px-2 text-xs"
                        title="Toggle Bold"
                      >
                        <Bold className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Text Content */}
                {selectedElementData && selectedElementData.type === 'text' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600">Text Content</Label>
                        {updateStatus['textContent']?.success && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                        {updateStatus['textContent']?.error && (
                          <span title={updateStatus['textContent'].error}>
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          </span>
                        )}
                      </div>
                      <Input
                        value={selectedElementData.content || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          debouncedUpdateProperty('textContent', () => {
                            if (editorRef?.current?.updateTextContent) {
                              return editorRef.current.updateTextContent(newValue);
                            }
                            return false;
                          });
                        }}
                        className={`h-8 text-xs ${
                          updateStatus['textContent']?.loading ? 'opacity-50' : ''
                        }`}
                        placeholder="Enter text..."
                        disabled={updateStatus['textContent']?.loading}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Characters: {selectedElementData.content?.length || 0}
                        {updateStatus['textContent']?.loading && (
                          <span className="ml-2 text-blue-500">Updating...</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Font Size */}
                    {selectedElementData.style?.fontSize && (
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-gray-600">Font Size: {selectedElementData.style?.fontSize}px</Label>
                          {updateStatus['fontSize']?.success && (
                            <Check className="w-3 h-3 text-green-500" />
                          )}
                          {updateStatus['fontSize']?.error && (
                            <span title={updateStatus['fontSize'].error}>
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            </span>
                          )}
                        </div>
                        <Slider
                          value={[selectedElementData.style.fontSize]}
                          onValueChange={(value) => {
                            debouncedUpdateProperty('fontSize', () => {
                              if (editorRef?.current?.updateFontSize) {
                                return editorRef.current.updateFontSize(value[0]);
                              }
                              return false;
                            });
                          }}
                          min={8}
                          max={72}
                          step={1}
                          className={`w-full ${
                            updateStatus['fontSize']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['fontSize']?.loading}
                        />
                        {updateStatus['fontSize']?.loading && (
                          <div className="text-xs text-blue-500 mt-1">Updating font size...</div>
                        )}
                      </div>
                    )}
                    
                    {/* Font Family */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600">Font Family</Label>
                        {updateStatus['fontFamily']?.success && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                        {updateStatus['fontFamily']?.error && (
                          <span title={updateStatus['fontFamily'].error}>
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          </span>
                        )}
                      </div>
                      <Select
                        value={selectedElementData.style?.fontFamily || 'Inter'}
                        onValueChange={(value) => {
                          updateProperty('fontFamily', () => {
                            if (editorRef?.current?.updateFontFamily) {
                              return editorRef.current.updateFontFamily(value);
                            }
                            return false;
                          }, `Font changed to ${value}`);
                        }}
                        disabled={updateStatus['fontFamily']?.loading}
                      >
                        <SelectTrigger className={`h-8 text-xs ${
                          updateStatus['fontFamily']?.loading ? 'opacity-50' : ''
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                        </SelectContent>
                      </Select>
                      {updateStatus['fontFamily']?.loading && (
                        <div className="text-xs text-blue-500 mt-1">Updating font...</div>
                      )}
                    </div>

                    {/* Text Color */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600">Color</Label>
                        {updateStatus['textColor']?.success && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                        {updateStatus['textColor']?.error && (
                          <span title={updateStatus['textColor'].error}>
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={selectedElementData.style?.color || '#000000'}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            console.log('🎨 PropertiesPanel: Color changed to', newColor);
                            debouncedUpdateProperty('textColor', () => {
                              console.log('🎨 PropertiesPanel: Calling updateColor with', newColor);
                              if (editorRef?.current?.updateColor) {
                                const result = editorRef.current.updateColor(newColor);
                                console.log('🎨 PropertiesPanel: updateColor result:', result);
                                return result;
                              }
                              console.warn('⚠️ PropertiesPanel: updateColor method not available');
                              return false;
                            });
                          }}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                          title="Click to select text color"
                        />
                        <Input
                          value={selectedElementData.style?.color || '#000000'}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            console.log('🎨 PropertiesPanel: Color changed to', newColor);
                            debouncedUpdateProperty('textColor', () => {
                              console.log('🎨 PropertiesPanel: Calling updateColor with', newColor);
                              if (editorRef?.current?.updateColor) {
                                const result = editorRef.current.updateColor(newColor);
                                console.log('🎨 PropertiesPanel: updateColor result:', result);
                                return result;
                              }
                              console.warn('⚠️ PropertiesPanel: updateColor method not available');
                              return false;
                            });
                          }}
                          className={`h-8 text-xs flex-1 ${
                            updateStatus['textColor']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['textColor']?.loading}
                          placeholder="#000000"
                        />
                      </div>
                      {updateStatus['textColor']?.loading && (
                        <div className="text-xs text-blue-500 mt-1">Updating color...</div>
                      )}
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600">Alignment</Label>
                        {updateStatus['textAlign']?.success && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                        {updateStatus['textAlign']?.error && (
                          <span title={updateStatus['textAlign'].error}>
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant={selectedElementData.style?.textAlign === 'left' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            updateProperty('textAlign', () => {
                              if (editorRef?.current?.updateTextAlign) {
                                return editorRef.current.updateTextAlign('left');
                              }
                              return false;
                            });
                          }}
                          className={`h-8 w-8 p-0 ${
                            updateStatus['textAlign']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['textAlign']?.loading}
                        >
                          <AlignLeft className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElementData.style?.textAlign === 'center' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            updateProperty('textAlign', () => {
                              if (editorRef?.current?.updateTextAlign) {
                                return editorRef.current.updateTextAlign('center');
                              }
                              return false;
                            });
                          }}
                          className={`h-8 w-8 p-0 ${
                            updateStatus['textAlign']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['textAlign']?.loading}
                        >
                          <AlignCenter className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElementData.style?.textAlign === 'right' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            updateProperty('textAlign', () => {
                              if (editorRef?.current?.updateTextAlign) {
                                return editorRef.current.updateTextAlign('right');
                              }
                              return false;
                            });
                          }}
                          className={`h-8 w-8 p-0 ${
                            updateStatus['textAlign']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['textAlign']?.loading}
                        >
                          <AlignRight className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElementData.style?.textAlign === 'justify' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            updateProperty('textAlign', () => {
                              if (editorRef?.current?.updateTextAlign) {
                                return editorRef.current.updateTextAlign('justify');
                              }
                              return false;
                            });
                          }}
                          className={`h-8 w-8 p-0 ${
                            updateStatus['textAlign']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['textAlign']?.loading}
                        >
                          <AlignJustify className="w-3 h-3" />
                        </Button>
                      </div>
                      {updateStatus['textAlign']?.loading && (
                        <div className="text-xs text-blue-500 mt-1">Updating alignment...</div>
                      )}
                    </div>

                    {/* Text Style */}
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-600">Style</Label>
                        {updateStatus['fontWeight']?.success && (
                          <Check className="w-3 h-3 text-green-500" />
                        )}
                        {updateStatus['fontWeight']?.error && (
                          <span title={updateStatus['fontWeight'].error}>
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant={selectedElementData.style?.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newWeight = selectedElementData.style?.fontWeight === 'bold' ? 'normal' : 'bold';
                            updateProperty('fontWeight', () => {
                              if (editorRef?.current?.updateFontWeight) {
                                return editorRef.current.updateFontWeight(newWeight);
                              }
                              return false;
                            });
                          }}
                          className={`h-8 w-8 p-0 ${
                            updateStatus['fontWeight']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['fontWeight']?.loading}
                        >
                          <Bold className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElementData.style?.fontStyle === 'italic' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newStyle = selectedElementData.style?.fontStyle === 'italic' ? 'normal' : 'italic';
                            updateProperty('fontStyle', () => {
                              if (editorRef?.current?.updateFontStyle) {
                                return editorRef.current.updateFontStyle(newStyle);
                              }
                              return false;
                            });
                          }}
                          className={`h-8 w-8 p-0 ${
                            updateStatus['fontStyle']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['fontStyle']?.loading}
                        >
                          <Italic className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElementData.style?.textDecoration === 'underline' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newDecoration = selectedElementData.style?.textDecoration === 'underline' ? 'none' : 'underline';
                            updateProperty('textDecoration', () => {
                              if (editorRef?.current?.updateTextDecoration) {
                                return editorRef.current.updateTextDecoration(newDecoration);
                              }
                              return false;
                            });
                          }}
                          className={`h-8 w-8 p-0 ${
                            updateStatus['textDecoration']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['textDecoration']?.loading}
                        >
                          <Underline className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={selectedElementData.style?.textDecoration === 'line-through' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newDecoration = selectedElementData.style?.textDecoration === 'line-through' ? 'none' : 'line-through';
                            updateProperty('textDecoration', () => {
                              if (editorRef?.current?.updateTextDecoration) {
                                return editorRef.current.updateTextDecoration(newDecoration);
                              }
                              return false;
                            });
                          }}
                          className={`h-8 w-8 p-0 ${
                            updateStatus['textDecoration']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['textDecoration']?.loading}
                        >
                          <Strikethrough className="w-3 h-3" />
                        </Button>
                      </div>
                      {(updateStatus['fontWeight']?.loading ||
                        updateStatus['fontStyle']?.loading ||
                        updateStatus['textDecoration']?.loading) && (
                        <div className="text-xs text-blue-500 mt-1">Updating style...</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Properties */}
                {(() => { console.log("🎨 Checking image properties condition:", selectedElementData?.type === 'image', "type:", selectedElementData?.type, "hasData:", !!selectedElementData); return null; })()}
                {selectedElementData && selectedElementData.type === 'image' && (
                  <div className="space-y-3">
                    {(() => { console.log("🎨 Rendering image properties for:", selectedElementData); return null; })()}
                    {/* Image Source */}
                    <div>
                      <Label className="text-xs text-gray-600">Image Source</Label>
                      <div className="text-xs text-gray-500 truncate bg-gray-50 p-2 rounded border">
                        {selectedElementData.style?.src ?
                          selectedElementData.style.src.split('/').pop() :
                          'No source available'}
                      </div>
                    </div>

                    {/* Image Opacity */}
                    <div>
                      <Label className="text-xs text-gray-600">Opacity: {Math.round((selectedElementData.style?.opacity || 1) * 100)}%</Label>
                      <Slider
                        value={[selectedElementData.style?.opacity || 1]}
                        onValueChange={(value) => {
                          console.log("🎛️ Opacity slider changed to:", value[0]);
                          debouncedUpdateProperty('opacity', () => {
                            console.log("🎛️ Calling updateOpacity with:", value[0]);
                            if (editorRef?.current?.updateOpacity) {
                              const result = editorRef.current.updateOpacity(value[0]);
                              console.log("🎛️ updateOpacity result:", result);
                              return result;
                            }
                            console.log("🎛️ updateOpacity method not available");
                            return false;
                          });
                        }}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Image Visibility */}
                    <div>
                      <Label className="text-xs text-gray-600">Visibility</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={selectedElementData.style?.visible !== false ? "default" : "outline"}
                          size="sm"
                                                  onClick={() => {
                          const newVisible = !(selectedElementData.style?.visible !== false);
                          console.log("👁️ Visibility toggle clicked, new value:", newVisible);
                          debouncedUpdateProperty('visible', () => {
                            console.log("👁️ Calling updateVisibility with:", newVisible);
                            if (editorRef?.current?.updateVisibility) {
                              const result = editorRef.current.updateVisibility(newVisible);
                              console.log("👁️ updateVisibility result:", result);
                              return result;
                            }
                            console.log("👁️ updateVisibility method not available");
                            return false;
                          });
                        }}
                          className="h-8 px-3 text-xs"
                        >
                          {selectedElementData.style?.visible !== false ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hidden
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shape Properties */}
                {selectedElementData && selectedElementData.type !== 'text' && selectedElementData.type !== 'image' && (
                  <div className="space-y-3">
                    {/* Fill Color */}
                    <div>
                      <Label className="text-xs text-gray-600">Fill Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={selectedElementData.style?.fill || '#000000'}
                          onChange={(e) => {
                            if (editorRef?.current?.updateShapeFillColor) {
                              editorRef.current.updateShapeFillColor(e.target.value);
                            }
                          }}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                          title="Click to select fill color"
                        />
                        <Input
                          value={selectedElementData.style?.fill || '#000000'}
                          onChange={(e) => {
                            if (editorRef?.current?.updateShapeFillColor) {
                              editorRef.current.updateShapeFillColor(e.target.value);
                            }
                          }}
                          className="h-8 text-xs flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    {/* Stroke Color */}
                    <div>
                      <Label className="text-xs text-gray-600">Stroke Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={selectedElementData.style?.stroke || '#000000'}
                          onChange={(e) => {
                            if (editorRef?.current?.updateShapeStrokeColor) {
                              editorRef.current.updateShapeStrokeColor(e.target.value);
                            }
                          }}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                          title="Click to select stroke color"
                        />
                        <Input
                          value={selectedElementData.style?.stroke || '#000000'}
                          onChange={(e) => {
                            if (editorRef?.current?.updateShapeStrokeColor) {
                              editorRef.current.updateShapeStrokeColor(e.target.value);
                            }
                          }}
                          className="h-8 text-xs flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    {/* Stroke Width */}
                    <div>
                      <Label className="text-xs text-gray-600">Stroke Width: {selectedElementData.style?.strokeWidth || 0}px</Label> // Changed to .style.strokeWidth
                      <Slider
                        value={[selectedElementData.style?.strokeWidth || 0]} // Changed to .style.strokeWidth
                        onValueChange={(value) => {
                          if (editorRef?.current?.updateShapeStrokeWidth) {
                            editorRef.current.updateShapeStrokeWidth(value[0]);
                          }
                        }}
                        min={0}
                        max={20}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Position */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600">Position</Label>
                    {updateStatus['position']?.success && (
                      <Check className="w-3 h-3 text-green-500" />
                    )}
                    {updateStatus['position']?.error && (
                      <span title={updateStatus['position'].error}>
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">X Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElementData.position?.x || 0)}
                        onChange={(e) => {
                          const x = parseFloat(e.target.value) || 0;
                          const y = selectedElementData.position?.y || 0;
                          debouncedUpdateProperty('position', () => {
                            if (editorRef?.current?.updatePosition) {
                              return editorRef.current.updatePosition(x, y);
                            }
                            return false;
                          });
                        }}
                        className={`h-8 text-xs ${
                          updateStatus['position']?.loading ? 'opacity-50' : ''
                        }`}
                        disabled={updateStatus['position']?.loading}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Y Position</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedElementData.position?.y || 0)}
                        onChange={(e) => {
                          const x = selectedElementData.position?.x || 0;
                          const y = parseFloat(e.target.value) || 0;
                          debouncedUpdateProperty('position', () => {
                            if (editorRef?.current?.updatePosition) {
                              return editorRef.current.updatePosition(x, y);
                            }
                            return false;
                          });
                        }}
                        className={`h-8 text-xs ${
                          updateStatus['position']?.loading ? 'opacity-50' : ''
                        }`}
                        disabled={updateStatus['position']?.loading}
                      />
                    </div>
                  </div>
                  {updateStatus['position']?.loading && (
                    <div className="text-xs text-blue-500 mt-1">Updating position...</div>
                  )}
                </div>

                {/* Size */}
                {selectedElementData.size?.width && selectedElementData.size?.height && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">Size</Label>
                      {updateStatus['size']?.success && (
                        <Check className="w-3 h-3 text-green-500" />
                      )}
                      {updateStatus['size']?.error && (
                        <span title={updateStatus['size'].error}>
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">Width</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedElementData.size?.width || 0)}
                          onChange={(e) => {
                            const width = parseFloat(e.target.value) || 0;
                            debouncedUpdateProperty('size', () => {
                              if (editorRef?.current?.updateShapeSize) {
                                return editorRef.current.updateShapeSize(width, selectedElementData.size?.height || 0);
                              }
                              return false;
                            });
                          }}
                          className={`h-8 text-xs ${
                            updateStatus['size']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['size']?.loading}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Height</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedElementData.size?.height || 0)}
                          onChange={(e) => {
                            const height = parseFloat(e.target.value) || 0;
                            debouncedUpdateProperty('size', () => {
                              if (editorRef?.current?.updateShapeSize) {
                                return editorRef.current.updateShapeSize(selectedElementData.size?.width || 0, height);
                              }
                              return false;
                            });
                          }}
                          className={`h-8 text-xs ${
                            updateStatus['size']?.loading ? 'opacity-50' : ''
                          }`}
                          disabled={updateStatus['size']?.loading}
                        />
                      </div>
                    </div>
                    {updateStatus['size']?.loading && (
                      <div className="text-xs text-blue-500">Updating size...</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Square className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm">Select an element to edit its properties</p>
                <p className="text-xs text-gray-400 mt-2">Use the toolbar to add text, shapes, or images</p>
              </div>
            )}
          </TabsContent>
          
          {/* Canvas Size Tab */}
          <TabsContent value="canvas" className="space-y-4 mt-4">
            {/* Professional Canvas Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Canvas Settings</h3>
              
              {/* Canvas Resize */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Canvas Size</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Width"
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(parseInt(e.target.value) || 400)}
                    className="flex-1 text-sm"
                  />
                  <span className="text-gray-500 self-center">×</span>
                  <Input
                    type="number"
                    placeholder="Height"
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(parseInt(e.target.value) || 300)}
                    className="flex-1 text-sm"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (resizeCanvas) {
                      const success = resizeCanvas(canvasWidth, canvasHeight);
                      if (success) {
                        toast({
                          title: "Canvas resized",
                          description: `Canvas resized to ${canvasWidth} × ${canvasHeight}`,
                        });
                      }
                    }
                  }}
                  className="w-full text-sm"
                  size="sm"
                >
                  Resize Canvas
                </Button>
              </div>

              {/* Preset Sizes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Preset Sizes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {presetSizes.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      onClick={() => {
                        setCanvasWidth(preset.width);
                        setCanvasHeight(preset.height);
                        if (resizeCanvas) {
                          const success = resizeCanvas(preset.width, preset.height);
                          if (success) {
                            toast({
                              title: "Canvas resized",
                              description: `Canvas resized to ${preset.name} (${preset.width} × ${preset.height})`,
                            });
                          }
                        }
                      }}
                      className="p-2 text-sm justify-start h-auto"
                      size="sm"
                    >
                      <div className="flex items-center space-x-2">
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Layers Tab */}
          <TabsContent value="layers" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Refresh layers
                    setLayersUpdateTrigger(prev => prev + 1);
                  }}
                  className="h-8 text-xs"
                >
                  Refresh
                </Button>
              </div>

              {/* Layer Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editorRef?.current?.duplicateSelected()}
                  disabled={!selectedElementData}
                  className="flex-1 h-8 text-xs"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteSelected}
                  disabled={!selectedElementData}
                  className="flex-1 h-8 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>

              {/* Layer List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(() => {
                  console.log('📋 PropertiesPanel: Checking getAllTexts method');
                  const raw = editorRef?.current?.getAllTexts ? editorRef.current.getAllTexts() : [];
                  console.log('📋 PropertiesPanel: Found texts:', raw.length);
                  const texts = raw.map((t: any) => {
                    if (t && t.div && t.textNode) {
                      // Map TextNodeState to UI shape
                      return {
                        id: t.id,
                        content: t.div.innerText,
                        style: { fontSize: parseInt(t.div.style.fontSize) || 16 },
                        type: 'text',
                        selected: selectedElementData?.id === t.id
                      };
                    }
                    return t || {};
                  });

                  return texts.map((text: any, index: number) => (
                    <div
                      key={`${text.id || index}-${layersUpdateTrigger}`}
                      className={`flex items-center justify-between p-2 border rounded-md cursor-pointer transition-colors ${
                        text.selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        // Select the element when clicked
                        if (editorRef?.current?.selectElementById) {
                          editorRef.current.selectElementById(text.id);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Type className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm truncate">
                          {text.content || `Text ${index + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {text.style?.fontSize || 16}px
                        </span>
                        {text.selected && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))
                })()}

                {(() => {
                  const texts = editorRef?.current?.getAllTexts ? editorRef.current.getAllTexts() : [];
                  return (!texts || texts.length === 0) ? (
                    <div className="text-center py-6 text-gray-500">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No layers available</p>
                      <p className="text-xs text-gray-400 mt-1">Add text or shapes to see layers</p>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Layer Statistics */}
              {(() => {
                const texts = editorRef?.current?.getAllTexts ? editorRef.current.getAllTexts() : [];
                if (texts && texts.length > 0) {
                  return (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span>Total layers:</span>
                        <span className="font-medium">{texts.length}</span>
                      </div>
                      {selectedElementData && (
                        <div className="flex justify-between mt-1">
                          <span>Selected:</span>
                          <span className="font-medium text-blue-600">Layer {texts.findIndex((t: any) => t.id === selectedElementData.id) + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
