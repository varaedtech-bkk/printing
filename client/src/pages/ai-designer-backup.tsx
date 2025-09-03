import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useSearch } from "wouter";
import Navigation from "@/components/navigation";
import EditorStage from "@/components/designer/EditorStage";
import { PropertiesPanel } from "@/components/designer/PropertiesPanel";
import { TemplateGallery } from "@/components/designer/TemplateGallery";
import { AIEnhancedToolsPanel } from "@/components/designer/AIEnhancedToolsPanel";
import { ProductSelector } from "@/components/designer/ProductSelector";
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
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          {!isCollapsed && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">Tools & Options</p>
            </div>
          )}
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2ZiYmYyNCIvPjx0ZXh0IHg9IjEwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmJmYjI0Ij5FbGVnYW50PC90ZXh0Pjx0ZXh0IHg9IjEwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmJmYjI0Ij5Qb3N0ZXIgRGVzaWduPC90ZXh0Pjwvc3ZnPg==",
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
  const [activePanel, setActivePanel] = useState<'design' | 'ai' | 'templates' | 'properties'>('design');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [designName, setDesignName] = useState("Untitled Design");
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 210, // A4 width in mm
    height: 297, // A4 height in mm
  });
  const [zoom, setZoom] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  const editorRef = useRef<any>(null);

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
    }
  }, [selectedProduct]);

  // Simplified handlers
  const handleProductSelect = useCallback((product: PrintProduct) => {
    setSelectedProduct(product);
    setCanvasDimensions({
      width: product.dimensions.width,
      height: product.dimensions.height,
    });
    toast({
      title: "Product Selected",
      description: `${product.nameEn} (${product.dimensions.width}×${product.dimensions.height}mm)`
    });
  }, [toast]);

  const handleElementSelect = useCallback((element: any) => {
    setSelectedElements(element ? [element] : []);
  }, []);

  const handleAddText = useCallback(() => {
    if (editorRef.current?.addText) {
      editorRef.current.addText();
      toast({ title: "Text Added", description: "Click to edit the text" });
    }
  }, [toast]);

  const handleAddShape = useCallback((shapeType: string) => {
    if (editorRef.current?.addShape) {
      editorRef.current.addShape(shapeType);
      toast({ title: "Shape Added", description: `${shapeType} added to canvas` });
    }
  }, [toast]);

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

  return null; // Placeholder return for backup file
}
