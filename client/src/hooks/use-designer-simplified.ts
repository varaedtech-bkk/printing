/*
This file (use-designer-simplified.ts) contains Fabric.js related code that is causing conflicts with the Konva.js editor. 
It has been temporarily commented out to resolve build errors and focus on the Konva.js implementation. 
If Fabric.js functionality is required, this file will need to be properly integrated or refactored.
*/

// import { useState, useEffect, useRef, useMemo } from "react";
// import { useParams } from "wouter";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest } from "@/lib/queryClient";
// import { type Product } from "@shared/prisma-schema";
// import { FabricEditorCore } from "@/lib/fabric-editor-core";
// import { Canvas, IText, Rect, Circle, Triangle, Image } from 'fabric';
// import type { CanvasState } from "@/lib/fabric-editor-core";

// export function useDesignerSimplified() {
//   const params = useParams<{ productId: string }>();
//   const productId = params?.productId ? String(params.productId) : null;
//   const { toast } = useToast();
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const fabricEditorRef = useRef<FabricEditorCore | null>(null);
  
//   // Design state
//   const [selectedTool, setSelectedTool] = useState("select");
//   const [selectedElement, setSelectedElement] = useState<string | null>(null);
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [selectedColors, setSelectedColors] = useState(["#3B82F6", "#8B5CF6", "#F97316"]);
//   const [fontSize, setFontSize] = useState([16]);
//   const [selectedFont, setSelectedFont] = useState("Inter");
//   const [canvasDimensions, setCanvasDimensions] = useState({ width: 400, height: 240 });
//   const [quantity, setQuantity] = useState(1);
//   const [designName, setDesignName] = useState("My Design");
//   const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
//   const [canvasState, setCanvasState] = useState<any>(null);
//   const [isCanvasLoading, setIsCanvasLoading] = useState(true);
//   const [canvasInitialized, setCanvasInitialized] = useState(false);
//   const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);
//   const [selectedObjectUpdateTrigger, setSelectedObjectUpdateTrigger] = useState(0);

//   // Get current user
//   const { data: user } = useQuery({
//     queryKey: ["/api/auth/me"],
//     queryFn: async () => {
//       const response = await fetch("/api/auth/me");
//       if (!response.ok) throw new Error('Failed to fetch user');
//       return response.json();
//     }
//   });

//   const { data: product, isLoading: productLoading, isError: productError } = useQuery<Product>({
//     queryKey: productId ? ["/api/products", productId] : [],
//     queryFn: async () => {
//       if (!productId) return null;
//       const response = await fetch(`/api/products/${productId}`);
//       if (!response.ok) throw new Error('Product not found');
//       return response.json();
//     },
//     enabled: !!productId,
//     retry: false,
//   });

//   const currentProduct = product;

//   // Set canvas dimensions based on product type
//   useEffect(() => {
//     if (currentProduct) {
//       const productName = currentProduct.nameEn.toLowerCase();
//       const specs = currentProduct.specifications;

//       let dimensions = { width: 400, height: 240 }; // default

//       if (specs && typeof specs === 'object' && 'size' in specs && typeof (specs as any).size === 'string') {
//         const sizeMatch = (specs as any).size.match(/(\d+(?:\.\d+)?)cm\s*x\s*(\d+(?:\.\d+)?)cm/);
//         if (sizeMatch) {
//           const widthCm = parseFloat(sizeMatch[1]);
//           const heightCm = parseFloat(sizeMatch[2]);
//           const pixelsPerCm = 37.8;
//           dimensions = {
//             width: Math.round(widthCm * pixelsPerCm),
//             height: Math.round(heightCm * pixelsPerCm)
//           };
//         }
//       }

//       // Fallback to product name patterns
//       if (productName.includes('a2') && productName.includes('poster')) {
//         dimensions = { width: 595, height: 842 };
//       } else if (productName.includes('a3')) {
//         dimensions = { width: 420, height: 595 };
//       } else if (productName.includes('a4') && productName.includes('poster')) {
//         dimensions = { width: 297, height: 420 };
//       } else if (productName.includes('a5') && productName.includes('flyer')) {
//         dimensions = { width: 210, height: 297 };
//       } else if (productName.includes('flyer')) {
//         dimensions = { width: 300, height: 400 };
//       } else if (productName.includes('poster')) {
//         dimensions = { width: 350, height: 500 };
//       } else if (productName.includes('banner')) {
//         dimensions = { width: 500, height: 200 };
//       }

//       setCanvasDimensions(dimensions);
//     }
//   }, [currentProduct]);

//   // Canvas initialization
//   useEffect(() => {
//     if (fabricEditorRef.current || canvasInitialized) {
//       return;
//     }

//     console.log('🚀 Starting canvas initialization...');
//     setIsCanvasLoading(true);

//     const initializeCanvas = async () => {
//       try {
//         // Wait for canvas element to be available
//         let canvasElement = document.getElementById('design-canvas');
//         let retryCount = 0;
//         const maxRetries = 50; // Increased retries

//         while (!canvasElement && retryCount < maxRetries) {
//           console.log(`⏳ Canvas element not found, retrying... (${retryCount + 1}/${maxRetries})`);
//           await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay
//           canvasElement = document.getElementById('design-canvas');
//           retryCount++;
//         }

//         if (!canvasElement || canvasElement.tagName !== 'CANVAS') {
//           console.error('❌ Canvas element not found after retries');
//           setIsCanvasLoading(false);
//           return;
//         }

//         console.log('✅ Canvas element found');

//         // Create FabricEditorCore instance
//         fabricEditorRef.current = new FabricEditorCore('design-canvas', {
//           onStateChange: (state: CanvasState) => {
//             setCanvasState(state);
//           },
//         });

//         // Initialize canvas
//         await fabricEditorRef.current.initializeCanvas(canvasDimensions.width, canvasDimensions.height);

//         if (fabricEditorRef.current.isInitialized()) {
//           console.log('✅ Canvas initialized successfully');
//           setCanvasInitialized(true);
//           setIsCanvasLoading(false);

//           // Post-initialization setup
//           setTimeout(() => {
//             if (fabricEditorRef.current && fabricEditorRef.current.isInitialized()) {
//               try {
//                 console.log('🔧 Running post-initialization setup...');
                
//                 // Force refresh all objects
//                 fabricEditorRef.current.forceRefreshCanvas();

//                 // Attach selection listeners
//                 const canvas = fabricEditorRef.current.getCanvas();
//                 if (canvas && typeof canvas.on === 'function') {
//                   const bump = () => setSelectedObjectUpdateTrigger(prev => prev + 1);
//                   canvas.on('selection:created', bump);
//                   canvas.on('selection:updated', bump);
//                   canvas.on('selection:cleared', bump);
//                   canvas.on('object:modified', bump);
//                 }

//                 console.log('✅ Post-initialization setup complete');
//               } catch (error) {
//                 console.error('❌ Error in post-initialization setup:', error);
//               }
//             }
//           }, 100);
//         } else {
//           throw new Error('Canvas initialization failed');
//         }

//       } catch (error) {
//         console.error('❌ Canvas initialization failed:', error);
//         setIsCanvasLoading(false);
//         toast({
//           title: "Canvas Initialization Failed",
//           description: "Please refresh the page to try again.",
//           variant: "destructive",
//         });
//       }
//     };

//     // Wait for DOM to be ready, then initialize
//     const initTimer = setTimeout(() => {
//       if (document.readyState === 'loading') {
//         document.addEventListener('DOMContentLoaded', initializeCanvas);
//       } else {
//         initializeCanvas();
//       }
//     }, 200); // Increased delay

//     return () => {
//       clearTimeout(initTimer);
//       document.removeEventListener('DOMContentLoaded', initializeCanvas);
//     };
//   }, [canvasInitialized, canvasDimensions.width, canvasDimensions.height]); // Added dependencies

//   // Monitor canvas element availability
//   useEffect(() => {
//     if (fabricEditorRef.current || canvasInitialized) {
//       return;
//     }

//     const checkCanvasElement = () => {
//       const canvasElement = document.getElementById('design-canvas');
//       if (canvasElement && canvasElement.tagName === 'CANVAS') {
//         // Check if the canvas is properly rendered
//         const rect = canvasElement.getBoundingClientRect();
//         const isVisible = rect.width > 0 && rect.height > 0;
        
//         if (isVisible) {
//           console.log('🎯 Canvas element detected and properly rendered:', {
//             width: rect.width,
//             height: rect.height,
//             top: rect.top,
//             left: rect.left
//           });
//           // Trigger initialization by updating a dependency
//           setCanvasDimensions(prev => ({ ...prev }));
//         } else {
//           console.log('⏳ Canvas element found but not yet rendered:', {
//             width: rect.width,
//             height: rect.height,
//             top: rect.top,
//             left: rect.left
//           });
//         }
//       }
//     };

//     // Check immediately
//     checkCanvasElement();

//     // Set up a more aggressive polling
//     const interval = setInterval(checkCanvasElement, 100);
    
//     // Also use MutationObserver to watch for DOM changes
//     const observer = new MutationObserver((mutations) => {
//       mutations.forEach((mutation) => {
//         if (mutation.type === 'childList') {
//           checkCanvasElement();
//         }
//       });
//     });

//     observer.observe(document.body, {
//       childList: true,
//       subtree: true
//     });

//     return () => {
//       clearInterval(interval);
//       observer.disconnect();
//     };
//   }, [canvasInitialized]);

//   // Additional effect to wait for canvas to be fully ready
//   useEffect(() => {
//     if (fabricEditorRef.current || canvasInitialized) {
//       return;
//     }

//     const waitForCanvasReady = () => {
//       const canvasElement = document.getElementById('design-canvas') as HTMLCanvasElement;
//       if (canvasElement && canvasElement.tagName === 'CANVAS') {
//         // Wait for the canvas to have proper dimensions
//         const checkDimensions = () => {
//           const rect = canvasElement.getBoundingClientRect();
//           if (rect.width > 0 && rect.height > 0) {
//             console.log('🎯 Canvas is fully ready with dimensions:', {
//               width: rect.width,
//               height: rect.height
//             });
//             // Small delay to ensure everything is rendered
//             setTimeout(() => {
//               setCanvasDimensions(prev => ({ ...prev }));
//             }, 50);
//             return true;
//           }
//           return false;
//         };

//         if (!checkDimensions()) {
//           // If not ready, check again after a short delay
//           setTimeout(checkDimensions, 100);
//         }
//       }
//     };

//     // Wait a bit longer for the component to fully render
//     const timer = setTimeout(waitForCanvasReady, 300);
    
//     return () => clearTimeout(timer);
//   }, [canvasInitialized]);

//   // Manual initialization method for debugging
//   const manualInitializeCanvas = async () => {
//     if (fabricEditorRef.current || canvasInitialized) {
//       console.log('Canvas already initialized or initializing');
//       return;
//     }

//     console.log('🔧 Manual canvas initialization triggered');
//     setIsCanvasLoading(true);

//     try {
//       const canvasElement = document.getElementById('design-canvas');
//       if (!canvasElement || canvasElement.tagName !== 'CANVAS') {
//         throw new Error(`Canvas element not found. DOM state: ${document.readyState}, Canvas element: ${canvasElement ? 'exists but wrong type' : 'not found'}`);
//       }

//       console.log('✅ Canvas element found for manual initialization');

//       // Create FabricEditorCore instance
//       fabricEditorRef.current = new FabricEditorCore('design-canvas', {
//         onStateChange: (state: CanvasState) => {
//           setCanvasState(state);
//         },
//       });

//       // Initialize canvas
//       await fabricEditorRef.current.initializeCanvas(canvasDimensions.width, canvasDimensions.height);

//       if (fabricEditorRef.current.isInitialized()) {
//         console.log('✅ Manual canvas initialization successful');
//         setCanvasInitialized(true);
//         setIsCanvasLoading(false);
//       } else {
//         throw new Error('Canvas initialization failed after manual trigger');
//       }
//     } catch (error) {
//       console.error('❌ Manual canvas initialization failed:', error);
//       setIsCanvasLoading(false);
//       toast({
//         title: "Manual Canvas Initialization Failed",
//         description: String(error),
//         variant: "destructive",
//       });
//     }
//   };

//   // Handle window resize
//   useEffect(() => {
//     const handleWindowResize = () => {
//       if (fabricEditorRef.current && canvasInitialized) {
//         setTimeout(() => {
//           const canvas = fabricEditorRef.current?.getCanvas();
//           if (canvas) {
//             const canvasElement = canvas.getElement();
//             if (canvasElement && canvasElement.parentElement) {
//               const container = canvasElement.parentElement;
//               const containerRect = container.getBoundingClientRect();
//               const maxWidth = Math.min(containerRect.width, window.innerWidth - 100);
//               const maxHeight = Math.min(containerRect.height || window.innerHeight - 200, window.innerHeight * 0.7);
              
//               const canvasAspectRatio = canvas.width / canvas.height;
//               const containerAspectRatio = maxWidth / maxHeight;
              
//               let displayWidth, displayHeight;
//               if (canvasAspectRatio > containerAspectRatio) {
//                 displayWidth = maxWidth;
//                 displayHeight = maxWidth / canvasAspectRatio;
//               } else {
//                 displayHeight = maxHeight;
//                 displayWidth = maxHeight * canvasAspectRatio;
//               }
              
//               canvasElement.style.width = `${displayWidth}px`;
//               canvasElement.style.height = `${displayHeight}px`;
//             }
//           }
//         }, 100);
//       }
//     };

//     window.addEventListener('resize', handleWindowResize);

//     if (canvasInitialized && fabricEditorRef.current) {
//       setTimeout(handleWindowResize, 500);
//     }

//     return () => {
//       window.removeEventListener('resize', handleWindowResize);
//     };
//   }, [canvasInitialized]);

//   // Resize canvas when dimensions change
//   useEffect(() => {
//     if (!fabricEditorRef.current || !canvasInitialized || !currentProduct) {
//       return;
//     }

//     const canvas = fabricEditorRef.current.getCanvas();
//     if (canvas) {
//       canvas.setDimensions(canvasDimensions);
//       canvas.renderAll();
//     }
//   }, [canvasDimensions, canvasInitialized, currentProduct]);

//   // AI Mutations
//   const generateDesignMutation = useMutation({
//     mutationFn: async (prompt: string) => {
//       const response = await fetch('/api/ai/generate-design', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ prompt, productId })
//       });
//       return response.json();
//     },
//     onSuccess: (data) => {
//       toast({
//         title: "Design Generated!",
//         description: "Your AI-generated design has been created.",
//       });
//     },
//     onError: (error) => {
//       toast({
//         title: "Generation Failed",
//         description: "Failed to generate design. Please try again.",
//         variant: "destructive",
//       });
//     }
//   });

//   const generateColorPaletteMutation = useMutation({
//     mutationFn: async (data: { description: string; industry: string }) => {
//       const response = await fetch('/api/ai/generate-colors', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data)
//       });
//       return response.json();
//     },
//     onSuccess: (data) => {
//       if (data.colors && Array.isArray(data.colors)) {
//         setSelectedColors(data.colors);
//         toast({
//           title: "Color Palette Generated!",
//           description: "New colors have been applied to your design.",
//         });
//       }
//     },
//     onError: (error) => {
//       toast({
//         title: "Color Generation Failed",
//         description: "Failed to generate color palette. Please try again.",
//         variant: "destructive",
//       });
//     }
//   });

//   const saveDesignMutation = useMutation({
//     mutationFn: async (designData: any) => {
//       const response = await fetch('/api/designs', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(designData)
//       });
//       return response.json();
//     },
//     onSuccess: (data) => {
//       toast({
//         title: "Design Saved!",
//         description: "Your design has been saved successfully.",
//       });
//     },
//     onError: (error) => {
//       toast({
//         title: "Save Failed",
//         description: "Failed to save design. Please try again.",
//         variant: "destructive",
//       });
//     }
//   });

//   // Canvas operations
//   const addTextElement = () => {
//     if (fabricEditorRef.current && fabricEditorRef.current.isInitialized()) {
//       fabricEditorRef.current.addText('Sample Text', {
//         x: 100,
//         y: 100,
//         fontSize: 24,
//         fill: '#FF0000'
//       });
//     }
//   };

//   const deleteSelected = () => {
//     if (fabricEditorRef.current && fabricEditorRef.current.isInitialized()) {
//       fabricEditorRef.current.deleteSelected();
//     }
//   };

//   const duplicateSelected = () => {
//     if (fabricEditorRef.current && fabricEditorRef.current.isInitialized()) {
//       fabricEditorRef.current.duplicateSelected();
//     }
//   };

//   const alignObjects = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
//     if (fabricEditorRef.current && fabricEditorRef.current.isInitialized()) {
//       const canvas = fabricEditorRef.current.getCanvas();
//       if (canvas) {
//         const activeObjects = canvas.getActiveObjects();
//         if (activeObjects.length < 2) return;

//         let referenceValue: number;

//         switch (alignment) {
//           case 'left':
//             referenceValue = Math.min(...activeObjects.map((obj: any) => obj.left || 0));
//             activeObjects.forEach((obj: any) => obj.set('left', referenceValue));
//             break;
//           case 'center':
//             referenceValue = activeObjects.reduce((sum: number, obj: any) => 
//               sum + (obj.left || 0) + (obj.width || 0) / 2, 0) / activeObjects.length;
//             activeObjects.forEach((obj: any) => 
//               obj.set('left', referenceValue - (obj.width || 0) / 2));
//             break;
//           case 'right':
//             referenceValue = Math.max(...activeObjects.map((obj: any) => 
//               (obj.left || 0) + (obj.width || 0)));
//             activeObjects.forEach((obj: any) => 
//               obj.set('left', referenceValue - (obj.width || 0)));
//             break;
//           case 'top':
//             referenceValue = Math.min(...activeObjects.map((obj: any) => obj.top || 0));
//             activeObjects.forEach((obj: any) => obj.set('top', referenceValue));
//             break;
//           case 'middle':
//             referenceValue = activeObjects.reduce((sum: number, obj: any) => 
//               sum + (obj.top || 0) + (obj.height || 0) / 2, 0) / activeObjects.length;
//             activeObjects.forEach((obj: any) => 
//               obj.set('top', referenceValue - (obj.height || 0) / 2));
//             break;
//           case 'bottom':
//             referenceValue = Math.max(...activeObjects.map((obj: any) => 
//               (obj.top || 0) + (obj.height || 0)));
//             activeObjects.forEach((obj: any) => 
//               obj.set('top', referenceValue - (obj.height || 0)));
//             break;
//         }

//         canvas.renderAll();
//       }
//     }
//   };

//   const groupObjects = () => {
//     if (fabricEditorRef.current && fabricEditorRef.current.isInitialized()) {
//       const canvas = fabricEditorRef.current.getCanvas();
//       if (canvas) {
//         const activeObjects = canvas.getActiveObjects();
//         if (activeObjects.length < 2) return;

//         const group = new (window as any).fabric.Group(activeObjects, {
//           left: 0,
//           top: 0,
//         });

//         canvas.remove(...activeObjects);
//         canvas.add(group);
//         canvas.setActiveObject(group);
//         canvas.renderAll();
//       }
//     }
//   };

//   const ungroupObjects = () => {
//     if (fabricEditorRef.current && fabricEditorRef.current.isInitialized()) {
//       const canvas = fabricEditorRef.current.getCanvas();
//       if (canvas) {
//         const activeObject = canvas.getActiveObject();
//         if (activeObject && activeObject.type === 'group') {
//           const group = activeObject as any;
//           const items = group.getObjects();
          
//           canvas.remove(group);
//           items.forEach((item: any) => {
//             canvas.add(item);
//           });
          
//           canvas.renderAll();
//         }
//       }
//     }
//   };

//   // File handling
//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setUploadedDesign(e.target?.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const loadUploadedDesign = () => {
//     if (uploadedDesign && fabricEditorRef.current) {
//       // For now, just add a placeholder
//       fabricEditorRef.current.addShape('rectangle', {
//         x: 100,
//         y: 100,
//         width: 200,
//         height: 150,
//         color: '#f0f0f0'
//       });
//     }
//   };

//   // Design operations
//   const handleSaveDesign = async () => {
//     if (!fabricEditorRef.current || !currentProduct) return;

//     try {
//       const canvas = fabricEditorRef.current.getCanvas();
//       if (!canvas) return;

//       const designData = {
//         name: designName,
//         productId: currentProduct.id,
//         canvasData: fabricEditorRef.current.exportToJSON(),
//         preview: canvas.toDataURL(),
//         quantity
//       };

//       await saveDesignMutation.mutateAsync(designData);
//     } catch (error) {
//       console.error('Failed to save design:', error);
//     }
//   };

//   const handleAddToCart = async () => {
//     if (!currentProduct) return;

//     try {
//       const canvas = fabricEditorRef.current?.getCanvas();
//       if (!canvas) return;

//       const designData = {
//         productId: currentProduct.id,
//         canvasData: fabricEditorRef.current?.exportToJSON(),
//         preview: canvas.toDataURL(),
//         quantity
//       };

//       // Add to cart logic here
//       toast({
//         title: "Added to Cart!",
//         description: "Your design has been added to the cart.",
//       });
//     } catch (error) {
//       console.error('Failed to add to cart:', error);
//     }
//   };

//   const onDownloadPreview = () => {
//     if (!fabricEditorRef.current) return;

//     const canvas = fabricEditorRef.current.getCanvas();
//     if (!canvas) return;

//     const link = document.createElement('a');
//     link.download = `${designName || 'design'}.png`;
//     link.href = canvas.toDataURL();
//     link.click();
//   };

//   const exportForPrint = () => {
//     if (!fabricEditorRef.current) return;

//     const canvas = fabricEditorRef.current.getCanvas();
//     if (!canvas) return;

//     // Export logic for print
//     const printData = {
//       canvasData: fabricEditorRef.current.exportToJSON(),
//       dimensions: canvasDimensions,
//       product: currentProduct
//     };

//     console.log('Exporting for print:', printData);
//     toast({
//       title: "Print Export Ready",
//       description: "Your design has been prepared for print.",
//     });
//   };

//   const validateForPrint = () => {
//     if (!fabricEditorRef.current) return { isValid: false, issues: ['Canvas not ready'] };

//     const canvas = fabricEditorRef.current.getCanvas();
//     if (!canvas) return { isValid: false, issues: ['Canvas not available'] };

//     const objects = canvas.getObjects();
//     const issues: string[] = [];

//     if (objects.length === 0) {
//       issues.push("Design is empty - please add some content");
//     }

//     objects.forEach((obj: any) => {
//       if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
//         const fontSize = obj.fontSize || 12;
//         if (fontSize < 8) {
//           issues.push(`Text size ${fontSize}px is too small for print (minimum 8px recommended)`);
//         }
//       }
//     });

//     return {
//       isValid: issues.length === 0,
//       issues
//     };
//   };



//   // Undo/Redo
//   const undo = () => {
//     // Implement undo logic
//     console.log('Undo');
//   };

//   const redo = () => {
//     // Implement redo logic
//     console.log('Redo');
//   };

//   // Export functions for global access
//   useEffect(() => {
//     if (fabricEditorRef.current) {
//       (window as any).fabricEditor = fabricEditorRef.current;
//       (window as any).addText = addTextElement;
//       (window as any).createTestObject = () => debugMethods.createTestObject?.();
//       (window as any).manualInitializeCanvas = manualInitializeCanvas;
//       (window as any).debugTextVisibility = () => debugMethods.debugTextVisibility?.();
//       (window as any).runComprehensiveTest = () => debugMethods.runComprehensiveTest?.();
//     }
//   }, [fabricEditorRef.current, debugMethods]);

//   // Expose methods from FabricEditorCore
//   const {
//     addText,
//     addShape,
//     clearCanvas,
//     resizeCanvas,
//     getCanvasDimensions,
//   } = fabricEditorRef.current || {};

//   // Debug methods with type assertion
//   const debugMethods = (fabricEditorRef.current as any) || {};

//   // Add shape element
//   const addShapeElement = (shapeType: "rectangle" | "circle" | "triangle", options: any = {}) => {
//     if (fabricEditorRef.current) {
//       return fabricEditorRef.current.addShape(shapeType, options);
//     }
//     return false;
//   };

//     // Expose methods for external use
//   return {
//     // Core methods
//     addTextElement,
//     addShapeElement,
//     clearCanvas,
//     resizeCanvas,
//     getCanvasDimensions,
//     selectedElement,
//     validateForPrint,

//     // Debug and test methods
//     forceRefreshCanvas: () => debugMethods.forceRefreshCanvas?.() || false,
//     createTestObject: () => debugMethods.createTestObject?.() || false,
//     forceObjectVisibility: () => debugMethods.forceObjectVisibility?.() || false,
//     reviseCanvas: () => debugMethods.reviseCanvas?.() || false,
//     nuclearRebuild: () => debugMethods.nuclearRebuild?.() || false,
//     forceCanvasDisplay: () => debugMethods.forceCanvasDisplay?.() || false,
//     restoreInteractivity: () => debugMethods.restoreInteractivity?.() || false,
//     nuclearInteractivityFix: () => debugMethods.nuclearInteractivityFix?.() || false,
//     finalTest: () => debugMethods.finalTest?.() || false,
//     forceObjectInteractivity: () => debugMethods.forceObjectInteractivity?.() || false,

//     // State
//     productLoading,
//     currentProduct,
//     isInitialized: !!fabricEditorRef.current
//   };
// }
