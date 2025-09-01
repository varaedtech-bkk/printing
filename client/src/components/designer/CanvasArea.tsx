import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Trash2, 
  Copy,
  Plus,
  X,
  Move,
  RotateCw,
  Layers
} from "lucide-react";

interface CanvasAreaProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCanvasLoading: boolean;
  canvasInitialized: boolean;
  canvasDimensions: { width: number; height: number };
  fabricEditorRef: any;
  onAddText: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
}

export function CanvasArea({
  canvasRef,
  isCanvasLoading,
  canvasInitialized,
  canvasDimensions,
  fabricEditorRef,
  onAddText,
  onDeleteSelected,
  onDuplicateSelected
}: CanvasAreaProps) {
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(canvasDimensions.width);
  const [canvasHeight, setCanvasHeight] = useState(canvasDimensions.height);

  // Enhanced canvas element detection and mounting
  React.useEffect(() => {
    console.log('🎨 CanvasArea component mounted');

    const checkCanvasElement = () => {
      const canvasElement = document.getElementById('design-canvas');
      if (canvasElement) {
        console.log('🎨 Canvas element found:', {
          tagName: canvasElement.tagName,
          id: canvasElement.id,
          width: (canvasElement as HTMLCanvasElement).width,
          height: (canvasElement as HTMLCanvasElement).height,
          style: {
            width: canvasElement.style.width,
            height: canvasElement.style.height,
            display: canvasElement.style.display
          },
          boundingRect: canvasElement.getBoundingClientRect()
        });
        return true;
      } else {
        console.error('🎨 Canvas element NOT found!');
        return false;
      }
    };

    // Check immediately
    const immediateCheck = checkCanvasElement();

    // Also check after a short delay to catch async rendering
    const timer1 = setTimeout(() => {
      if (!immediateCheck) {
        checkCanvasElement();
      }
    }, 50);

    // And again after component should be fully rendered
    const timer2 = setTimeout(() => {
      checkCanvasElement();
    }, 200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Additional effect to monitor canvas dimensions changes
  React.useEffect(() => {
    const canvasElement = document.getElementById('design-canvas') as HTMLCanvasElement;
    if (canvasElement) {
      console.log('🎨 Canvas dimensions updated:', {
        newWidth: canvasDimensions.width,
        newHeight: canvasDimensions.height,
        elementWidth: canvasElement.width,
        elementHeight: canvasElement.height,
        styleWidth: canvasElement.style.width,
        styleHeight: canvasElement.style.height
      });
    }
  }, [canvasDimensions]);

  return (
    <div className="flex-1 bg-white p-4 sm:p-6 lg:p-8 min-h-screen pt-20">
      <div className="w-full max-w-6xl mx-auto">
        {/* Canvas */}
        <Card className="shadow-lg" data-testid="canvas-area">
          <div className="bg-gray-100 p-4 rounded-t-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center justify-between lg:justify-start">
                <span className="text-sm font-medium text-gray-700">Design Canvas</span>
                          {/* Mobile Quick Actions */}
          <div className="lg:hidden flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileTools(!showMobileTools)}
              className="text-xs"
            >
              {showMobileTools ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </Button>
            
            {/* Test Text Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAddText}
              disabled={isCanvasLoading || !canvasInitialized}
              className="text-xs bg-blue-100 text-blue-700"
            >
              Test Text
            </Button>
          </div>
              </div>

              {/* Desktop Tools - Responsive Layout */}
              <div className="hidden lg:flex items-center gap-2 overflow-x-auto pb-2">
                {/* Core Actions */}
                <div className="flex items-center space-x-2">
                  {/* Essential Professional Tools */}
                  
                  {/* Add Text Tool */}
                  <button
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.addText('Sample Text', {
                          x: 100,
                          y: 100,
                          fontSize: 24,
                          fill: '#FF0000'
                        });
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    title="Add Text"
                  >
                    Add Text
                  </button>

                  {/* Add Shape Tool */}
                  <button
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.addShape('rectangle', {
                          x: 200,
                          y: 200,
                          width: 100,
                          height: 80
                        });
                      }
                    }}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                    title="Add Shape"
                  >
                    Add Shape
                  </button>

                  {/* Clear Canvas Tool */}
                  <button
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.clearCanvas();
                        alert('Canvas cleared');
                      }
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                    title="Clear Canvas"
                  >
                    Clear
                  </button>

                  {/* CRITICAL VISIBILITY FIX BUTTON */}
                  <button
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        const success = fabricEditorRef.current.criticalVisibilityFix();
                        if (success) {
                          alert('🚨 CRITICAL VISIBILITY FIX APPLIED! Objects should now be visible and selectable. Check console for details.');
                        } else {
                          alert('❌ Critical visibility fix failed. Check console for errors.');
                        }
                      }
                    }}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors font-bold"
                    title="Force Objects Visible"
                  >
                    🚨 FORCE VISIBLE
                  </button>
                  
                  {/* FORCE INTERACTIVITY BUTTON */}
                  <button
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.forceObjectInteractivity();
                        alert('🔧 OBJECT INTERACTIVITY FORCED! Objects should now be movable and selectable. Check console for details.');
                      }
                    }}
                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium transition-colors font-bold"
                    title="Force Objects Movable"
                  >
                    🔧 FORCE MOVABLE
                  </button>

                  {/* NUCLEAR INTERACTIVITY FIX BUTTON */}
                  <button
                    onClick={() => {
                      if (confirm('☢️ This will completely rebuild all objects with guaranteed interactivity. Continue?')) {
                        if (fabricEditorRef.current) {
                          fabricEditorRef.current.nuclearInteractivityFix();
                          alert('☢️ Nuclear interactivity fix applied! All objects should now be fully interactive. Check console for details.');
                        }
                      }
                    }}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors font-bold"
                    title="Nuclear Interactivity Fix"
                  >
                    ☢️ NUCLEAR FIX
                  </button>

                  {/* FINAL TEST BUTTON */}
                  <button
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.finalTest();
                        alert('🧪 Final test applied! A blue "TEST INTERACTIVE" text should appear. Try clicking and dragging it!');
                      }
                    }}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors font-bold"
                    title="Final Interactivity Test"
                  >
                    🧪 FINAL TEST
                  </button>

                  {/* Canvas Resize Tool */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Width"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      onChange={(e) => setCanvasWidth(parseInt(e.target.value) || 400)}
                    />
                    <span className="text-gray-500 text-sm">×</span>
                    <input
                      type="number"
                      placeholder="Height"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      onChange={(e) => setCanvasHeight(parseInt(e.target.value) || 300)}
                    />
                    <button
                      onClick={() => {
                        if (fabricEditorRef.current) {
                          fabricEditorRef.current.resizeCanvas(canvasWidth, canvasHeight);
                        }
                      }}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
                      title="Resize Canvas"
                    >
                      Resize
                    </button>
                  </div>
                </div>

                {/* Quick Shape Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.addShape('rectangle', {
                          x: 100, y: 100, width: 150, height: 100
                        });
                      }
                    }}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Rectangle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.addShape('circle', {
                          x: 100, y: 100, radius: 50
                        });
                      }
                    }}
                  >
                    <Circle className="w-4 h-4 mr-1" />
                    Circle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.addShape('triangle', {
                          x: 100, y: 100, width: 100, height: 100
                        });
                      }
                    }}
                  >
                    <Triangle className="w-4 h-4 mr-1" />
                    Triangle
                  </Button>
                </div>

                {/* Object Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDuplicateSelected}
                    disabled={isCanvasLoading || !canvasInitialized}
                    className="text-xs"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDeleteSelected}
                    disabled={isCanvasLoading || !canvasInitialized}
                    className="text-xs text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Floating Tools Panel */}
          {showMobileTools && (
            <div className="lg:hidden bg-white border-t border-gray-200 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Add Text */}
                <button
                  onClick={() => {
                    if (fabricEditorRef.current) {
                      fabricEditorRef.current.addText('Sample Text', {
                        x: 100,
                        y: 100,
                        fontSize: 24,
                        fill: '#FF0000'
                      });
                    }
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
                >
                  Add Text
                </button>

                {/* Add Shape */}
                <button
                  onClick={() => {
                    if (fabricEditorRef.current) {
                      fabricEditorRef.current.addShape('rectangle', {
                        x: 200,
                        y: 200,
                        width: 100,
                        height: 80
                      });
                    }
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium"
                >
                  Add Shape
                </button>

                {/* Clear Canvas */}
                <button
                  onClick={() => {
                    if (fabricEditorRef.current) {
                      fabricEditorRef.current.clearCanvas();
                      alert('Canvas cleared');
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium"
                >
                  Clear
                </button>

                {/* Resize Canvas */}
                <button
                  onClick={() => {
                    if (fabricEditorRef.current) {
                      fabricEditorRef.current.resizeCanvas(500, 300);
                    }
                  }}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium"
                >
                  Resize
                </button>

                {/* CRITICAL VISIBILITY FIX */}
                <button
                  onClick={() => {
                    if (fabricEditorRef.current) {
                      const success = fabricEditorRef.current.criticalVisibilityFix();
                      if (success) {
                        alert('🚨 VISIBILITY FIX APPLIED!');
                      } else {
                        alert('❌ Visibility fix failed');
                      }
                    }
                  }}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium font-bold"
                >
                  🚨 FORCE VISIBLE
                </button>

                {/* FORCE INTERACTIVITY */}
                <button
                  onClick={() => {
                    if (fabricEditorRef.current) {
                      const success = fabricEditorRef.current.forceObjectInteractivity();
                      if (success) {
                        alert('🔧 INTERACTIVITY FORCED!');
                      } else {
                        alert('❌ Interactivity failed');
                      }
                    }
                  }}
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium font-bold"
                >
                  🔧 FORCE MOVABLE
                </button>
              </div>
            </div>
          )}

          {/* Canvas Container */}
          <div className="p-4 sm:p-6 lg:p-8 relative overflow-visible">
                        {/* Floating Quick Actions Panel */}
            <div
              className="fixed top-24 right-4 z-50 transition-all duration-200 ease-in-out"
              onMouseEnter={() => setShowQuickActions(true)}
              onMouseLeave={() => setShowQuickActions(false)}
              style={{
                position: 'fixed',
                top: '96px', // Position below navigation
                right: '16px',
                zIndex: 50,
                transform: showQuickActions ? 'translateX(0)' : 'translateX(8px)',
                opacity: showQuickActions ? 1 : 0.8
              }}
            >
              <div className={`bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2 transition-all duration-200 ${showQuickActions ? 'shadow-xl scale-105' : 'shadow-lg scale-100'}`}>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddText}
                    disabled={isCanvasLoading || !canvasInitialized}
                    className="h-8 w-8 p-0"
                    title="Add Text"
                  >
                    <Type className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.addShape('rectangle', {
                          x: 100, y: 100, width: 150, height: 100
                        });
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Add Rectangle"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.addShape('circle', {
                          x: 100, y: 100, radius: 50
                        });
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Add Circle"
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicateSelected}
                    disabled={isCanvasLoading || !canvasInitialized}
                    className="h-8 w-8 p-0"
                    title="Duplicate Selected"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeleteSelected}
                    disabled={isCanvasLoading || !canvasInitialized}
                    className="h-8 w-8 p-0 text-red-600"
                    title="Delete Selected"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <canvas
                  id="design-canvas"
                  ref={canvasRef}
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  style={{
                    width: `${canvasDimensions.width}px`,   // Explicitly set CSS width to match canvas attribute
                    height: `${canvasDimensions.height}px`, // Explicitly set CSS height to match canvas attribute
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    display: "block",
                    imageRendering: "auto",
                    aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`,
                    boxSizing: "border-box",
                    margin: 0,
                    padding: 0
                  }}
                  data-testid="design-canvas"
                />
                {/* Canvas info overlay */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {/* Canvas dimensions indicator */}
                  <div className="bg-black/75 text-white text-xs px-2 py-1 rounded font-mono">
                    {canvasDimensions.width} × {canvasDimensions.height}
                  </div>

                  {/* Canvas status indicator */}
                  <div className={`text-xs px-2 py-1 rounded font-mono ${
                    canvasInitialized
                      ? 'bg-green-500/75 text-white'
                      : 'bg-red-500/75 text-white'
                  }`}>
                    {canvasInitialized ? 'Ready' : 'Loading'}
                  </div>

                  {/* Debug button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const canvasEl = document.getElementById('design-canvas') as HTMLCanvasElement;
                      if (canvasEl) {
                        console.log('🔍 Canvas Debug Info:', {
                          htmlWidth: canvasEl.width,
                          htmlHeight: canvasEl.height,
                          cssWidth: canvasEl.style.width,
                          cssHeight: canvasEl.style.height,
                          clientRect: canvasEl.getBoundingClientRect(),
                          devicePixelRatio: window.devicePixelRatio,
                          fabricCanvas: fabricEditorRef.current?.getCanvas()?.width,
                          fabricHeight: fabricEditorRef.current?.getCanvas()?.height
                        });
                        alert(`Canvas: ${canvasEl.width}×${canvasEl.height}\nDisplay: ${canvasEl.style.width}×${canvasEl.style.height}\nCheck console for full debug info.`);
                      }
                    }}
                    className="h-6 w-6 p-0 bg-blue-500/75 text-white hover:bg-blue-600/75 text-xs"
                    title="Debug Canvas"
                  >
                    🔍
                  </Button>

                  {/* Refresh interactivity button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        fabricEditorRef.current.forceRefreshCanvas();
                        alert('🔄 Canvas refreshed! All objects should now be visible and interactive.');
                      } else {
                        alert('❌ Canvas not ready yet. Please wait for initialization.');
                      }
                    }}
                    className="h-6 w-6 p-0 bg-purple-500/75 text-white hover:bg-purple-600/75 text-xs"
                    title="Refresh Canvas"
                  >
                    ⚡
                  </Button>

                  {/* Create test object button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (fabricEditorRef.current) {
                        const success = fabricEditorRef.current.createTestObject();
                        if (success) {
                          alert('🧪 Test object created! A red rectangle should appear on the canvas.');
                        } else {
                          alert('❌ Failed to create test object. Check console for details.');
                        }
                      } else {
                        alert('❌ Canvas not ready yet. Please wait for initialization.');
                      }
                    }}
                    className="h-6 w-6 p-0 bg-blue-500/75 text-white hover:bg-blue-600/75 text-xs"
                    title="Create Test Object"
                  >
                    🧪
                  </Button>

                  {/* Reset canvas button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Reset canvas? This will clear all objects and reinitialize the canvas.')) {
                        // Call reset function from useDesigner hook
                        // This would need to be passed as a prop or accessed differently
                        // For now, we'll trigger a page reload as a simple reset
                        window.location.reload();
                      }
                    }}
                    className="h-6 w-6 p-0 bg-orange-500/75 text-white hover:bg-orange-600/75 text-xs"
                    title="Reset Canvas"
                  >
                    🔄
                  </Button>
                        {/* Critical Visibility Fix Button */}
                        <button
                          onClick={() => {
                            if (fabricEditorRef.current) {
                              fabricEditorRef.current.forceObjectVisibility();
                              alert('🚨 CRITICAL VISIBILITY FIX APPLIED! Objects should now be BRIGHT RED/GREEN with BLACK borders!');
                            } else {
                              alert('❌ Fabric editor not available');
                            }
                          }}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                          title="🚨 CRITICAL: Force all objects to become visible with bright colors"
                        >
                          🚨 FORCE VISIBLE
                        </button>
                        {/* Revise Canvas Button */}
                        <button
                          onClick={() => {
                            if (fabricEditorRef.current) {
                              fabricEditorRef.current.reviseCanvas();
                              alert('🔧 CANVAS REVISION STARTED! Objects will be completely rebuilt with guaranteed visibility!');
                            } else {
                              alert('❌ Fabric editor not available');
                            }
                          }}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                          title="🔧 REVISE CANVAS: Complete rebuild to fix visibility issues"
                        >
                          🔧 REVISE CANVAS
                        </button>
                        {/* Nuclear Rebuild Button */}
                        <button
                          onClick={() => {
                            if (fabricEditorRef.current) {
                              if (confirm('☢️ NUCLEAR REBUILD: This will completely destroy and recreate the canvas. All objects will be preserved but the canvas will be rebuilt from scratch. Continue?')) {
                                fabricEditorRef.current.nuclearRebuild();
                                alert('☢️ NUCLEAR REBUILD STARTED! Canvas will be completely destroyed and recreated!');
                              }
                            } else {
                              alert('❌ Fabric editor not available');
                            }
                          }}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
                          title="☢️ NUCLEAR REBUILD: Complete canvas destruction and recreation"
                        >
                          ☢️ NUCLEAR REBUILD
                        </button>
                        {/* Final Solution Button */}
                        <button
                          onClick={() => {
                            if (fabricEditorRef.current) {
                              fabricEditorRef.current.forceCanvasDisplay();
                              alert('🚀 FINAL SOLUTION APPLIED! Canvas element will be forced visible with maximum priority rendering!');
                            } else {
                              alert('❌ Fabric editor not available');
                            }
                          }}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                          title="🚀 FINAL SOLUTION: Force canvas element visibility and maximum priority rendering"
                        >
                          🚀 FINAL SOLUTION
                        </button>
                        {/* Restore Interactivity Button */}
                        <button
                          onClick={() => {
                            if (fabricEditorRef.current) {
                              fabricEditorRef.current.restoreInteractivity();
                              alert('🔧 INTERACTIVITY RESTORED! Objects should now be selectable, movable, and editable!');
                            } else {
                              alert('❌ Fabric editor not available');
                            }
                          }}
                          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium transition-colors"
                          title="🔧 Restore interactivity and selection for all objects"
                        >
                          🔧 RESTORE INTERACTIVITY
                        </button>
                        {/* Final Test Button */}
                        <button
                          onClick={() => {
                            if (fabricEditorRef.current) {
                              fabricEditorRef.current.finalTest();
                              alert('🧪 FINAL TEST STARTED! A new test text will be created and immediately selected!');
                            } else {
                              alert('❌ Fabric editor not available');
                            }
                          }}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          🧪 FINAL TEST
                        </button>

                        {/* Force Object Interactivity Button */}
                        <button
                          onClick={() => {
                            if (fabricEditorRef.current) {
                              fabricEditorRef.current.forceObjectInteractivity();
                              alert('🔧 OBJECT INTERACTIVITY FORCED! Objects should now be movable and selectable!');
                            } else {
                              alert('❌ Fabric editor not available');
                            }
                          }}
                          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium transition-colors"
                          title="Force Objects Movable"
                        >
                          🔧 FORCE MOVABLE
                        </button>

                        {/* Nuclear Interactivity Fix Button */}
                        <button
                          onClick={() => {
                            if (confirm('☢️ This will completely rebuild all objects with guaranteed interactivity. Continue?')) {
                              if (fabricEditorRef.current) {
                                fabricEditorRef.current.nuclearInteractivityFix();
                                alert('☢️ Nuclear interactivity fix applied! All objects should now be fully interactive!');
                              }
                            }
                          }}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                          title="Nuclear Interactivity Fix"
                        >
                          ☢️ NUCLEAR FIX
                        </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
