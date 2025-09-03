import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Link, useSearch } from "wouter";
import Navigation from "@/components/navigation";
import EditorStage from "@/components/designer/EditorStage";
import { PropertiesPanel } from "@/components/designer/PropertiesPanel";
import { TemplateGallery } from "@/components/designer/TemplateGallery";
import { AIEnhancedToolsPanel } from "@/components/designer/AIEnhancedToolsPanel";
import { ProductSelector } from "@/components/designer/ProductSelector";
import ExportPanel from "@/components/ExportPanel";
import { PrintProduct } from "@/lib/print-product-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/hooks/use-cart";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Template } from "@/lib/template-schema";
import { templateService } from "@/lib/template-service";
import {
  Sparkles,
  Palette,
  Menu,
  X,
  Plus,
  Save,
  Download,
  Square,
  Circle,
  Triangle,
  Type,
  Image,
  Undo,
  Redo,
  ShoppingCart,
  Settings,
  Brain,
  Zap,
  Eye,
  EyeOff,
  Upload,
  Wand2,
  Layers,
  Grid3X3,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  LayoutTemplate,
  Star,
} from "lucide-react";
import { aiService, AITextSuggestion, AIColorPalette, AILayoutSuggestion, AIImageSuggestion, createAITemplateRequest } from '@/lib/ai-service';

// Compact Sidebar Component
const CompactSidebar: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
}> = ({ title, icon, children, isCollapsed = false, onToggle }) => {
  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 relative group ${
      isCollapsed ? 'w-12 md:w-16 hover:w-20 md:hover:w-24 hover:shadow-lg' : 'w-48 md:w-64'
    }`}>
      {/* Tooltip for collapsed sidebar */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
          Click to expand Design Tools
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 border-4 border-transparent border-r-gray-800"></div>
        </div>
      )}
      {/* Header */}
      <div className={`p-3 md:p-4 border-b border-gray-200 flex items-center justify-between ${
        isCollapsed ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
      }`} onClick={isCollapsed ? onToggle : undefined}>
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className={`bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isCollapsed ? 'w-8 h-8 md:w-10 md:h-10' : 'w-6 h-6 md:w-8 md:h-8'
          }`}>
            {icon}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 truncate">{title}</h3>
              <p className="text-xs text-gray-500 hidden md:block">Tools & Options</p>
            </div>
          )}
          {isCollapsed && (
            <div className="min-w-0 flex-1 ml-2">
              <p className="text-xs font-medium text-gray-700 truncate">{title}</p>
            </div>
          )}
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`flex-shrink-0 transition-all duration-200 ${
              isCollapsed
                ? 'h-8 w-8 md:h-10 md:w-10 p-0 bg-blue-100 hover:bg-blue-200'
                : 'h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-gray-100'
            }`}
            title={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            ) : (
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {children}
      </div>
    </div>
  );
};

// Mock template data with enhanced backgrounds and content
const MOCK_TEMPLATES = [
  {
    id: "template-1",
    name: "Modern Business Card",
    category: "business-cards",
    background: "#ffffff",
    accentColor: "#3b82f6",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzNiODJmNiIvPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMDAwIj5Nb2Rlcm4gQnVzaW5lc3M8L3RleHQ+PHRleHQgeD0iMTAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiPkNhcmQgRGVzaWduPC90ZXh0Pjwvc3ZnPg==",
    rating: 4.8,
    downloads: 1250,
    tags: ["modern", "professional", "clean"],
    elements: [
      { type: "rect", x: 0, y: 0, width: 90, height: 10, fill: "#3b82f6" },
      {
        type: "text",
        x: 10,
        y: 25,
        text: "JOHN DOE",
        fontSize: 16,
        fontFamily: "Arial",
        fill: "#000000",
      },
      {
        type: "text",
        x: 10,
        y: 40,
        text: "CEO & Founder",
        fontSize: 12,
        fontFamily: "Arial",
        fill: "#666666",
      },
      {
        type: "text",
        x: 10,
        y: 50,
        text: "john@company.com",
        fontSize: 10,
        fontFamily: "Arial",
        fill: "#666666",
      },
    ],
  },
  {
    id: "template-2",
    name: "Vintage Postcard",
    category: "postcards",
    background: "#fef3c7",
    accentColor: "#8b5a3a",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVmM2M3Ii8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzhiNWEzYSIvPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOGI1YTNhIj5WaW50YWdlPC90ZXh0Pjx0ZXh0IHg9IjEwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOGI1YTNhIj5Qb3N0Y2FyZDwvdGV4dD48L3N2Zz4=",
    rating: 4.7,
    downloads: 980,
    tags: ["vintage", "retro", "nostalgic"],
    elements: [
      { type: "rect", x: 0, y: 0, width: 148, height: 15, fill: "#8b5a3a" },
      {
        type: "text",
        x: 20,
        y: 40,
        text: "Greetings from",
        fontSize: 18,
        fontFamily: "Georgia",
        fill: "#8b5a3a",
      },
      {
        type: "text",
        x: 20,
        y: 70,
        text: "Beautiful Destination",
        fontSize: 24,
        fontFamily: "Georgia",
        fill: "#8b5a3a",
      },
    ],
  },
  {
    id: "template-3",
    name: "Creative Flyer",
    category: "flyers",
    background: "#fef2f2",
    accentColor: "#ef4444",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVmMmYyIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2VmNDQ0NCIvPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZWY0NDQ0Ij5DcmVhdGl2ZTwvdGV4dD48dGV4dCB4PSIxMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2VmNDQ0NCI+Rmx5ZXIgRGVzaWduPC90ZXh0Pjwvc3ZnPg==",
    rating: 4.6,
    downloads: 890,
    tags: ["creative", "colorful", "eye-catching"],
    elements: [
      { type: "rect", x: 0, y: 0, width: 148, height: 20, fill: "#ef4444" },
      {
        type: "text",
        x: 30,
        y: 60,
        text: "SPECIAL EVENT",
        fontSize: 28,
        fontFamily: "Arial",
        fill: "#ef4444",
      },
      {
        type: "text",
        x: 30,
        y: 100,
        text: "Join us for an amazing experience",
        fontSize: 16,
        fontFamily: "Arial",
        fill: "#374151",
      },
      {
        type: "text",
        x: 30,
        y: 140,
        text: "Date: December 15, 2024",
        fontSize: 14,
        fontFamily: "Arial",
        fill: "#6b7280",
      },
    ],
  },
  {
    id: "template-4",
    name: "Elegant Poster",
    category: "posters",
    background: "#1f2937",
    accentColor: "#fbbf24",
    thumbnail:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2ZiYmYyNCIvPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmJiZjI0Ij5FbGVnYW50PC90ZXh0Pjx0ZXh0IHg9IjEwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmJiZjI0Ij5Qb3N0ZXIgRGVzaWduPC90ZXh0Pjwvc3ZnPg==",
    rating: 4.9,
    downloads: 2100,
    tags: ["elegant", "minimal", "sophisticated"],
    elements: [
      { type: "rect", x: 0, y: 0, width: 297, height: 30, fill: "#fbbf24" },
      {
        type: "text",
        x: 50,
        y: 100,
        text: "EXHIBITION",
        fontSize: 48,
        fontFamily: "Georgia",
        fill: "#fbbf24",
      },
      {
        type: "text",
        x: 50,
        y: 200,
        text: "Contemporary Art Gallery",
        fontSize: 24,
        fontFamily: "Georgia",
        fill: "#ffffff",
      },
      {
        type: "text",
        x: 50,
        y: 300,
        text: "Opening Night: January 20, 2025",
        fontSize: 18,
        fontFamily: "Georgia",
        fill: "#d1d5db",
      },
    ],
  },
];

// Mock AI suggestions
const MOCK_AI_SUGGESTIONS = [
  {
    id: "ai-1",
    type: "color-palette",
    title: "Modern Color Palette",
    description: "Professional blues and grays",
    colors: ["#1e40af", "#3b82f6", "#64748b", "#94a3b8", "#e2e8f0"],
  },
  {
    id: "ai-2",
    type: "layout",
    title: "Grid Layout",
    description: "Clean 3-column grid system",
    preview: "grid-layout-preview",
  },
  {
    id: "ai-3",
    type: "typography",
    title: "Typography Pairing",
    description: "Inter + Playfair Display",
    fonts: ["Inter", "Playfair Display"],
  },
];

// Mock product data - maps to database product slugs
const MOCK_PRODUCTS = [
  {
    id: "business-card",
    nameEn: "Business Card",
    category: "business-cards",
    dimensions: { width: 90, height: 54 },
    description: "Standard business card size",
    priceRange: "฿50-200",
    useCases: ["Corporate branding", "Personal networking"],
    basePrice: 100,
    databaseSlug: "standard-business-card", // Maps to actual database product
  },
  {
    id: "postcard",
    nameEn: "Postcard",
    category: "postcards",
    dimensions: { width: 148, height: 105 },
    description: "Standard postcard size",
    priceRange: "฿100-300",
    useCases: ["Marketing campaigns", "Event invitations"],
    basePrice: 150,
    databaseSlug: "a4-flyer", // Maps to actual database product
  },
  {
    id: "flyer-a5",
    nameEn: "A5 Flyer",
    category: "flyers",
    dimensions: { width: 148, height: 210 },
    description: "Compact A5 size for flyers",
    priceRange: "฿150-500",
    useCases: ["Event promotion", "Product catalogs"],
    basePrice: 200,
    databaseSlug: "a4-flyer", // Maps to actual database product
  },
  {
    id: "flyer-a4",
    nameEn: "A4 Flyer",
    category: "flyers",
    dimensions: { width: 210, height: 297 },
    description: "Standard A4 size for detailed information",
    priceRange: "฿200-800",
    useCases: ["Event promotion", "Product catalogs"],
    basePrice: 300,
    databaseSlug: "a4-flyer", // Maps to actual database product
  },
  {
    id: "poster-a3",
    nameEn: "A3 Poster",
    category: "posters",
    dimensions: { width: 297, height: 420 },
    description: "Large format for impactful displays",
    priceRange: "฿500-1500",
    useCases: ["Event advertising", "Brand promotion"],
    basePrice: 800,
    databaseSlug: "vinyl-banner", // Maps to actual database product
  },
];

export default function AIDesigner() {
  const { toast } = useToast();
  const { userId } = useAuth();
  const { cartCount } = useCart();
  const searchParams = useSearch();

  // Core state - simplified
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(null);
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [activePanel, setActivePanel] = useState<'design' | 'ai' | 'templates' | 'properties' | 'export'>('design');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [designName, setDesignName] = useState("Untitled Design");
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 210, // A4 width in mm
    height: 297, // A4 height in mm
  });
  const [zoom, setZoom] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [toolbarMode, setToolbarMode] = useState<'fixed' | 'floating'>('fixed');
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const editorRef = useRef<any>(null);
  const [editorReady, setEditorReady] = useState(false);

  // Monitor editor initialization
  useEffect(() => {
    const checkEditorReady = () => {
      console.log("🔍 Checking editor readiness...");
      console.log("🔍 editorRef.current:", editorRef.current);
      
      if (editorRef.current) {
        console.log("🔍 Editor ref exists, checking methods:");
        console.log("🔍 addText:", typeof editorRef.current.addText);
        console.log("🔍 addShape:", typeof editorRef.current.addShape);
        console.log("🔍 addImage:", typeof editorRef.current.addImage);
        console.log("🔍 All methods:", Object.keys(editorRef.current));
      }
      
      if (editorRef.current && 
          editorRef.current.addText && 
          editorRef.current.addShape && 
          editorRef.current.addImage) {
        console.log("✅ Editor is ready with all methods available");
        setEditorReady(true);
      } else {
        console.log("⏳ Editor not ready yet, checking again...");
        console.log("⏳ selectedProduct:", selectedProduct);
        console.log("⏳ canvasDimensions:", canvasDimensions);
        setEditorReady(false);
      }
    };

    // Check immediately
    checkEditorReady();

    // Check periodically until ready (but stop after 30 seconds to avoid infinite checking)
    const interval = setInterval(checkEditorReady, 500);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!editorReady) {
        console.error("❌ Editor failed to initialize after 30 seconds");
        toast({
          title: "Editor Initialization Failed",
          description: "Please refresh the page to try again.",
          variant: "destructive"
        });
      }
    }, 30000);

    // Cleanup
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [selectedProduct, canvasDimensions, editorReady, toast]);

  // Initialize with default product
  useEffect(() => {
    if (!selectedProduct) {
      const defaultProduct: PrintProduct = {
        id: 'a4-flyer',
        name: 'A4 Flyer',
        nameEn: 'A4 Flyer',
        category: 'flyers',
        dimensions: {
          width: 210,
          height: 297,
          bleed: 3,
          safeZone: 5,
          dpi: 300
        },
        previewScale: 0.5,
        description: 'Standard A4 flyer size',
        useCases: ['Marketing campaigns', 'Event promotion'],
        priceRange: '฿200-800'
      };
      setSelectedProduct(defaultProduct);
      // Also set canvas dimensions for the default product
      setCanvasDimensions({
        width: defaultProduct.dimensions.width,
        height: defaultProduct.dimensions.height,
      });
    }
  }, []); // Remove selectedProduct dependency to prevent infinite loop

  // Simplified handlers
  const handleProductSelect = useCallback((product: PrintProduct) => {
      console.log('🎯 handleProductSelect called with:', product.nameEn, product.dimensions);
      console.log('🎯 Previous canvas dimensions:', canvasDimensions);

      setSelectedProduct(product);
      setCanvasDimensions({
        width: product.dimensions.width,
        height: product.dimensions.height,
      });

      console.log('🎯 Canvas dimensions updated to:', product.dimensions.width, 'x', product.dimensions.height);
      console.log('🎯 Aspect ratio:', product.dimensions.width / product.dimensions.height);

      toast({
        title: "Product Selected",
        description: `${product.nameEn} (${product.dimensions.width}×${product.dimensions.height}mm) - ${((product.dimensions.width / product.dimensions.height) * 100).toFixed(1)}% aspect ratio`,
      });
  }, [toast, canvasDimensions]);

  const handleElementSelect = useCallback((element: any) => {
    console.log('🎯 handleElementSelect called with:', element?.id || 'null');
    // Use functional state update to prevent stale closure issues
    setSelectedElements(currentElements => {
      // Prevent unnecessary updates if the element hasn't changed
      const newElements = element ? [element] : [];
      const hasChanged = currentElements.length !== newElements.length ||
                        (currentElements[0]?.id !== newElements[0]?.id);
      if (!hasChanged) {
        console.log('🎯 handleElementSelect: No change detected, skipping update');
        return currentElements;
      }
      console.log('🎯 handleElementSelect: Updating selectedElements to:', newElements);
      return newElements;
    });
  }, []);

  const handleAddText = useCallback(() => {
    console.log("🎯 handleAddText called");
    console.log("🎯 editorReady:", editorReady);
    console.log("🎯 editorRef.current:", editorRef.current);
    console.log("🎯 editorRef.current?.addText:", editorRef.current?.addText);
    console.log("🎯 canvasDimensions:", canvasDimensions);
    
    if (!editorReady) {
      console.error("❌ Editor not ready - waiting for initialization");
      toast({ 
        title: "Please Wait", 
        description: "Editor is still initializing. Please wait a moment and try again.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!editorRef.current) {
      console.error("❌ Editor ref is null");
      toast({ 
        title: "Error", 
        description: "Editor not initialized yet", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!editorRef.current.addText) {
      console.error("❌ Editor not ready - addText method not available");
      toast({ 
        title: "Error", 
        description: "Editor not ready yet", 
        variant: "destructive" 
      });
      return;
    }

    try {
      // Calculate center position for the text
      const centerX = (canvasDimensions.width * 4) / 2; // Convert mm to pixels (4px = 1mm)
      const centerY = (canvasDimensions.height * 4) / 2; // Convert mm to pixels (4px = 1mm)
      
      console.log("🎯 Adding text at position:", { centerX, centerY });
      console.log("🎯 About to call editorRef.current.addText...");
      
      // Call addText directly without setTimeout to see immediate results
      const result = editorRef.current.addText("Click to edit text", centerX, centerY);
      
      console.log("🎯 addText result:", result);
      console.log("🎯 addText result type:", typeof result);
      console.log("🎯 addText result is null:", result === null);
      console.log("🎯 addText result is undefined:", result === undefined);
      
      if (result) {
        console.log("✅ Text added successfully");
        console.log("✅ Text node details:", {
          id: result.id(),
          name: result.name(),
          position: result.position(),
          text: result.text()
        });
        toast({ title: "Text Added", description: "Text element added to canvas center" });
      } else {
        console.warn("⚠️ addText returned null/undefined - EditorStage may not be ready");
        console.warn("⚠️ This suggests the SelectionManager.addText method returned null");
        toast({ 
          title: "Warning", 
          description: "Editor not ready yet. Please try again in a moment.", 
          variant: "destructive" 
        });
      }
      
    } catch (error) {
      console.error("❌ Error adding text:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      toast({ 
        title: "Error", 
        description: "Failed to add text element", 
        variant: "destructive" 
      });
    }
  }, [toast, canvasDimensions, editorReady]);

  const handleAddShape = useCallback((shapeType: string) => {
    console.log("🔷 handleAddShape called with:", shapeType);
    console.log("🔷 editorReady:", editorReady);
    console.log("🔷 editorRef.current:", editorRef.current);
    console.log("🔷 editorRef.current?.addShape:", editorRef.current?.addShape);
    
    if (!editorReady) {
      console.error("❌ Editor not ready - waiting for initialization");
      toast({ 
        title: "Please Wait", 
        description: "Editor is still initializing. Please wait a moment and try again.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!editorRef.current) {
      console.error("❌ Editor ref is null");
      toast({ 
        title: "Error", 
        description: "Editor not initialized yet", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!editorRef.current.addShape) {
      console.error("❌ Editor not ready - addShape method not available");
      toast({ 
        title: "Error", 
        description: "Editor not ready yet", 
        variant: "destructive" 
      });
      return;
    }

    try {
      // Calculate center position for the shape
      const centerX = (canvasDimensions.width * 4) / 2; // Convert mm to pixels (4px = 1mm)
      const centerY = (canvasDimensions.height * 4) / 2; // Convert mm to pixels (4px = 1mm)
      
      console.log("🔷 Adding shape at position:", { centerX, centerY, shapeType });
      
      // Add a small delay to ensure EditorStage is fully ready
      setTimeout(() => {
        try {
          const result = editorRef.current?.addShape(
            shapeType as "rectangle" | "circle" | "ellipse" | "triangle", 
            centerX, 
            centerY
          );
          
          console.log("🔷 addShape result:", result);
          
          if (result) {
            console.log("✅ Shape added successfully");
            toast({ title: "Shape Added", description: `${shapeType} added to canvas center` });
          } else {
            console.warn("⚠️ addShape returned null/undefined - EditorStage may not be ready");
            toast({ 
              title: "Warning", 
              description: "Editor not ready yet. Please try again in a moment.", 
              variant: "destructive" 
            });
          }
        } catch (innerError) {
          console.error("❌ Error in delayed addShape:", innerError);
          toast({ 
            title: "Error", 
            description: `Failed to add ${shapeType}`, 
            variant: "destructive" 
          });
        }
      }, 100); // Small delay to ensure EditorStage is ready
      
    } catch (error) {
      console.error("❌ Error adding shape:", error);
      toast({ 
        title: "Error", 
        description: `Failed to add ${shapeType}`, 
        variant: "destructive" 
      });
    }
  }, [toast, canvasDimensions, editorReady]);

  const handleAddImage = useCallback(() => {
    console.log("🖼️ handleAddImage called");
    console.log("🖼️ editorReady:", editorReady);
    console.log("🖼️ editorRef.current:", editorRef.current);
    console.log("🖼️ editorRef.current?.addImage:", editorRef.current?.addImage);
    
    if (!editorReady) {
      console.error("❌ Editor not ready - waiting for initialization");
      toast({ 
        title: "Please Wait", 
        description: "Editor is still initializing. Please wait a moment and try again.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!editorRef.current) {
      console.error("❌ Editor ref is null");
      toast({ 
        title: "Error", 
        description: "Editor not initialized yet", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!editorRef.current.addImage) {
      console.error("❌ Editor not ready - addImage method not available");
      toast({ 
        title: "Error", 
        description: "Editor not ready yet", 
        variant: "destructive" 
      });
      return;
    }

    // Create a file input for image upload
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      console.log("🖼️ File selected:", file);
      
      if (file && editorRef.current?.addImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          // Calculate center position for the image
          const centerX = (canvasDimensions.width * 4) / 2; // Convert mm to pixels (4px = 1mm)
          const centerY = (canvasDimensions.height * 4) / 2; // Convert mm to pixels (4px = 1mm)
          
          console.log("🖼️ Adding image at position:", { centerX, centerY });
          
          // Add a small delay to ensure EditorStage is fully ready
          setTimeout(() => {
            try {
              const result = editorRef.current?.addImage(imageUrl, centerX, centerY);
              
              console.log("🖼️ addImage result:", result);
              
              if (result) {
                console.log("✅ Image added successfully");
                toast({
                  title: "Image Added",
                  description: "Image uploaded and added to canvas center",
                });
              } else {
                console.warn("⚠️ addImage returned null/undefined - EditorStage may not be ready");
                toast({
                  title: "Warning",
                  description: "Editor not ready yet. Please try again in a moment.",
                  variant: "destructive"
                });
              }
            } catch (innerError) {
              console.error("❌ Error in delayed addImage:", innerError);
              toast({
                title: "Error",
                description: "Failed to add image to canvas",
                variant: "destructive"
              });
            }
          }, 100); // Small delay to ensure EditorStage is ready
        };
        reader.readAsDataURL(file);
      } else {
        console.warn("⚠️ No file selected or editor not ready");
      }
      // Clean up
      document.body.removeChild(fileInput);
    };

    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
  }, [toast, canvasDimensions, editorReady]);

  const handleUndo = useCallback(() => {
    if (editorRef.current?.undo) {
      editorRef.current.undo();
      toast({ title: "Undo", description: "Action undone" });
    }
  }, [toast]);

  const handleRedo = useCallback(() => {
    if (editorRef.current?.redo) {
      editorRef.current.redo();
      toast({ title: "Redo", description: "Action redone" });
    }
  }, [toast]);

  // Memoized values to prevent unnecessary re-renders
  const productInfo = useMemo(() => ({
    nameEn: selectedProduct?.nameEn || 'Select product',
    dimensions: `${canvasDimensions.width}×${canvasDimensions.height}mm`
  }), [selectedProduct?.nameEn, canvasDimensions.width, canvasDimensions.height]);

  // Removed problematic useMemo that was causing infinite re-renders

  const editorActions = useMemo(() => ({
    deleteSelected: () => editorRef.current?.deleteSelected(),
    duplicateSelected: () => editorRef.current?.duplicateSelected(),
    zoomIn: () => editorRef.current?.zoomIn(),
    zoomOut: () => editorRef.current?.zoomOut(),
    zoomToFit: () => editorRef.current?.zoomToFit(),
    zoomTo100: () => editorRef.current?.zoomTo100(),
    toggleGuides: () => editorRef.current?.toggleGuides(),
    toggleGrid: () => editorRef.current?.toggleGrid(),
    toggleSnapToGrid: () => editorRef.current?.toggleSnapToGrid(),
  }), []);

  // Authentication check
  if (!userId) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
            </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Designer Studio
                </CardTitle>
                <p className="text-gray-600 mt-2 leading-relaxed">
                  Transform your ideas into stunning designs with our intelligent AI-powered platform.
                  Create professional graphics in minutes, not hours.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <span className="text-sm font-medium text-green-700">AI Generation</span>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <Brain className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Smart Templates</span>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Instant Export</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <Link href="/login" className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Access AI Designer
                </Button>
              </Link>
                  <div className="text-center">
                    <span className="text-gray-500">Don't have an account? </span>
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Sign up here
                </Link>
            </div>
                  </div>
              </CardContent>
            </Card>
                </div>
                  </div>
                </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navigation />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 max-w-full">
        {/* Left Sidebar */}
        <CompactSidebar
          title="Design Tools"
          icon={<Palette className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {/* Product Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</h4>
            <ProductSelector
              onProductSelect={handleProductSelect}
              currentProduct={selectedProduct || undefined}
            />
                  </div>

          <Separator />

          {/* Design Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tools</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddText}
                className="flex flex-col items-center p-3 h-auto"
              >
                <Type className="w-4 h-4 mb-1" />
                <span className="text-xs">Text</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddImage}
                className="flex flex-col items-center p-3 h-auto"
              >
                <Upload className="w-4 h-4 mb-1" />
                <span className="text-xs">Image</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddShape('rectangle')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <Square className="w-4 h-4 mb-1" />
                <span className="text-xs">Shape</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddShape('circle')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <Circle className="w-4 h-4 mb-1" />
                <span className="text-xs">Circle</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddShape('triangle')}
                className="flex flex-col items-center p-3 h-auto"
              >
                <Triangle className="w-4 h-4 mb-1" />
                <span className="text-xs">Triangle</span>
              </Button>
                </div>
              </div>

          <Separator />

          {/* Enhanced Canvas Controls */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Canvas</h4>
            <div className="space-y-3">
              {/* Zoom Level Display */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Zoom</span>
                <span className="text-xs font-medium text-blue-600">{Math.round(zoom * 100)}%</span>
              </div>

              {/* Zoom Controls */}
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editorRef.current?.zoomOut()}
                  className="text-xs"
                  title="Zoom Out"
                >
                  <Minimize2 className="w-3 h-3 mr-1" />
                  Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editorRef.current?.zoomIn()}
                  className="text-xs"
                  title="Zoom In"
                >
                  <Maximize2 className="w-3 h-3 mr-1" />
                  In
                </Button>
              </div>

              {/* Zoom Presets */}
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editorRef.current?.zoomToFit()}
                  className="text-xs"
                  title="Fit to Screen"
                >
                  Fit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editorRef.current?.zoomTo100()}
                  className="text-xs"
                  title="Zoom to 100%"
                >
                  100%
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant={showGuides ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowGuides(!showGuides);
                  editorRef.current?.toggleGuides();
                }}
                className="w-full justify-start"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Guides
              </Button>
              <Button
                variant={showGrid ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowGrid(!showGrid);
                  editorRef.current?.toggleGrid();
                }}
                className="w-full justify-start"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editorRef.current?.toggleSnapToGrid()}
                className="w-full justify-start"
              >
                <AlignLeft className="w-4 h-4 mr-2" />
                Snap to Grid
              </Button>
      </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="w-full justify-start"
              >
                <Undo className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                className="w-full justify-start"
              >
                <Redo className="w-4 h-4 mr-2" />
                Redo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editorRef.current?.clearCanvas()}
                className="w-full justify-start"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Canvas
              </Button>
            </div>
          </div>
        </CompactSidebar>

                {/* Floating Sidebar Toggle Button (when sidebar is collapsed) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="fixed top-20 left-3 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Show Design Tools"
          >
            <Palette className="w-5 h-5" />
            <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Show Design Tools
            </div>
          </button>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
          {/* Enhanced Top Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Left Section - Brand & Info */}
              <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Brain className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm md:text-base">AI Designer</span>
                </div>
                <Separator orientation="vertical" className="h-4 md:h-6 hidden md:block" />
                {/* Mobile: Show product info below */}
                <div className="md:hidden flex flex-col space-y-1">
                  <span className="text-xs text-gray-600 truncate">
                    {productInfo.nameEn}
                  </span>
                  {selectedProduct && (
                    <span className="text-xs text-gray-500">
                      {productInfo.dimensions}
                    </span>
                  )}
                </div>
                {/* Desktop: Show product info inline */}
                <div className="hidden md:flex items-center space-x-2 min-w-0">
                  <span className="text-xs md:text-sm text-gray-600 truncate">
                    {productInfo.nameEn}
                  </span>
                  {selectedProduct && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {productInfo.dimensions}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Center Section - Quick Tools */}
              <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
                {/* Template Gallery Button - Prominent */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateGallery(true)}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 text-blue-700 hover:border-blue-300 font-medium"
                  title="Choose from Templates"
                >
                  <LayoutTemplate className="w-4 h-4 mr-2" />
                  Templates
                </Button>

                <Separator orientation="vertical" className="h-6" />

                {/* Quick Add Tools */}
                <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddText}
                    className="h-8 w-8 p-0"
                    title="Add Text"
                  >
                    <Type className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddImage}
                    className="h-8 w-8 p-0"
                    title="Add Image"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddShape('rectangle')}
                    className="h-8 w-8 p-0"
                    title="Add Rectangle"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddShape('circle')}
                    className="h-8 w-8 p-0"
                    title="Add Circle"
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Edit Tools */}
                <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUndo}
                    className="h-8 w-8 p-0"
                    title="Undo"
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRedo}
                    className="h-8 w-8 p-0"
                    title="Redo"
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Right Section - Panels & Actions */}
              <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                {/* Toolbar Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newMode = toolbarMode === 'fixed' ? 'floating' : 'fixed';
                    setToolbarMode(newMode);
                    if (newMode === 'floating') {
                      setShowFloatingToolbar(true);
                    }
                  }}
                  className="h-8 w-8 p-0"
                  title={`Switch to ${toolbarMode === 'fixed' ? 'floating' : 'fixed'} toolbar`}
                >
                  {toolbarMode === 'fixed' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>

                <Separator orientation="vertical" className="h-6 hidden md:block" />

                {/* Panel Buttons */}
                <Button
                  variant={activePanel === 'templates' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePanel(activePanel === 'templates' ? 'design' : 'templates')}
                  className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3"
                >
                  <Palette className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">Templates</span>
                </Button>
                <Button
                  variant={activePanel === 'ai' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePanel(activePanel === 'ai' ? 'design' : 'ai')}
                  className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3"
                >
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">AI Tools</span>
                </Button>
                <Button
                  variant={activePanel === 'properties' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePanel(activePanel === 'properties' ? 'design' : 'properties')}
                  className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3"
                >
                  <Settings className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">Properties</span>
                </Button>

                <Separator orientation="vertical" className="h-6 hidden md:block" />

                {/* Export Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivePanel('export')}
                  className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline text-xs md:text-sm">Export</span>
                </Button>
              </div>
            </div>

            {/* Mobile Quick Tools Bar */}
            <div className="md:hidden bg-gray-50 border-t border-gray-200 px-3 py-2">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddText}
                  className="flex flex-col items-center h-12 w-12 p-1 hover:bg-white"
                  title="Add Text"
                >
                  <Type className="w-5 h-5 text-blue-600" />
                  <span className="text-xs mt-1">Text</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddImage}
                  className="flex flex-col items-center h-12 w-12 p-1 hover:bg-white"
                  title="Add Image"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-xs mt-1">Image</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddShape('rectangle')}
                  className="flex flex-col items-center h-12 w-12 p-1 hover:bg-white"
                  title="Add Shape"
                >
                  <Square className="w-5 h-5 text-green-600" />
                  <span className="text-xs mt-1">Shape</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddShape('circle')}
                  className="flex flex-col items-center h-12 w-12 p-1 hover:bg-white"
                  title="Add Circle"
                >
                  <Circle className="w-5 h-5 text-purple-600" />
                  <span className="text-xs mt-1">Circle</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  className="flex flex-col items-center h-12 w-12 p-1 hover:bg-white"
                  title="Undo"
                >
                  <Undo className="w-5 h-5 text-gray-600" />
                  <span className="text-xs mt-1">Undo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  className="flex flex-col items-center h-12 w-12 p-1 hover:bg-white"
                  title="Redo"
                >
                  <Redo className="w-5 h-5 text-gray-600" />
                  <span className="text-xs mt-1">Redo</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative bg-gray-50 overflow-hidden">
            <EditorStage
              key={`editor-${canvasDimensions.width}-${canvasDimensions.height}`}
              widthMm={canvasDimensions.width}
              heightMm={canvasDimensions.height}
              bleedMm={3}
              safeMm={5}
              backgroundColor="#ffffff"
              onStateChange={() => {}}
              onElementSelect={handleElementSelect}
              ref={editorRef}
            />

            {/* Editor Status Indicator */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 md:p-3 flex items-center space-x-2 md:space-x-3 z-10">
              <div className={`w-2 h-2 rounded-full ${editorReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span className="text-xs md:text-sm font-medium text-gray-700 hidden md:inline">
                {editorReady ? 'Editor Ready' : 'Initializing...'}
              </span>
              {!editorReady && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("🔄 Manual editor initialization triggered");
                      setEditorReady(false);
                      // Force a re-check
                      setTimeout(() => {
                        if (editorRef.current && 
                            editorRef.current.addText && 
                            editorRef.current.addShape && 
                            editorRef.current.addImage) {
                          setEditorReady(true);
                          toast({ title: "Editor Ready", description: "Editor has been initialized successfully" });
                        } else {
                          toast({ 
                            title: "Still Initializing", 
                            description: "Editor is still not ready. Please wait a moment.", 
                            variant: "destructive" 
                          });
                        }
                      }, 1000);
                    }}
                    className="h-6 w-6 p-0"
                    title="Retry Initialization"
                  >
                    🔄
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("🧪 Testing direct method call");
                      console.log("🧪 editorRef.current:", editorRef.current);
                      console.log("🧪 editorRef.current?.addText:", editorRef.current?.addText);
                      console.log("🧪 editorRef.current?.addShape:", editorRef.current?.addShape);
                      console.log("🧪 editorRef.current?.addImage:", editorRef.current?.addImage);
                      
                      try {
                        if (editorRef.current?.addText) {
                          console.log("🧪 Calling addText with simple parameters...");
                          const result = editorRef.current.addText("Test Text", 100, 100);
                          console.log("🧪 Direct addText result:", result);
                          console.log("🧪 Result type:", typeof result);
                          console.log("🧪 Result is null:", result === null);
                          console.log("🧪 Result is undefined:", result === undefined);
                          
                          if (result) {
                            console.log("🧪 Text node created successfully:", {
                              id: result.id(),
                              name: result.name(),
                              text: result.text(),
                              position: result.position()
                            });
                            toast({ title: "Test Success", description: "Direct method call worked!" });
                            setEditorReady(true);
                          } else {
                            console.warn("🧪 addText returned null - checking SelectionManager state");
                            toast({ title: "Test Failed", description: "Direct method call returned null", variant: "destructive" });
                          }
                        } else {
                          console.error("🧪 addText method not available");
                          toast({ title: "No Method", description: "addText method not available", variant: "destructive" });
                        }
                      } catch (error) {
                        console.error("🧪 Direct method call error:", error);
                        console.error("🧪 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
                        toast({ title: "Test Error", description: "Direct method call failed", variant: "destructive" });
                      }
                    }}
                    className="h-6 w-6 p-0"
                    title="Test Direct Method Call"
                  >
                    🧪
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel('ai')}
                className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-blue-50"
              >
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
              </Button>
            </div>

            {/* Enhanced Floating Toolbar - Mobile Optimized */}
            {showFloatingToolbar && (
              <div className="absolute top-16 md:top-20 left-2 md:left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-20 w-72 md:w-80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Quick Tools</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFloatingToolbar(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* Main Tools Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddText}
                    className="h-14 flex flex-col items-center justify-center p-2 hover:bg-blue-50 hover:border-blue-200"
                    title="Add Text"
                  >
                    <Type className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-xs text-center">Text</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddImage}
                    className="h-14 flex flex-col items-center justify-center p-2 hover:bg-blue-50 hover:border-blue-200"
                    title="Add Image"
                  >
                    <Upload className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-xs text-center">Image</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddShape('rectangle')}
                    className="h-14 flex flex-col items-center justify-center p-2 hover:bg-green-50 hover:border-green-200"
                    title="Add Rectangle"
                  >
                    <Square className="w-5 h-5 text-green-600 mb-1" />
                    <span className="text-xs text-center">Rect</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddShape('circle')}
                    className="h-14 flex flex-col items-center justify-center p-2 hover:bg-purple-50 hover:border-purple-200"
                    title="Add Circle"
                  >
                    <Circle className="w-5 h-5 text-purple-600 mb-1" />
                    <span className="text-xs text-center">Circle</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddShape('triangle')}
                    className="h-14 flex flex-col items-center justify-center p-2 hover:bg-orange-50 hover:border-orange-200"
                    title="Add Triangle"
                  >
                    <Triangle className="w-5 h-5 text-orange-600 mb-1" />
                    <span className="text-xs text-center">Triangle</span>
                  </Button>
                </div>

                {/* Edit Tools */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    className="h-12 flex flex-col items-center justify-center p-2 hover:bg-gray-50"
                    title="Undo"
                  >
                    <Undo className="w-4 h-4 mb-1" />
                    <span className="text-xs">Undo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRedo}
                    className="h-12 flex flex-col items-center justify-center p-2 hover:bg-gray-50"
                    title="Redo"
                  >
                    <Redo className="w-4 h-4 mb-1" />
                    <span className="text-xs">Redo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.duplicateSelected()}
                    className="h-12 flex flex-col items-center justify-center p-2 hover:bg-gray-50"
                    title="Duplicate"
                  >
                    <Square className="w-4 h-4 mb-1" />
                    <span className="text-xs">Copy</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.deleteSelected()}
                    className="h-12 flex flex-col items-center justify-center p-2 hover:bg-red-50 hover:border-red-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 mb-1" />
                    <span className="text-xs">Delete</span>
                  </Button>
                </div>

                <Separator className="my-3" />

                {/* Zoom Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Zoom</span>
                    <span className="text-sm text-blue-600 font-medium">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editorRef.current?.zoomOut()}
                      className="h-9 text-sm hover:bg-gray-50"
                    >
                      Zoom -
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editorRef.current?.zoomToFit()}
                      className="h-9 text-sm hover:bg-blue-50 hover:border-blue-200"
                    >
                      Fit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editorRef.current?.zoomIn()}
                      className="h-9 text-sm hover:bg-gray-50"
                    >
                      Zoom +
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.zoomTo100()}
                    className="w-full h-9 text-sm hover:bg-green-50 hover:border-green-200"
                  >
                    Zoom to 100%
                  </Button>
                </div>

                <Separator className="my-3" />

                {/* Canvas Tools */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Canvas Tools</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editorRef.current?.toggleGuides()}
                      className="h-9 text-sm hover:bg-gray-50"
                    >
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Guides
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editorRef.current?.toggleGrid()}
                      className="h-9 text-sm hover:bg-gray-50"
                    >
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Grid
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.toggleSnapToGrid()}
                    className="w-full h-9 text-sm hover:bg-purple-50 hover:border-purple-200"
                  >
                    <AlignLeft className="w-4 h-4 mr-2" />
                    Snap to Grid
                  </Button>
                </div>
              </div>
            )}

            {/* Floating Toolbar Toggle Button - Mobile & Desktop */}
            {!showFloatingToolbar && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowFloatingToolbar(true)}
                className="absolute top-4 left-2 md:left-4 bg-blue-600 hover:bg-blue-700 shadow-lg z-10 md:hidden"
                title="Show Tools"
              >
                <Settings className="w-4 h-4 mr-2" />
                Tools
              </Button>
            )}
          </div>
        </div>

                {/* Right Panel */}
        {activePanel !== 'design' && (
          <>
            {/* Desktop Panel */}
            <div className="hidden md:block w-80 lg:w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {activePanel === 'ai' && 'AI Tools'}
                  {activePanel === 'templates' && 'Templates'}
                  {activePanel === 'properties' && 'Properties'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActivePanel('design')}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4">
                {activePanel === 'ai' && (
                  <AIEnhancedToolsPanel
                    isOpen={true}
                    onClose={() => setActivePanel('design')}
                    editorRef={editorRef}
                    selectedElementData={selectedElements[0]}
                    generateImageMutation={null}
                    removeBackgroundMutation={null}
                    generateTextMutation={null}
                    generateColorPaletteMutation={null}
                    beautifyDesignMutation={null}
                    generateLayoutSuggestionsMutation={null}
                    generateImageSuggestionsMutation={null}
                  />
                )}

                {activePanel === 'templates' && (
                  <TemplateGallery
                    onSelectTemplate={() => {}}
                    onClose={() => setActivePanel('design')}
                    currentProductId={selectedProduct?.id}
                  />
                )}

                {activePanel === 'export' && (
                  <ExportPanel
                    stage={editorRef.current?.stage}
                    htmlElements={[]}
                    widthMm={canvasDimensions.width}
                    heightMm={canvasDimensions.height}
                    bleedMm={selectedProduct?.dimensions.bleed || 3}
                    safeMm={selectedProduct?.dimensions.safeZone || 5}
                    selectedProduct={selectedProduct || undefined}
                    editorRef={editorRef}
                    elements={selectedElements}
                  />
                )}

                {activePanel === 'properties' && (
                  <PropertiesPanel
                    selectedElementData={selectedElements[0]}
                    selectedColors={[]}
                    canvasDimensions={canvasDimensions}
                    setCanvasDimensions={setCanvasDimensions}
                    editorRef={editorRef}
                    onDeleteSelected={editorActions.deleteSelected}
                    onAddToCart={() => {}}
                    onDownloadPreview={() => {}}
                    generateColorPaletteMutation={null}
                    validateForPrint={() => []}
                    exportForPrint={() => ({})}
                    quantity={1}
                    setQuantity={() => {}}
                    designName={designName}
                    setDesignName={setDesignName}
                    onPropertyChange={() => {}}
                    onDelete={() => {}}
                    onMoveUp={() => {}}
                    onMoveDown={() => {}}
                  />
                )}
              </div>
            </div>

            {/* Mobile Modal */}
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {activePanel === 'ai' && 'AI Tools'}
                    {activePanel === 'templates' && 'Templates'}
                    {activePanel === 'export' && 'Export Design'}
                    {activePanel === 'properties' && 'Properties'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel('design')}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-4">
                  {activePanel === 'ai' && (
                    <div className="text-center text-gray-500 py-8">
                      AI Tools (Mobile view coming soon...)
                    </div>
                  )}

                  {activePanel === 'templates' && (
                    <div className="text-center text-gray-500 py-8">
                      Templates (Mobile view coming soon...)
                    </div>
                  )}

                  {activePanel === 'export' && (
                    <ExportPanel
                      stage={editorRef.current?.stage}
                      htmlElements={[]}
                      widthMm={canvasDimensions.width}
                      heightMm={canvasDimensions.height}
                      bleedMm={selectedProduct?.dimensions.bleed || 3}
                      safeMm={selectedProduct?.dimensions.safeZone || 5}
                      selectedProduct={selectedProduct || undefined}
                      editorRef={editorRef}
                      elements={selectedElements}
                    />
                  )}

                  {activePanel === 'properties' && (
                    <PropertiesPanel
                      selectedElementData={selectedElements[0]}
                      selectedColors={[]}
                      canvasDimensions={canvasDimensions}
                      setCanvasDimensions={setCanvasDimensions}
                      editorRef={editorRef}
                      onDeleteSelected={editorActions.deleteSelected}
                      onAddToCart={() => {}}
                      onDownloadPreview={() => {}}
                      generateColorPaletteMutation={null}
                      validateForPrint={() => []}
                      exportForPrint={() => ({})}
                      quantity={1}
                      setQuantity={() => {}}
                      designName={designName}
                      setDesignName={setDesignName}
                      onPropertyChange={() => {}}
                      onDelete={() => {}}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Template Gallery Modal */}
        {showTemplateGallery && (
          <TemplateGallery
            onSelectTemplate={(template) => {
              // Handle template selection
              if (editorRef.current) {
                if (template) {
                  // Convert template to the format expected by SelectionManager
                  const templateData = {
                    background: template.background || { color: '#ffffff' },
                    elements: template.layers || [],
                    // Add metadata and other template properties
                    ...template
                  };
                  console.log("🎨 Loading template with data:", templateData);
                  editorRef.current.loadTemplate(templateData);

                  // Force a canvas refresh after loading the template
                  setTimeout(() => {
                    if (editorRef.current) {
                      editorRef.current.forceRefreshCanvasState?.();
                    }
                  }, 100);
                } else {
                  // Blank canvas - clear everything
                  editorRef.current.clearCanvas();
                }
              }
              setShowTemplateGallery(false);
            }}
            onClose={() => setShowTemplateGallery(false)}
            currentProductId={selectedProduct?.id}
          />
        )}
      </div>
    </div>
  );
}