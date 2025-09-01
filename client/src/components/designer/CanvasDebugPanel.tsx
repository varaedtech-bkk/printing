import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Search, 
  Wrench,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CanvasDebugPanelProps {
  editor: any; // FabricEditorCore instance
  className?: string;
}

export function CanvasDebugPanel({ editor, className = '' }: CanvasDebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  const runDebug = () => {
    if (!editor) return;
    
    try {
      // Simplified debug info for FabricEditorCore
      const info = {
        isInitialized: editor.isInitialized ? editor.isInitialized() : false,
        canvas: editor.canvas ? 'Canvas exists' : 'No canvas',
        objects: editor.canvas ? editor.canvas.getObjects().length : 0,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(info);
      console.log('🔍 Canvas Debug Info:', info);
    } catch (error) {
      console.error('Debug failed:', error);
    }
  };

  const fixVisibility = () => {
    if (!editor) return;
    
    try {
      const result = editor.fixCanvasVisibility();
      console.log('🔧 Fix Result:', result);
      
      if (result.success) {
        // Re-run debug to see the fixes
        setTimeout(runDebug, 100);
      }
    } catch (error) {
      console.error('Fix failed:', error);
    }
  };

  const createTestObject = () => {
    if (!editor) return;
    
    try {
      const result = editor.createTestObjectAtCenter();
      console.log('🧪 Test Object Result:', result);
      
      if (result.success) {
        // Re-run debug to see the new object
        setTimeout(runDebug, 100);
      }
    } catch (error) {
      console.error('Test object creation failed:', error);
    }
  };

  const resetCanvas = () => {
    if (!editor || !editor.canvas) return;
    
    try {
      // Reset viewport transform
      editor.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      // Reset zoom
      editor.canvas.setZoom(1);
      // Force render
      editor.canvas.renderAll();
      
      console.log('🔄 Canvas reset complete');
      setTimeout(runDebug, 100);
    } catch (error) {
      console.error('Canvas reset failed:', error);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={toggleVisibility}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Bug className="h-4 w-4 mr-2" />
        Show Debug
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-base">Canvas Debug</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleVisibility}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Debug and fix canvas visibility issues
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={runDebug} size="sm" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Debug
            </Button>
            <Button onClick={fixVisibility} size="sm" variant="outline">
              <Wrench className="h-4 w-4 mr-2" />
              Auto-Fix
            </Button>
            <Button onClick={createTestObject} size="sm" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Object
            </Button>
            <Button onClick={resetCanvas} size="sm" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Canvas
            </Button>
          </div>

          {/* Debug Results */}
          {debugInfo && (
            <>
              <Separator />
              
              {/* Canvas Info */}
              <div>
                <h4 className="font-medium text-sm mb-2">Canvas Info</h4>
                <div className="text-xs space-y-1">
                  <div>ID: {debugInfo.canvasInfo?.id}</div>
                  <div>Dimensions: {debugInfo.canvasInfo?.width} × {debugInfo.canvasInfo?.height}</div>
                  <div>Zoom: {debugInfo.canvasInfo?.zoom?.toFixed(2)}</div>
                  <div>Pan: ({debugInfo.canvasInfo?.panX?.toFixed(0)}, {debugInfo.canvasInfo?.panY?.toFixed(0)})</div>
                </div>
              </div>

              {/* Objects Info */}
              <div>
                <h4 className="font-medium text-sm mb-2">Objects ({debugInfo.objectsInfo?.length || 0})</h4>
                {debugInfo.objectsInfo?.length > 0 ? (
                  <div className="space-y-2">
                    {debugInfo.objectsInfo.slice(0, 3).map((obj: any, index: number) => (
                      <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                        <div className="font-medium">{obj.type} #{index}</div>
                        <div>Position: ({obj.left?.toFixed(0)}, {obj.top?.toFixed(0)})</div>
                        <div>Size: {obj.width?.toFixed(0)} × {obj.height?.toFixed(0)}</div>
                        <div>Visible: {obj.visible ? '✅' : '❌'}</div>
                        <div>Opacity: {obj.opacity}</div>
                      </div>
                    ))}
                    {debugInfo.objectsInfo.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{debugInfo.objectsInfo.length - 3} more objects
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No objects found</div>
                )}
              </div>

              {/* Issues & Recommendations */}
              {debugInfo.positioningIssues?.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Issues Found:</div>
                    <ul className="text-xs space-y-1">
                      {debugInfo.positioningIssues.map((issue: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {debugInfo.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Recommendations</h4>
                  <ul className="text-xs space-y-1">
                    {debugInfo.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Message */}
              {debugInfo.positioningIssues?.length === 0 && debugInfo.objectsInfo?.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Canvas appears to be working correctly!
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <div className="font-medium mb-2">Quick Fix Steps:</div>
            <ol className="space-y-1">
              <li>1. Click "Debug" to identify issues</li>
              <li>2. Click "Auto-Fix" to resolve common problems</li>
              <li>3. Click "Test Object" to add a visible test element</li>
              <li>4. Click "Reset Canvas" if objects are off-screen</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CanvasDebugPanel;
