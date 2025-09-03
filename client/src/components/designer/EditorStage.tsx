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
  backgroundColor?: string;
  onStateChange?: (state: any) => void;
  onElementSelect?: (element: any) => void;
};

export type EditorStageRef = {
  addText: (text?: string, x?: number, y?: number) => Konva.Text | null;
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
  zoomToFit: () => void;
  zoomTo100: () => void;
  resetView: () => void;
  toggleGuides: () => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  // New methods for properties panel
  getSelectedElementData: () => any;
  updateFontSize: (size: number) => boolean;
  updateFontFamily: (fontFamily: string) => boolean;
  updateColor: (color: string) => boolean;
  updateTextAlign: (align: "left" | "center" | "right" | "justify") => boolean;
  updateFontWeight: (weight: "normal" | "bold") => boolean;
  updateFontStyle: (style: "normal" | "italic") => boolean;
  updateOpacity: (opacity: number) => boolean;
  updateVisibility: (visible: boolean) => boolean;
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
  // Template methods
  loadTemplate: (templateData: any) => void;
  getCurrentTemplate: () => any;
  exportAsTemplate: (metadata: any) => any;
};

const EditorStage = forwardRef<EditorStageRef, EditorStageProps>(
  (
    {
      widthMm,
      heightMm,
      bleedMm = 3,
      safeMm = 3,
      backgroundColor = "#ffffff",
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
    const [showGrid, setShowGrid] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [gridSize, setGridSize] = useState(20);

    // Touch gesture state
    const [isPinching, setIsPinching] = useState(false);
    const [initialDistance, setInitialDistance] = useState(0);
    const [initialZoom, setInitialZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const updateSelectedElementState = useCallback(() => {
      if (managerRef.current) {
        const newElementData = managerRef.current.getSelectedElementData();

        // Only update if the data has actually changed to prevent unnecessary re-renders
        setSelectedElement((prevData: any) => {
          // More efficient comparison using IDs instead of JSON.stringify
          const prevId = prevData?.id;
          const newId = newElementData?.id;

          // Only call onElementSelect if the selection actually changed
          if (prevId !== newId) {
            console.log('🎯 updateSelectedElementState: Selection changed from', prevId, 'to', newId);
            onElementSelect?.(newElementData);
            return newElementData;
          }

          console.log('🎯 updateSelectedElementState: No selection change detected');
          return prevData;
        });
      }
    }, [onElementSelect]);

    // Touch gesture handlers - defined before useEffect that uses them
    const getTouchDistance = useCallback((touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch start
        e.preventDefault();
        setIsPinching(true);
        setInitialDistance(getTouchDistance(e.touches[0], e.touches[1]));
        setInitialZoom(zoom);
      } else if (e.touches.length === 1 && !isPinching) {
        // Pan start
        setIsPanning(true);
        setPanStart({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
      }
    }, [getTouchDistance, zoom, isPinching]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const scaleChange = currentDistance / initialDistance;
        const newZoom = Math.max(0.1, Math.min(5.0, initialZoom * scaleChange));

        if (newZoom !== zoom) {
          setZoom(newZoom);
          if (managerRef.current) {
            managerRef.current.setZoom(newZoom);
          }

          // Update stage wrapper transform
          if (stageWrapRef.current) {
            const wrap = stageWrapRef.current;
            const currentTransform = wrap.style.transform;
            const match = currentTransform.match(/scale\(([^)]+)\)/);
            if (match) {
              const newTransform = currentTransform.replace(
                /scale\([^)]+\)/,
                `scale(${newZoom})`
              );
              wrap.style.transform = newTransform;
            }
          }
        }
      }
    }, [isPinching, getTouchDistance, initialDistance, initialZoom, zoom]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
      if (e.touches.length === 0) {
        setIsPinching(false);
        setIsPanning(false);
      }
    }, []);

    // Initialize stage once - use useLayoutEffect to ensure DOM is ready
    const stageInitializedRef = useRef(false);

    useLayoutEffect(() => {
      // Prevent multiple initializations
      if (stageInitializedRef.current) {
        console.log('🎨 EditorStage: Stage already initialized, skipping...');
        return;
      }

      console.log('🎨 EditorStage: Initializing stage...');
      console.log('🎨 EditorStage: konvaRef.current:', !!konvaRef.current);
      console.log('🎨 EditorStage: overlayRef.current:', !!overlayRef.current);
      
      if (!konvaRef.current || !overlayRef.current) {
        console.log('❌ EditorStage: Missing refs, cannot initialize');
        stageInitializedRef.current = false; // Reset flag on failure
        return;
      }

      // Get viewport dimensions
      const viewport = viewportRef.current!;
      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;

      console.log('🎨 EditorStage: Viewport dimensions:', viewportWidth, 'x', viewportHeight);
      console.log('🎨 EditorStage: Viewport element:', viewport);
      console.log('🎨 EditorStage: Viewport styles:', getComputedStyle(viewport));

      // Ensure we have valid dimensions
      if (!viewportWidth || !viewportHeight || viewportWidth <= 0 || viewportHeight <= 0) {
        console.warn('🎨 EditorStage: Invalid viewport dimensions, retrying...');
        setTimeout(() => {
          console.log('🎨 EditorStage: Retrying initialization...');
          // Force re-run of initialization
          if (konvaRef.current && overlayRef.current) {
            console.log('🎨 EditorStage: Refs are ready, retrying...');
          }
        }, 100);
        return;
      }

      // Validate designPx before proceeding
      if (!designPx.widthPx || !designPx.heightPx || designPx.widthPx <= 0 || designPx.heightPx <= 0) {
        console.warn('🎨 EditorStage: Invalid designPx dimensions:', designPx);
        return;
      }

      // Create stage with design dimensions - scaling will be handled by wrapper transform
      const stageWidth = designPx.widthPx;
      const stageHeight = designPx.heightPx;

      // Validate dimensions
      if (!stageWidth || !stageHeight || stageWidth <= 0 || stageHeight <= 0) {
        console.error('❌ EditorStage: Invalid design dimensions:', stageWidth, 'x', stageHeight);
        return;
      }

      console.log('🎨 EditorStage: Creating stage with design dimensions:', stageWidth, 'x', stageHeight);

      const stage = new Konva.Stage({
        container: konvaRef.current!,
        width: stageWidth,
        height: stageHeight,
      });
      const layer = new Konva.Layer();
      stage.add(layer);
      stageRef.current = stage;
      layerRef.current = layer;

      console.log('✅ EditorStage: Stage and layer created successfully');
      console.log('✅ EditorStage: Stage dimensions:', stage.width(), 'x', stage.height());
      console.log('✅ EditorStage: Konva container element:', konvaRef.current);

      // Mark as initialized
      stageInitializedRef.current = true;

      const manager = new SelectionManager(stage, layer, overlayRef.current!);
      managerRef.current = manager;

      // Sync any existing HTML overlays after initialization
      setTimeout(() => {
        if (managerRef.current) {
          managerRef.current.syncKonvaToHtml();
        }
      }, 100);

      // Note: Canvas is now ready for use - add elements via UI controls

      // Set up resize observer for responsive canvas
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && stage && stageRef.current === stage) {
            console.log('🎨 EditorStage: Resizing stage to:', width, 'x', height);
            stage.width(width);
            stage.height(height);
            stage.draw();
          }
        }
      });

      if (viewport) {
        resizeObserver.observe(viewport);
      }

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

      // Add touch event listeners for mobile gestures
      const stageContainer = stage.container();
      stageContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      stageContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      stageContainer.addEventListener('touchend', handleTouchEnd, { passive: false });

      // Enhanced draw guides with grid support
      const drawGuides = (
        w: number,
        h: number,
        offset: number,
        safe: number
      ) => {
        // Validate dimensions before drawing
        if (!w || !h || w <= 0 || h <= 0) {
          console.warn('🎨 EditorStage: Invalid dimensions for drawGuides:', w, 'x', h);
          return;
        }

        // Check if stage has valid dimensions
        if (!stage || stage.width() <= 0 || stage.height() <= 0) {
          console.warn('🎨 EditorStage: Stage has invalid dimensions:', stage?.width(), 'x', stage?.height());
          return;
        }

        try {
          layer.find(".guide").forEach((n) => n.destroy());

          const contentW = w - offset * 2;
          const contentH = h - offset * 2;

          // Background rectangle with accurate dimensions and color
          const backgroundRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: w,
            height: h,
            fill: backgroundColor,
            stroke: "#d1d5db", // Slightly darker border for better visibility
            strokeWidth: 1, // Increased for better visibility
            cornerRadius: 4, // Add rounded corners for modern look
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 4,
            shadowOffset: { x: 0, y: 2 },
            shadowOpacity: 0.3,
            name: "background",
            listening: false,
          });

          // Bleed area (outer rectangle) - only if guides are enabled
          if (showGuides) {
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
            layer.add(bleedRect);
          }

          // Safe print area (inner rectangle) - only if guides are enabled
          if (showGuides) {
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
            layer.add(safeRect);
          }

          // Draw grid if enabled
          if (showGrid) {
            const gridGroup = new Konva.Group({ name: "guide" });

            // Vertical lines
            for (let x = gridSize; x < w; x += gridSize) {
              const line = new Konva.Line({
                points: [x, 0, x, h],
                stroke: "#e5e7eb",
                strokeWidth: 0.5,
                dash: [2, 2],
                listening: false,
              });
              gridGroup.add(line);
            }

            // Horizontal lines
            for (let y = gridSize; y < h; y += gridSize) {
              const line = new Konva.Line({
                points: [0, y, w, y],
                stroke: "#e5e7eb",
                strokeWidth: 0.5,
                dash: [2, 2],
                listening: false,
              });
              gridGroup.add(line);
            }

            layer.add(gridGroup);
          }

          layer.add(backgroundRect);
          layer.draw();
        } catch (error) {
          console.error('❌ EditorStage: Error in drawGuides:', error);
        }
      };

      (stage as any).drawGuides = drawGuides;

      return () => {
        // Clean up resize observer
        if (viewport && resizeObserver) {
          resizeObserver.unobserve(viewport);
        }

        // Clean up touch event listeners
        const stageContainer = stage.container();
        stageContainer.removeEventListener('touchstart', handleTouchStart);
        stageContainer.removeEventListener('touchmove', handleTouchMove);
        stageContainer.removeEventListener('touchend', handleTouchEnd);

        stage.destroy();

        // Reset initialization flag for potential re-initialization
        stageInitializedRef.current = false;
      };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]); // Keep dependencies but make handlers stable

      // Apply product size and compute design px
  useEffect(() => {
    console.log('🎨 EditorStage: Props changed - widthMm:', widthMm, 'heightMm:', heightMm, 'bleedMm:', bleedMm, 'safeMm:', safeMm);
    // Use a lower DPI for canvas display to make it more reasonable
    const box = designBoxPx({ widthMm, heightMm, bleedMm, safeMm }, 72); // Use 72 DPI for display
    console.log('🎨 EditorStage: Converting dimensions:', {
      input: { widthMm, heightMm, bleedMm, safeMm },
      output: box
    });
      setDesignPx({
        widthPx: box.widthPx,
        heightPx: box.heightPx,
        offset: box.contentOffsetPx,
      });

      // Redraw guides when dimensions change
      if (stageRef.current && (stageRef.current as any).drawGuides && box.widthPx > 0 && box.heightPx > 0) {
        (stageRef.current as any).drawGuides(box.widthPx, box.heightPx, box.contentOffsetPx, 3);
      }
        }, [widthMm, heightMm, bleedMm, safeMm, backgroundColor]);

    // Force re-render when dimensions change
    const [dimensionsKey, setDimensionsKey] = useState(0);
    useEffect(() => {
      console.log('🎨 EditorStage: Dimensions changed, forcing re-render');
      setDimensionsKey(prev => prev + 1);
      // Reset initialization flag so stage will reinitialize with new dimensions
      stageInitializedRef.current = false;
    }, [widthMm, heightMm]);

    // Apply current zoom level when dimensions change (preserve user's zoom preference)
    useEffect(() => {
      if (designPx.widthPx && designPx.heightPx && zoom > 0) {
        console.log('🎨 EditorStage: Applying current zoom level to new dimensions');
        // Will be handled by the applyZoomChange function when it's available
      }
    }, [designPx.widthPx, designPx.heightPx, zoom]);

    // Update canvas container dimensions when designPx changes
    useEffect(() => {
      if (designPx.widthPx && designPx.heightPx && viewportRef.current) {
        const vp = viewportRef.current;
        const { widthPx, heightPx } = designPx;

        // Calculate scale to fit in viewport
        const padding = 60;
        const availableWidth = vp.clientWidth - padding * 2;
        const availableHeight = vp.clientHeight - padding * 2;

        const scaleX = availableWidth / widthPx;
        const scaleY = availableHeight / heightPx;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = widthPx * scale;
        const scaledHeight = heightPx * scale;
        const offsetX = (vp.clientWidth - scaledWidth) / 2;
        const offsetY = (vp.clientHeight - scaledHeight) / 2;

        // Update canvas container immediately
        const konvaContainer = document.getElementById('konva-container');
        const htmlOverlay = document.getElementById('html-overlay');

        if (konvaContainer) {
          konvaContainer.style.width = `${scaledWidth}px`;
          konvaContainer.style.height = `${scaledHeight}px`;
          konvaContainer.style.left = `${offsetX}px`;
          konvaContainer.style.top = `${offsetY}px`;
        }

        if (htmlOverlay) {
          htmlOverlay.style.width = `${scaledWidth}px`;
          htmlOverlay.style.height = `${scaledHeight}px`;
          htmlOverlay.style.left = `${offsetX}px`;
          htmlOverlay.style.top = `${offsetY}px`;
        }

        console.log('🎨 EditorStage: Updated canvas dimensions:', scaledWidth, 'x', scaledHeight);
        console.log('🎨 EditorStage: Design aspect ratio:', widthPx / heightPx);
        console.log('🎨 EditorStage: Scale applied:', scale);

        // Update the visual indicator with current dimensions
        let indicator = document.getElementById('canvas-size-indicator');
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.id = 'canvas-size-indicator';
          indicator.style.cssText = `
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%);
            color: #3b82f6;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            border: 2px solid rgba(59, 130, 246, 0.3);
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
            z-index: 10;
            pointer-events: none;
            letter-spacing: 0.5px;
            white-space: nowrap;
          `;
          document.getElementById('editor-viewport')?.appendChild(indicator);
        }

        if (indicator) {
          const displayWidth = Math.round(widthPx * 25.4 / 72); // Convert pixels back to mm at 72 DPI
          const displayHeight = Math.round(heightPx * 25.4 / 72);
          indicator.textContent = `🎨 ${displayWidth}×${displayHeight}mm Canvas`;
        }
      }
    }, [designPx.widthPx, designPx.heightPx]);

    // Enhanced layout & zoom fit-to-screen with better aspect ratio handling
  const fitToViewport = useCallback(() => {
    console.log('🎨 EditorStage: fitToViewport called');

    // Add null checks for required refs
    if (!viewportRef.current || !stageWrapRef.current || !stageRef.current) {
      console.warn('🎨 EditorStage: Missing refs, skipping fitToViewport');
      return;
    }

    const vp = viewportRef.current;
    const wrap = stageWrapRef.current;
    const stage = stageRef.current;
    const { widthPx, heightPx } = designPx;

    console.log('🎨 EditorStage: Design dimensions:', widthPx, 'x', heightPx);
    console.log('🎨 EditorStage: Viewport dimensions:', vp.clientWidth, 'x', vp.clientHeight);

    if (!widthPx || !heightPx) {
      console.log('❌ EditorStage: Invalid design dimensions, skipping fitToViewport');
      return;
    }

    // Calculate optimal scale with better aspect ratio handling and responsive considerations
    const isMobile = vp.clientWidth < 768;
    const isTablet = vp.clientWidth < 1024;

    // Adjust padding based on screen size for better responsive behavior
    const padding = isMobile ? 20 : isTablet ? 40 : 60;
    const availableWidth = vp.clientWidth - padding * 2;
    const availableHeight = vp.clientHeight - padding * 2;

    // Calculate scale factors for both dimensions
    const scaleX = availableWidth / widthPx;
    const scaleY = availableHeight / heightPx;

    // Use the smaller scale to ensure the entire design fits
    let scale = Math.min(scaleX, scaleY);

    // Apply minimum and maximum zoom limits for better UX
    const minScale = 0.05; // Minimum 5% zoom for very small screens
    const maxScale = 3.0; // Maximum 300% zoom

    // Responsive scaling adjustments
    if (isMobile) {
      // On mobile, be more aggressive with scaling to fit content
      scale = Math.max(scale, 0.1); // Ensure minimum visibility on mobile
      scale = Math.min(scale, 1.5); // Don't go too big on small screens
    } else if (isTablet) {
      scale = Math.min(scale, 2.0); // Moderate scaling for tablets
    }

    // For very large designs, cap at reasonable zoom levels
    if (widthPx > 1500 || heightPx > 1500) {
      scale = Math.min(scale, 0.8); // Cap at 80% for very large formats
    }

    // For very small designs, ensure minimum visibility
    if (widthPx < 200 && heightPx < 200) {
      scale = Math.max(scale, 0.8); // Minimum 80% for small formats
    }

    // Apply zoom limits
    scale = Math.max(minScale, Math.min(maxScale, scale));

    // Calculate centered position with improved centering logic and boundary checks
    const scaledWidth = widthPx * scale;
    const scaledHeight = heightPx * scale;

    // For better centering, ensure we account for the design's aspect ratio
    const designAspectRatio = widthPx / heightPx;
    const viewportAspectRatio = vp.clientWidth / vp.clientHeight;

    let finalScale = scale;
    let offsetX = 0;
    let offsetY = 0;

    // If the design is wider than the viewport aspect ratio, fit by height
    if (designAspectRatio > viewportAspectRatio) {
      const availableWidth = vp.clientHeight * designAspectRatio;
      finalScale = Math.min(scale, vp.clientWidth / availableWidth);
    } else {
      const availableHeight = vp.clientWidth / designAspectRatio;
      finalScale = Math.min(scale, vp.clientHeight / availableHeight);
    }

    // Recalculate scaled dimensions with final scale
    const finalScaledWidth = widthPx * finalScale;
    const finalScaledHeight = heightPx * finalScale;

    // Center the design in the viewport, but ensure it doesn't go out of bounds
    offsetX = (vp.clientWidth - finalScaledWidth) / 2;
    offsetY = (vp.clientHeight - finalScaledHeight) / 2;

    // Ensure canvas stays within viewport bounds with padding
    const minOffsetX = -padding;
    const minOffsetY = -padding;
    const maxOffsetX = vp.clientWidth - finalScaledWidth + padding;
    const maxOffsetY = vp.clientHeight - finalScaledHeight + padding;

    offsetX = Math.max(minOffsetX, Math.min(offsetX, maxOffsetX));
    offsetY = Math.max(minOffsetY, Math.min(offsetY, maxOffsetY));

    // Apply smooth transform with transition
    wrap.style.transition = 'transform 0.3s ease-out';
    wrap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${finalScale})`;
    wrap.style.transformOrigin = "top left";

    // Update canvas container to reflect actual design dimensions
    const konvaContainer = document.getElementById('konva-container');
    const htmlOverlay = document.getElementById('html-overlay');

    if (konvaContainer) {
      const scaledWidth = widthPx * finalScale;
      const scaledHeight = heightPx * finalScale;

      // Set the container to match the scaled design dimensions
      konvaContainer.style.width = `${scaledWidth}px`;
      konvaContainer.style.height = `${scaledHeight}px`;
      konvaContainer.style.left = `${offsetX}px`;
      konvaContainer.style.top = `${offsetY}px`;
    }

    // Also update HTML overlay to match
    if (htmlOverlay) {
      const scaledWidth = widthPx * finalScale;
      const scaledHeight = heightPx * finalScale;

      // Position HTML overlay to match canvas container exactly
      htmlOverlay.style.width = `${scaledWidth}px`;
      htmlOverlay.style.height = `${scaledHeight}px`;
      htmlOverlay.style.left = `${offsetX}px`;
      htmlOverlay.style.top = `${offsetY}px`;
      htmlOverlay.style.transform = `scale(${finalScale})`;
      htmlOverlay.style.transformOrigin = 'top left';
    }

    // Update stage size to match design dimensions while preserving aspect ratio
    // Add null check before accessing stage properties
    if (!stage) {
      console.warn('🎨 EditorStage: Stage is null, skipping aspect ratio adjustment');
    } else {
      // Set stage size to design dimensions - the wrapper transform will handle scaling
      stage.width(widthPx);
      stage.height(heightPx);
    }

    // Update zoom state
    setZoom(finalScale);

    console.log('🎨 EditorStage: Applied enhanced transform:', {
      offsetX,
      offsetY,
      scale: finalScale,
      finalScaledWidth,
      finalScaledHeight,
      viewportWidth: vp.clientWidth,
      viewportHeight: vp.clientHeight,
      designAspectRatio: widthPx / heightPx,
      viewportAspectRatio: vp.clientWidth / vp.clientHeight
    });

    // Draw guides if enabled
    if (showGuides && widthPx > 0 && heightPx > 0 && stage && (stage as any).drawGuides) {
      (stage as any).drawGuides(widthPx, heightPx, designPx.offset, 3);
    }

    // Update SelectionManager zoom
    if (managerRef.current) {
      managerRef.current.setZoom(scale);
    }

    // Only draw if stage is available
    if (stage) {
      stage.draw();
    }

    // Remove transition after animation completes
    setTimeout(() => {
      if (wrap.style.transition) {
        wrap.style.transition = '';
      }
    }, 300);
  }, [designPx, showGuides]);

    // Fit to viewport when design dimensions change
    useEffect(() => {
      if (designPx.widthPx && designPx.heightPx) {
        fitToViewport();
      }
    }, [designPx.widthPx, designPx.heightPx]);

    // Handle window resize with debouncing
    useEffect(() => {
      let resizeTimeout: NodeJS.Timeout;

      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (designPx.widthPx && designPx.heightPx && viewportRef.current) {
            console.log('🎨 EditorStage: Window resized, updating canvas position');
            // Use current zoom level to maintain user's zoom preference
            if (zoom > 0) {
              applyZoomChange(zoom);
            } else {
              fitToViewport();
            }
          }
        }, 100); // Debounce resize events
      };

      window.addEventListener("resize", handleResize);
      return () => {
        clearTimeout(resizeTimeout);
        window.removeEventListener("resize", handleResize);
      };
    }, [designPx.widthPx, designPx.heightPx, zoom]);

    // Public API methods
    const addText = useCallback(
      (text?: string, x?: number, y?: number): Konva.Text | null => {
        // Calculate center position for the text, accounting for text dimensions
        const defaultWidth = 200;
        const defaultFontSize = 32;

        const centerX = x ?? Math.max(0, (designPx.widthPx - defaultWidth) / 2);
        const centerY = y ?? Math.max(0, (designPx.heightPx - defaultFontSize) / 2);

        console.log('🎨 EditorStage: Adding text at center position:', { centerX, centerY, designPx });

        // Add text at the specified position with the provided text content
        const newTextNode = managerRef.current?.addText(
          text || "Click to edit text",
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

                // Force sync HTML overlay immediately after adding text
                managerRef.current.syncKonvaToHtml();

                // Also sync after a short delay to ensure proper positioning
                setTimeout(() => {
                  if (managerRef.current) {
                    managerRef.current.syncKonvaToHtml();
                  }
                }, 50);

                setTimeout(() => {
                  const elementData = managerRef.current?.getSelectedElementData();
                  console.log("📋 EditorStage: getSelectedElementData result:", elementData);
                  console.log("📋 EditorStage: elementData type:", elementData?.type);
                  console.log("📋 EditorStage: elementData id:", elementData?.id);
                  console.log("📋 EditorStage: calling onElementSelect with:", elementData);
                  setSelectedElement(elementData);
                  if (onElementSelect) {
                    console.log("📋 EditorStage: onElementSelect callback exists, calling it");
                    onElementSelect(elementData);
                  } else {
                    console.log("📋 EditorStage: onElementSelect callback is undefined!");
                  }
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
        console.log("🖼️ EditorStage: managerRef.current exists:", !!managerRef.current);
        console.log("🖼️ EditorStage: addImageFromUrl exists:", !!managerRef.current?.addImageFromUrl);
        try {
          await managerRef.current?.addImageFromUrl(url, centerX, centerY);
          managerRef.current?.saveState();
          console.log("✅ Image added successfully");

          // Update selection state after image is added
          setTimeout(() => {
            const elementData = managerRef.current?.getSelectedElementData();
            console.log("📋 EditorStage: Image added, updating selection state:", elementData);
            setSelectedElement(elementData);
            if (onElementSelect) {
              console.log("📋 EditorStage: Calling onElementSelect for image:", elementData);
              onElementSelect(elementData);
            }
          }, 50);
        } catch (error) {
          console.error("❌ Failed to add image:", error);
        }
      },
      [designPx.widthPx, designPx.heightPx, onElementSelect]
    );

    const addShape = useCallback(
      (
        shapeType: "rectangle" | "circle" | "ellipse" | "triangle",
        x?: number,
        y?: number
      ): Konva.Shape | null => {
        // Default shape dimensions
        const defaultShapeSize = 100;

        const centerX = x ?? Math.max(0, (designPx.widthPx - defaultShapeSize) / 2);
        const centerY = y ?? Math.max(0, (designPx.heightPx - defaultShapeSize) / 2);

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

    // Enhanced zoom functions with better controls and limits
    // Function to apply zoom changes without recalculating fit
    const applyZoomChange = useCallback((newZoom: number) => {
      console.log('🎨 EditorStage: Applying zoom change to:', newZoom);

      if (!viewportRef.current || !stageWrapRef.current) {
        console.warn('🎨 EditorStage: Missing refs for zoom change');
        return;
      }

      const vp = viewportRef.current;
      const wrap = stageWrapRef.current;
      const { widthPx, heightPx } = designPx;

      // Calculate position based on new zoom level
      const scaledWidth = widthPx * newZoom;
      const scaledHeight = heightPx * newZoom;

      // Ensure the canvas stays within viewport bounds with some padding
      const padding = 20; // Minimum padding from viewport edges
      const maxOffsetX = Math.max(0, vp.clientWidth - scaledWidth - padding);
      const maxOffsetY = Math.max(0, vp.clientHeight - scaledHeight - padding);

      // Calculate centered position but constrain to viewport bounds
      let offsetX = (vp.clientWidth - scaledWidth) / 2;
      let offsetY = (vp.clientHeight - scaledHeight) / 2;

      // Constrain offsets to keep canvas within viewport
      offsetX = Math.max(-padding, Math.min(offsetX, maxOffsetX + padding));
      offsetY = Math.max(-padding, Math.min(offsetY, maxOffsetY + padding));

      // For very large canvases, allow some negative offset to keep part visible
      // but ensure at least 20% of the canvas is visible
      if (scaledWidth > vp.clientWidth) {
        const maxNegativeOffset = -(scaledWidth - vp.clientWidth * 0.2);
        offsetX = Math.max(maxNegativeOffset, offsetX);
      }
      if (scaledHeight > vp.clientHeight) {
        const maxNegativeOffset = -(scaledHeight - vp.clientHeight * 0.2);
        offsetY = Math.max(maxNegativeOffset, offsetY);
      }

      // Ensure canvas doesn't go too far in positive directions either
      if (scaledWidth > vp.clientWidth) {
        offsetX = Math.min(offsetX, padding);
      }
      if (scaledHeight > vp.clientHeight) {
        offsetY = Math.min(offsetY, padding);
      }

      console.log('🎨 EditorStage: Zoom positioning:', {
        newZoom,
        scaledWidth,
        scaledHeight,
        offsetX,
        offsetY,
        viewport: { width: vp.clientWidth, height: vp.clientHeight }
      });

      // Apply transform with new zoom
      wrap.style.transition = 'transform 0.2s ease-out';
      wrap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${newZoom})`;

      // Update canvas container dimensions
      const konvaContainer = document.getElementById('konva-container');
      const htmlOverlay = document.getElementById('html-overlay');

      if (konvaContainer) {
        konvaContainer.style.width = `${scaledWidth}px`;
        konvaContainer.style.height = `${scaledHeight}px`;
        konvaContainer.style.left = `${offsetX}px`;
        konvaContainer.style.top = `${offsetY}px`;
        // Ensure container stays within reasonable bounds
        konvaContainer.style.maxWidth = `${vp.clientWidth + padding * 2}px`;
        konvaContainer.style.maxHeight = `${vp.clientHeight + padding * 2}px`;
      }

      if (htmlOverlay) {
        // Position HTML overlay to match canvas container exactly
        htmlOverlay.style.width = `${scaledWidth}px`;
        htmlOverlay.style.height = `${scaledHeight}px`;
        htmlOverlay.style.left = `${offsetX}px`;
        htmlOverlay.style.top = `${offsetY}px`;
        htmlOverlay.style.transform = `scale(${newZoom})`;
        htmlOverlay.style.transformOrigin = 'top left';
        // Ensure overlay stays within reasonable bounds
        htmlOverlay.style.maxWidth = `${vp.clientWidth + padding * 2}px`;
        htmlOverlay.style.maxHeight = `${vp.clientHeight + padding * 2}px`;
      }

      // Update SelectionManager zoom
      if (managerRef.current) {
        managerRef.current.setZoom(newZoom);
      }

      // Force refresh HTML overlay positioning
      setTimeout(() => {
        if (managerRef.current) {
          managerRef.current.refreshHtmlOverlay();
          // Also trigger syncKonvaToHtml to ensure text overlays are positioned correctly
          managerRef.current.syncKonvaToHtml();
        }
        if (wrap.style.transition) {
          wrap.style.transition = '';
        }
      }, 200);
    }, [designPx]);

    const zoomIn = useCallback(() => {
      const zoomStep = 0.25; // More granular zoom steps
      const maxZoom = 5.0; // Maximum zoom level
      const newZoom = Math.min(zoom + zoomStep, maxZoom);

      if (newZoom !== zoom) {
        setZoom(newZoom);
        applyZoomChange(newZoom);
      }
    }, [zoom, applyZoomChange]);

    const zoomOut = useCallback(() => {
      const zoomStep = 0.25; // More granular zoom steps
      const minZoom = 0.1; // Minimum zoom level
      const newZoom = Math.max(zoom - zoomStep, minZoom);

      if (newZoom !== zoom) {
        setZoom(newZoom);
        applyZoomChange(newZoom);
      }
    }, [zoom, applyZoomChange]);

    // New zoom to specific levels
    const zoomToFit = useCallback(() => {
      fitToViewport();
    }, [fitToViewport]);

    const zoomTo100 = useCallback(() => {
      // Calculate the optimal scale to fit the design at 100% zoom
      if (viewportRef.current) {
        const vp = viewportRef.current;
        const { widthPx, heightPx } = designPx;
        const designAspectRatio = widthPx / heightPx;
        const viewportAspectRatio = vp.clientWidth / vp.clientHeight;

        let optimalScale = 1.0;

        // Adjust scale to fit the design properly at 100%
        if (designAspectRatio > viewportAspectRatio) {
          const availableWidth = vp.clientHeight * designAspectRatio;
          optimalScale = Math.min(1, vp.clientWidth / availableWidth);
        } else {
          const availableHeight = vp.clientWidth / designAspectRatio;
          optimalScale = Math.min(1, vp.clientHeight / availableHeight);
        }

        // Apply the calculated optimal scale
        setZoom(optimalScale);
        applyZoomChange(optimalScale);
      }
    }, [designPx, applyZoomChange]);

    const resetView = useCallback(() => {
      console.log('🎨 EditorStage: Resetting view to fit canvas');
      setZoom(1.0); // Reset zoom to 100%
      fitToViewport(); // Then fit to viewport
    }, [fitToViewport]);

    // Grid and guide controls
    const toggleGuides = useCallback(() => {
      const newShowGuides = !showGuides;
      setShowGuides(newShowGuides);
      if (stageRef.current && (stageRef.current as any).drawGuides && designPx.widthPx > 0 && designPx.heightPx > 0) {
        const { widthPx, heightPx, offset } = designPx;
        (stageRef.current as any).drawGuides(widthPx, heightPx, offset, 3);
      }
    }, [showGuides, designPx]);

    const toggleGrid = useCallback(() => {
      const newShowGrid = !showGrid;
      setShowGrid(newShowGrid);
      if (stageRef.current && (stageRef.current as any).drawGuides && designPx.widthPx > 0 && designPx.heightPx > 0) {
        const { widthPx, heightPx, offset } = designPx;
        (stageRef.current as any).drawGuides(widthPx, heightPx, offset, 3);
      }
    }, [showGrid, designPx]);

    const toggleSnapToGrid = useCallback(() => {
      setSnapToGrid(!snapToGrid);
      if (managerRef.current) {
        managerRef.current.setSnapToGrid(!snapToGrid);
      }
    }, [snapToGrid]);

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
        zoomToFit,
        zoomTo100,
        resetView,
        toggleGuides,
        toggleGrid,
        toggleSnapToGrid,
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
        updateOpacity: withStateUpdate(
          (opacity: number) =>
            managerRef.current?.updateOpacity(opacity) || false
        ),
        updateVisibility: withStateUpdate(
          (visible: boolean) =>
            managerRef.current?.updateVisibility(visible) || false
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
        // Template methods
        loadTemplate: (templateData: any) => {
    console.log("🎨 EditorStage: loadTemplate called with:", templateData);
    return managerRef.current?.loadTemplate(templateData);
  },
        getCurrentTemplate: () => managerRef.current?.getCurrentTemplate(),
        exportAsTemplate: (metadata: any) => managerRef.current?.exportAsTemplate(metadata),
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
    // Memoize the state to prevent unnecessary calls to onStateChange
    const currentState = useMemo(() => ({
      zoom,
      designPx,
      elementCount: managerRef.current?.getAllTexts().length || 0,
      selectedElement,
    }), [zoom, designPx.widthPx, designPx.heightPx, selectedElement?.id]);

    useEffect(() => {
      onStateChange?.(currentState);
    }, [currentState, onStateChange]);

    return (
      <div key={dimensionsKey} className="w-full h-full bg-white">
        <div
          id="editor-viewport"
          ref={viewportRef}
          className="relative w-full h-full bg-gray-50 min-h-[600px] min-w-[400px]"
          style={{ minWidth: '400px', minHeight: '600px' }}
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
              className="absolute pointer-events-none"
              style={{
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                transformOrigin: 'top left'
              }}
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
