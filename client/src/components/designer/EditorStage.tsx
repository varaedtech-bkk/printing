import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
} from "react";
import Konva from "konva";
import { designBoxPx, PrintSize } from "@/utils/units";
import { SelectionManager } from "@/engine/SelectionManager";

import "./EditorStage.css";

export type EditorStageProps = {
  widthMm: number;
  heightMm: number;
  bleedMm?: number;
  safeMm?: number;
  onStateChange?: (state: any) => void;
  onElementSelect?: (element: any) => void;
};

export type EditorStageRef = {
  addText: (x?: number, y?: number) => Konva.Text | null;
  addImage: (url: string, x?: number, y?: number) => Promise<void>;
  addShape: (
    shapeType: "rectangle" | "circle" | "ellipse" | "triangle",
    x?: number,
    y?: number
  ) => Konva.Shape | null;
  deleteSelected: () => void;
  clearCanvas: () => void;
  getState: () => any;
  loadState: (state: any) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  // New methods for properties panel
  getSelectedElementData: () => any;
  updateFontSize: (size: number) => boolean;
  updateFontFamily: (fontFamily: string) => boolean;
  updateColor: (color: string) => boolean;
  updateTextAlign: (align: "left" | "center" | "right" | "justify") => boolean;
  updateFontWeight: (weight: "normal" | "bold") => boolean;
  updateFontStyle: (style: "normal" | "italic") => boolean;
  updateTextDecoration: (
    decoration: "none" | "underline" | "line-through"
  ) => boolean;
  updateTextContent: (text: string) => boolean;
  canPerformOperations: () => boolean;
  forceRefreshCanvasState: () => void;
  // Additional methods for shapes and images
  duplicateSelected: () => void;
  undo: () => void;
  redo: () => void;
  alignObjects: (alignment: string) => void;
  exportDesign: () => void;
  saveDesign: () => void;
  // Method for PropertiesPanel layers tab
  getAllTexts: () => any[];
};

const EditorStage = forwardRef<EditorStageRef, EditorStageProps>(
  (
    {
      widthMm,
      heightMm,
      bleedMm = 3,
      safeMm = 3,
      onStateChange,
      onElementSelect,
    },
    ref
  ) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const stageWrapRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const konvaRef = useRef<HTMLDivElement>(null);

    const stageRef = useRef<Konva.Stage | null>(null);
    const layerRef = useRef<Konva.Layer | null>(null);
    const managerRef = useRef<SelectionManager | null>(null);

    const [zoom, setZoom] = useState(1);
    const [designPx, setDesignPx] = useState({
      widthPx: 0,
      heightPx: 0,
      offset: 0,
    });
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showGuides, setShowGuides] = useState(true);

    const updateSelectedElementState = useCallback(() => {
      if (managerRef.current) {
        const newElementData = managerRef.current.getSelectedElementData();
        // Always update to ensure properties panel reflects current state
        setSelectedElement(newElementData);
        onElementSelect?.(newElementData);
      }
    }, [onElementSelect]);

    // Initialize stage once
    useEffect(() => {
      if (!konvaRef.current || !overlayRef.current) return;

      // Get viewport dimensions
      const viewport = viewportRef.current!;
      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;

      // Create stage with proper dimensions
      const stage = new Konva.Stage({
        container: konvaRef.current!,
        width: viewportWidth,
        height: viewportHeight,
      });
      const layer = new Konva.Layer();
      stage.add(layer);
      stageRef.current = stage;
      layerRef.current = layer;

      const manager = new SelectionManager(stage, layer, overlayRef.current!);
      managerRef.current = manager;

      stage.on("click tap", (e) => {
        if (e.target === stage) {
          setSelectedId(null);
          manager.select(null);
          updateSelectedElementState();
          return;
        }

        const clickedOnTransformer =
          e.target.getParent()?.className === "Transformer";
        if (clickedOnTransformer) {
          return;
        }

        const id = (e.target as any).name?.();
        setSelectedId(id);
        manager.select(e.target);
        updateSelectedElementState();
      });

      // Draw guides (bleed & safe)
      const drawGuides = (
        w: number,
        h: number,
        offset: number,
        safe: number
      ) => {
        layer.find(".guide").forEach((n) => n.destroy());

        const contentW = w - offset * 2;
        const contentH = h - offset * 2;

        // Background rectangle (white background)
        const backgroundRect = new Konva.Rect({
          x: 0,
          y: 0,
          width: w,
          height: h,
          fill: "#ffffff",
          stroke: "#e5e7eb",
          strokeWidth: 1,
          name: "guide",
          listening: false,
        });

        // Bleed area (outer rectangle)
        const bleedRect = new Konva.Rect({
          x: 0,
          y: 0,
          width: w,
          height: h,
          stroke: "#ff4d4f",
          strokeWidth: 1,
          dash: [8, 8],
          name: "guide",
          listening: false,
        });

        // Safe print area (inner rectangle)
        const safeRect = new Konva.Rect({
          x: offset + safe,
          y: offset + safe,
          width: contentW - safe * 2,
          height: contentH - safe * 2,
          stroke: "#52c41a",
          strokeWidth: 1,
          dash: [6, 6],
          name: "guide",
          listening: false,
        });

        layer.add(backgroundRect, bleedRect, safeRect);
        layer.draw();
      };

      (stage as any).drawGuides = drawGuides;

      return () => {
        stage.destroy();
      };
    }, []);

    // Apply product size and compute design px
    useEffect(() => {
      const box = designBoxPx({ widthMm, heightMm, bleedMm, safeMm });
      setDesignPx({
        widthPx: box.widthPx,
        heightPx: box.heightPx,
        offset: box.contentOffsetPx,
      });
    }, [widthMm, heightMm, bleedMm, safeMm]);

    // Layout & zoom fit-to-screen
    const fitToViewport = () => {
      const vp = viewportRef.current!;
      const wrap = stageWrapRef.current!;
      const stage = stageRef.current!;
      const { widthPx, heightPx } = designPx;
      if (!widthPx || !heightPx) return;

      // Calculate scale to fit design in viewport with padding
      const padding = 80; // Increased padding for better visibility
      const availableWidth = vp.clientWidth - padding * 2;
      const availableHeight = vp.clientHeight - padding * 2;

      // Calculate scale to fit the design within available space
      const scaleX = availableWidth / widthPx;
      const scaleY = availableHeight / heightPx;
      let scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

      // For very large canvases (A3, A4), ensure minimum visibility
      if (widthPx > 1000 || heightPx > 1000) {
        scale = Math.min(scale, 0.8); // Cap at 80% for large formats
      }

      // For very small canvases (business cards), ensure they're not too small
      if (widthPx < 200 && heightPx < 200) {
        scale = Math.max(scale, 0.3); // Minimum 30% for small formats
      }

      // Center the design
      const scaledWidth = widthPx * scale;
      const scaledHeight = heightPx * scale;
      const offsetX = (vp.clientWidth - scaledWidth) / 2;
      const offsetY = (vp.clientHeight - scaledHeight) / 2;

      // Apply transform to stage wrapper
      wrap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      wrap.style.transformOrigin = "0 0";

      // Update stage size to match design dimensions
      stage.width(widthPx);
      stage.height(heightPx);

      // Update zoom state
      setZoom(scale);

      // Draw guides if enabled
      if (showGuides) {
        (stage as any).drawGuides(widthPx, heightPx, designPx.offset, 3);
      }

      // Update SelectionManager zoom
      if (managerRef.current) {
        managerRef.current.setZoom(scale);
      }

      stage.draw();
    };

    // Fit to viewport when design dimensions change
    useEffect(() => {
      if (designPx.widthPx && designPx.heightPx) {
        fitToViewport();
      }
    }, [designPx.widthPx, designPx.heightPx]);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        if (designPx.widthPx && designPx.heightPx) {
          fitToViewport();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [designPx.widthPx, designPx.heightPx]);

    // Public API methods
    const addText = useCallback(
      (x?: number, y?: number): Konva.Text | null => {
        // Calculate center position for the text
        const centerX = x ?? designPx.widthPx / 2;
        const centerY = y ?? designPx.heightPx / 2;

        // Add text at the specified position (no adjustment needed)
        const newTextNode = managerRef.current?.addText(
          "Click to edit text",
          centerX,
          centerY
        );

        // Save state after adding text
        if (newTextNode) {
          // Wait for element to be fully initialized before saving state
          setTimeout(() => {
            try {
              if (managerRef.current) {
                managerRef.current.saveState();
                const textId = newTextNode.name(); // Use name() instead of id()
                setSelectedId(textId);
                // Ensure the SelectionManager knows about this selection
                managerRef.current.select(newTextNode);
                setTimeout(() => {
                  const elementData = managerRef.current?.getSelectedElementData();
                  setSelectedElement(elementData);
                  onElementSelect?.(elementData);
                }, 50);
              }
            } catch (error) {
              console.error("❌ Error initializing text element:", error);
            }
          }, 10);
          return newTextNode;
        }
        return null;
      },
      [designPx.widthPx, designPx.heightPx, onElementSelect]
    );

    const addImage = useCallback(
      async (url: string, x?: number, y?: number) => {
        const centerX = x ?? designPx.widthPx / 2 - 100;
        const centerY = y ?? designPx.heightPx / 2 - 75;

        console.log("🖼️ EditorStage: Adding image", {
          url: url.substring(0, 50) + "...",
          centerX,
          centerY,
          designPx,
        });
        try {
          await managerRef.current?.addImageFromUrl(url, centerX, centerY);
          managerRef.current?.saveState();
          console.log("✅ Image added successfully");
        } catch (error) {
          console.error("❌ Failed to add image:", error);
        }
      },
      [designPx.widthPx, designPx.heightPx]
    );

    const addShape = useCallback(
      (
        shapeType: "rectangle" | "circle" | "ellipse" | "triangle",
        x?: number,
        y?: number
      ): Konva.Shape | null => {
        const centerX = x ?? designPx.widthPx / 2 - 50;
        const centerY = y ?? designPx.heightPx / 2 - 50;

        console.log("🎨 EditorStage: Adding shape", {
          shapeType,
          centerX,
          centerY,
          designPx,
        });

        const newShape = managerRef.current?.addShape(shapeType, centerX, centerY);
        if (newShape) {
          // Wait for shape to be fully initialized before saving state
          setTimeout(() => {
            try {
              if (managerRef.current) {
                managerRef.current.saveState();
              }
            } catch (error) {
              console.error("❌ Error initializing shape element:", error);
            }
          }, 10);
          return newShape;
        }
        return null;
      },
      [designPx.widthPx, designPx.heightPx]
    );

    const deleteSelected = useCallback(() => {
      managerRef.current?.deleteSelected();
      managerRef.current?.saveState();
      setSelectedElement(null);
      onElementSelect?.(null);
      setSelectedId(null); // Clear selected ID after deletion
    }, [onElementSelect]);

    const clearCanvas = useCallback(() => {
      const stage = stageRef.current;
      const layer = layerRef.current;
      const overlay = overlayRef.current;
      if (stage && layer && overlay) {
        layer.destroyChildren();
        overlay.innerHTML = "";
        managerRef.current = new SelectionManager(stage, layer, overlay);
        setSelectedElement(null);
        onElementSelect?.(null);
        setSelectedId(null); // Clear selected ID after clearing canvas
        layer.draw();
      }
    }, [onElementSelect]);

    // Placeholder methods for additional functionality
    const duplicateSelected = useCallback(() => {
      console.log("Duplicate selected - not implemented yet");
    }, []);

    const undo = useCallback(() => {
      const success = managerRef.current?.undo();
      if (success) {
        // Update selection after undo
        const elementData = managerRef.current?.getSelectedElementData();
        setSelectedElement(elementData);
        onElementSelect?.(elementData);
      }
      return success;
    }, [onElementSelect]);

    const redo = useCallback(() => {
      const success = managerRef.current?.redo();
      if (success) {
        // Update selection after redo
        const elementData = managerRef.current?.getSelectedElementData();
        setSelectedElement(elementData);
        onElementSelect?.(elementData);
      }
      return success;
    }, [onElementSelect]);

    const alignObjects = useCallback((alignment: string) => {
      console.log("Align objects - not implemented yet", alignment);
    }, []);

    const exportDesign = useCallback(() => {
      console.log("Export design - not implemented yet");
    }, []);

    const saveDesign = useCallback(() => {
      console.log("Save design - not implemented yet");
    }, []);

    // Zoom functions
    const zoomIn = useCallback(() => {
      const newZoom = Math.min(zoom * 1.2, 5);
      setZoom(newZoom);
      if (managerRef.current) {
        managerRef.current.setZoom(newZoom);
      }
      // Update stage wrapper transform
      if (stageWrapRef.current) {
        const currentTransform = stageWrapRef.current.style.transform;
        const match = currentTransform.match(/scale\(([^)]+)\)/);
        if (match) {
          const newTransform = currentTransform.replace(
            /scale\([^)]+\)/,
            `scale(${newZoom})`
          );
          stageWrapRef.current.style.transform = newTransform;
        }
      }
      // Force refresh HTML overlay positioning
      setTimeout(() => {
        if (managerRef.current) {
          managerRef.current.refreshHtmlOverlay();
        }
      }, 50);
    }, [zoom]);

    const zoomOut = useCallback(() => {
      const newZoom = Math.max(zoom / 1.2, 0.1);
      setZoom(newZoom);
      if (managerRef.current) {
        managerRef.current.setZoom(newZoom);
      }
      // Update stage wrapper transform
      if (stageWrapRef.current) {
        const currentTransform = stageWrapRef.current.style.transform;
        const match = currentTransform.match(/scale\(([^)]+)\)/);
        if (match) {
          const newTransform = currentTransform.replace(
            /scale\([^)]+\)/,
            `scale(${newZoom})`
          );
          stageWrapRef.current.style.transform = newTransform;
        }
      }
      // Force refresh HTML overlay positioning
      setTimeout(() => {
        if (managerRef.current) {
          managerRef.current.refreshHtmlOverlay();
        }
      }, 50);
    }, [zoom]);

    const resetView = useCallback(() => {
      fitToViewport();
    }, []);

    // Expose actions to parent - use useMemo to prevent unnecessary re-renders
    const exposedActions = useMemo(() => {
      const withStateUpdate = <T extends any[], R>(
        fn: (...args: T) => R
      ): ((...args: T) => R) => {
        return (...args: T): R => {
          const result = fn(...args);
          if (result) {
            setTimeout(() => {
              updateSelectedElementState();
            }, 50);
          }
          return result;
        };
      };

      return {
        addText,
        addImage,
        addShape,
        deleteSelected,
        clearCanvas,
        getState: () => managerRef.current?.toJSON(),
        loadState: (state: any) => managerRef.current?.fromJSON(state),
        zoomIn,
        zoomOut,
        resetView,
        // New methods for properties panel
        getSelectedElementData: () =>
          managerRef.current?.getSelectedElementData(),
        updateFontSize: withStateUpdate(
          (size: number) => managerRef.current?.updateFontSize(size) || false
        ),
        updateFontFamily: withStateUpdate(
          (fontFamily: string) =>
            managerRef.current?.updateFontFamily(fontFamily) || false
        ),
        updateColor: withStateUpdate(
          (color: string) => managerRef.current?.updateColor(color) || false
        ),
        updateTextAlign: withStateUpdate(
          (align: "left" | "center" | "right" | "justify") =>
            managerRef.current?.updateTextAlign(align) || false
        ),
        updateFontWeight: withStateUpdate(
          (weight: "normal" | "bold") =>
            managerRef.current?.updateFontWeight(weight) || false
        ),
        updateFontStyle: withStateUpdate(
          (style: "normal" | "italic") =>
            managerRef.current?.updateFontStyle(style) || false
        ),
        updateTextDecoration: withStateUpdate(
          (decoration: "none" | "underline" | "line-through") =>
            managerRef.current?.updateTextDecoration(decoration) || false
        ),
        updateTextContent: withStateUpdate(
          (text: string) => managerRef.current?.updateTextContent(text) || false
        ),
        canPerformOperations: () =>
          managerRef.current?.canPerformOperations() || false,
        forceRefreshCanvasState: () =>
          managerRef.current?.forceRefreshCanvasState(),
        // Additional methods for shapes and images
        duplicateSelected,
        undo,
        redo,
        alignObjects,
        exportDesign,
        saveDesign,
        // Shape property methods
        updateShapeFillColor: withStateUpdate(
          (fillColor: string) =>
            managerRef.current?.updateShapeFillColor(fillColor) || false
        ),
        updateShapeStrokeColor: withStateUpdate(
          (strokeColor: string) =>
            managerRef.current?.updateShapeStrokeColor(strokeColor) || false
        ),
        updateShapeStrokeWidth: withStateUpdate(
          (strokeWidth: number) =>
            managerRef.current?.updateShapeStrokeWidth(strokeWidth) || false
        ),
        updatePosition: withStateUpdate(
          (x: number, y: number) =>
            managerRef.current?.updatePosition(x, y) || false
        ),
        // Method for PropertiesPanel layers tab
        getAllTexts: () => managerRef.current?.getAllTexts() || [],
      };
    }, [
      addText,
      addImage,
      addShape,
      deleteSelected,
      clearCanvas,
      duplicateSelected,
      undo,
      redo,
      alignObjects,
      exportDesign,
      saveDesign,
      zoomIn,
      zoomOut,
      resetView,
      updateSelectedElementState,
    ]);

    // Expose actions to parent
    useImperativeHandle(ref, () => exposedActions, [exposedActions]);

    // Notify parent of state changes
    useEffect(() => {
      const state = {
        zoom,
        designPx,
        elementCount: managerRef.current?.getAllTexts().length || 0,
        selectedElement,
      };
      onStateChange?.(state);
    }, [zoom, designPx, selectedElement, onStateChange]);

    return (
      <div className="w-full h-full bg-white">
        <div
          id="editor-viewport"
          ref={viewportRef}
          className="relative w-full h-full bg-gray-50"
        >
          <div id="stage-wrap" ref={stageWrapRef} className="absolute inset-0">
            <div
              id="konva-container"
              ref={konvaRef}
              className="w-full h-full"
            ></div>
            <div
              id="html-overlay"
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none"
            ></div>
          </div>
        </div>
      </div>
    );
  }
);

EditorStage.displayName = "EditorStage";

export default EditorStage;

// Export functions for parent components
export const useEditorActions = () => {
  return {
    addText: () => {},
    addShape: () => {},
    addImage: () => {},
    deleteSelected: () => {},
  };
};
