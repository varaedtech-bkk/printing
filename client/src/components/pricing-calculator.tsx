import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Product, type ProductOption } from "@shared/prisma-schema";
import { useCart } from "@/hooks/use-cart";
import StripePayment from "@/components/stripe-payment";
import {
  ShoppingCart,
  Smartphone,
  CreditCard,
  Truck,
  CheckCircle,
  Sparkles,
  Package,
  FileText,
  Settings,
  Shield,
  ChevronDown,
  Clock,
  MapPin,
  Star,
  Zap,
  Palette,
  Ruler,
  Layers,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Calculator,
  Info,
  AlertCircle,
  Heart,
  Download,
  Share2,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Extended Product type that includes options
type ProductWithOptions = Product & {
  options: ProductOption[];
};

// A generic option type for display
interface DisplayOption {
  id: string;
  name: string;
  description?: string;
  priceModifier?: number;
  popular?: boolean;
}

interface PricingCalculatorProps {
  initialProduct?: Product | null;
}

export default function PricingCalculator({ initialProduct }: PricingCalculatorProps = {}) {
  const { t, locale } = useI18n() as any;
  const { toast } = useToast();
  const { addToCart, isAdding } = useCart();

  // State management
  const [selectedProductId, setSelectedProductId] = useState(initialProduct?.id || "");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedQuantity, setSelectedQuantity] = useState(100);

  const [pricing, setPricing] = useState({
    unitPrice: 0,
    subtotal: 0,
    shippingCost: 0,
    totalPrice: 0,
    savings: 0,
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    size: true,
    paper: true,
  });

  const [activeTab, setActiveTab] = useState("options");
  const [showPricingTable, setShowPricingTable] = useState(true);

  // Fetch all products with options
  const { data: products, isLoading: productsLoading } = useQuery<ProductWithOptions[]>({
    queryKey: ["/api/products"]
  });

  // Fetch tiered pricing for the selected product
  const { data: tieredPricing } = useQuery<any[]>({
    queryKey: [`/api/products/${selectedProductId}/pricing`],
    enabled: !!selectedProductId && selectedProductId !== "",
  });

  // Set default product
  useEffect(() => {
    if (products && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);
  
  const currentProduct = useMemo(() => products?.find(p => p.id === selectedProductId), [products, selectedProductId]);

  // Normalize product image URLs and provide a fallback placeholder
  const normalizeImageUrl = (url?: string) => {
    if (!url) return undefined;
    try {
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      if (url.startsWith('/')) return url; // already absolute path
      return `/${url}`; // make it absolute relative to server root
    } catch {
      return undefined;
    }
  };
  const fallbackImg =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 16l5-5 4 4 5-6 4 5"/></svg>'
    );

  // Group product options by type
  const groupedOptions = useMemo(() => {
    if (!currentProduct?.options) return {};
    return currentProduct.options.reduce((acc: Record<string, ProductOption[]>, option: ProductOption) => {
      if (!acc[option.type]) acc[option.type] = [];
      acc[option.type].push(option);
      return acc;
    }, {});
  }, [currentProduct]);

  // Set default options when product changes
  useEffect(() => {
    if (currentProduct) {
      const defaultOptions: Record<string, string> = {};
      Object.keys(groupedOptions).forEach(type => {
        const defaultOption = groupedOptions[type].find(o => o.isDefault) || groupedOptions[type][0];
        if (defaultOption) {
          defaultOptions[type] = defaultOption.id;
        }
      });
      setSelectedOptions(defaultOptions);
    }
  }, [currentProduct, groupedOptions]);

  // Fallback options mapping for newly introduced option groups not yet in backend
  const fallbackOptionsByType = useMemo(() => ({
    artwork: [
      { id: 'art-ready', nameEn: 'Print-Ready PDF (Recommended)', defaultPriceModifier: 0 },
      { id: 'jpg-png', nameEn: 'Easy Order (JPG/PNG/PDF)', defaultPriceModifier: 0 },
      { id: 'ai-fix', nameEn: 'Minor Artwork Fix by Designer', defaultPriceModifier: 200 },
    ],
    turnaround: [
      { id: 'standard-2-3', nameEn: 'Standard (2-3 business days)', defaultPriceModifier: 0 },
      { id: 'express-1-2', nameEn: 'Express (1-2 business days)', defaultPriceModifier: 300 },
      { id: 'same-day', nameEn: 'Same Day (Pickup/Quick)', defaultPriceModifier: 600 },
    ],
    packaging: [
      { id: 'no-box', nameEn: 'No Box (Default)', defaultPriceModifier: 0 },
      { id: 'polybag', nameEn: 'Hologram Polybag', defaultPriceModifier: 50 },
      { id: 'namecard-box', nameEn: 'Business Card Box (90x50mm)', defaultPriceModifier: 100 },
    ],
    corners: [
      { id: 'square', nameEn: 'Square Corners', defaultPriceModifier: 0 },
      { id: 'rounded', nameEn: 'Rounded Corners', defaultPriceModifier: 150 },
    ],
  }), []);

  // Price calculation logic with tiered pricing support
  useEffect(() => {
    if (!currentProduct) return;

    let unitPrice = 0;
    let savings = 0;

    // Check if product has tiered pricing (like Gogoprint style)
    if (tieredPricing && tieredPricing.length > 0) {
      // Find the appropriate pricing tier for the selected quantity
      const applicableTier = tieredPricing
        .filter(tier => selectedQuantity >= tier.quantity)
        .sort((a, b) => b.quantity - a.quantity)[0]; // Get the highest quantity tier that applies

      if (applicableTier) {
        // Calculate base unit price from tier (discounted price per piece)
        const tierUnit = parseFloat(applicableTier.discountedPrice) / applicableTier.quantity;
        // Add option modifiers on top of tier base
        const optionSurcharge = Object.entries(selectedOptions).reduce((sum, [type, optionId]) => {
          const option = Object.values(groupedOptions).flat().find(opt => opt.id === optionId) || (fallbackOptionsByType as any)[type]?.find((opt: any) => opt.id === optionId);
          const mod = option ? parseFloat((option as any).defaultPriceModifier as any || '0') : 0;
          return sum + mod;
        }, 0);
        unitPrice = tierUnit + optionSurcharge;
        savings = (parseFloat(applicableTier.basePrice) - parseFloat(applicableTier.discountedPrice)) / applicableTier.quantity * selectedQuantity;
      } else {
        // Fallback to base price if no tier applies
        unitPrice = parseFloat(currentProduct.basePrice as any || '0');
      }
    } else {
      // Use traditional pricing (base price + option modifiers)
      unitPrice = parseFloat(currentProduct.basePrice as any || '0');

      // Add option modifiers
      Object.entries(selectedOptions).forEach(([type, optionId]) => {
        const option = Object.values(groupedOptions).flat().find(opt => opt.id === optionId)
          || (fallbackOptionsByType as any)[type]?.find((opt: any) => opt.id === optionId);
        if (option) {
          unitPrice += parseFloat((option as any).defaultPriceModifier as any || '0');
        }
      });
    }

    const subtotal = unitPrice * selectedQuantity;
    const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping over ฿1,000
    const totalPrice = subtotal + shippingCost;

    setPricing({
      unitPrice,
      subtotal,
      shippingCost,
      totalPrice,
      savings,
    });

  }, [currentProduct, selectedOptions, selectedQuantity, groupedOptions, tieredPricing]);

  const handleOptionChange = (optionType: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionType]: optionId }));
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const handleAddToCart = () => {
    if (!currentProduct) return;

    const selectedOptionsArray = Object.entries(selectedOptions).map(([type, optionId]) => {
        const optionDetails = groupedOptions[type]?.find(o => o.id === optionId);
        if (optionDetails) {
          // Shape to match server productOptionZodSchema
          return {
            id: optionDetails.id,
            productId: currentProduct.id,
            type: type,
            nameEn: optionDetails.nameEn,
            nameTh: optionDetails.nameTh,
            defaultPriceModifier: Number(optionDetails.defaultPriceModifier || 0),
            priceRules: optionDetails.priceRules || null,
            isDefault: optionDetails.isDefault || false,
          } as any;
        }
        // Fallback options (client-only) – still conform to schema
        const fallback = (fallbackOptionsByType as any)[type]?.find((o: any) => o.id === optionId) || {};
        return {
          id: fallback.id || optionId,
          productId: currentProduct.id,
          type: type,
          nameEn: fallback.nameEn || optionId,
          nameTh: fallback.nameTh || fallback.nameEn || optionId,
          defaultPriceModifier: Number(fallback.defaultPriceModifier || 0),
          priceRules: null,
          isDefault: false,
        } as any;
    });

    // Use the already computed unit price (avoid double-counting modifiers)
    const finalUnitPrice = pricing.unitPrice;

    addToCart({
        productId: currentProduct.id,
        quantity: selectedQuantity,
        unitPrice: finalUnitPrice.toFixed(2),
        totalPrice: pricing.totalPrice.toFixed(2),
        selectedOptions: selectedOptionsArray as any,
        designProjectId: null,
        updatedAt: new Date()
    });

    toast({
        title: "Added to Cart!",
        description: `${selectedQuantity}x ${currentProduct.nameEn} have been added to your cart.`
    });
  };
  
  if (productsLoading || !currentProduct) {
    return <LoadingSkeleton />;
  }

  const mapProductOptionsToDisplayOptions = (options: ProductOption[]): DisplayOption[] => {
    if (!options) return [];
    return options.map(opt => ({
      id: opt.id,
      name: opt.nameEn,
      description: opt.nameTh,
      priceModifier: parseFloat(opt.defaultPriceModifier as any || '0'),
      popular: opt.isDefault,
    }));
  };

  return (
    <TooltipProvider>
      <section className="py-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
                <Calculator className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Pricing Calculator</h1>
            <p className="text-gray-600 max-w-lg mx-auto">Configure your product options and get instant pricing with real-time updates.</p>
          </div>

          {/* Main Calculator Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg md:text-xl">
                <Package className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                Order Configuration
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm">
                Select your product, configure options, and see live pricing
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Left Column - Product & Options */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Product Selector */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center">
                      <Package className="w-4 h-4 mr-2 text-blue-600" />
                      Product
                    </Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product) => {
                          const src = normalizeImageUrl((product as any).thumbnail || product.image || undefined);
                          return (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center space-x-3 min-w-0">
                                <img
                                  src={src || fallbackImg}
                                  alt={product.nameEn}
                                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const img = e.currentTarget as HTMLImageElement;
                                    img.onerror = null;
                                    img.src = fallbackImg;
                                  }}
                                />
                                <span className="truncate">{product.nameEn}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Enhanced Options Grid */}
                  <div className="space-y-6">
                    {/* Size & Paper Options Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(groupedOptions).filter(([type]) => ['size', 'paper'].includes(type)).map(([type, options]) => (
                        <div key={type} className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 capitalize flex items-center">
                            {type === 'size' && <Ruler className="w-4 h-4 mr-2 text-blue-600" />}
                            {type === 'paper' && <Layers className="w-4 h-4 mr-2 text-green-600" />}
                            {type}
                          </Label>
                          <Select
                            value={selectedOptions[type] || ""}
                            onValueChange={(value) => handleOptionChange(type, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={`Select ${type}...`} />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <div>
                                      <span className="font-medium">{locale === 'th' ? (option.nameTh || option.nameEn) : option.nameEn}</span>
                                      {locale === 'en' && option.nameTh && (
                                        <div className="text-xs text-gray-500">{option.nameTh}</div>
                                      )}
                                    </div>
                                    {parseFloat(option.defaultPriceModifier as any || '0') !== 0 && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {parseFloat(option.defaultPriceModifier as any || '0') > 0 ? '+' : ''}
                                        ฿{Math.abs(parseFloat(option.defaultPriceModifier as any || '0'))}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {/* Printing & Finishing Options Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(groupedOptions).filter(([type]) => ['printing', 'finishing'].includes(type)).map(([type, options]) => (
                        <div key={type} className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 capitalize flex items-center">
                            {type === 'printing' && <RotateCcw className="w-4 h-4 mr-2 text-purple-600" />}
                            {type === 'finishing' && <Sparkles className="w-4 h-4 mr-2 text-orange-600" />}
                            {type}
                          </Label>
                          <Select
                            value={selectedOptions[type] || ""}
                            onValueChange={(value) => handleOptionChange(type, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={`Select ${type}...`} />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <div>
                                      <span className="font-medium">{locale === 'th' ? (option.nameTh || option.nameEn) : option.nameEn}</span>
                                      {locale === 'en' && option.nameTh && (
                                        <div className="text-xs text-gray-500">{option.nameTh}</div>
                                      )}
                                    </div>
                                    {parseFloat(option.defaultPriceModifier as any || '0') !== 0 && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {parseFloat(option.defaultPriceModifier as any || '0') > 0 ? '+' : ''}
                                        ฿{Math.abs(parseFloat(option.defaultPriceModifier as any || '0'))}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {/* Artwork/File & Turnaround/Delivery Sections (inspired by reference sites) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Artwork / File Submission */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                          Artwork / File
                        </Label>
                        <Select
                          value={selectedOptions['artwork'] || ""}
                          onValueChange={(value) => handleOptionChange('artwork', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select artwork option..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              groupedOptions['artwork'] || [
                                { id: 'art-ready', nameEn: 'Print-Ready PDF (Recommended)', nameTh: 'ไฟล์พร้อมพิมพ์ PDF', defaultPriceModifier: 0 },
                                { id: 'jpg-png', nameEn: 'Easy Order (JPG/PNG/PDF)', nameTh: 'ไฟลง่าย JPG/PNG/PDF', defaultPriceModifier: 0 },
                                { id: 'ai-fix', nameEn: 'Minor Artwork Fix by Designer', nameTh: 'แก้ไฟล์เล็กน้อยโดยดีไซเนอร์', defaultPriceModifier: 200 },
                              ] as any
                            ).map((option: any) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex items-center justify-between w-full">
                                  <div>
                                    <span className="font-medium">{option.nameEn}</span>
                                    {option.nameTh && (
                                      <div className="text-xs text-gray-500">{option.nameTh}</div>
                                    )}
                                  </div>
                                  {parseFloat(option.defaultPriceModifier as any || '0') !== 0 && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {parseFloat(option.defaultPriceModifier as any || '0') > 0 ? '+' : ''}
                                      ฿{Math.abs(parseFloat(option.defaultPriceModifier as any || '0'))}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Turnaround / Delivery Speed */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center">
                          <Truck className="w-4 h-4 mr-2 text-emerald-600" />
                          Turnaround / Delivery
                        </Label>
                        <Select
                          value={selectedOptions['turnaround'] || ""}
                          onValueChange={(value) => handleOptionChange('turnaround', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select turnaround..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              groupedOptions['turnaround'] || [
                                { id: 'standard-2-3', nameEn: 'Standard (2-3 business days)', nameTh: 'ปกติ 2-3 วันทำการ', defaultPriceModifier: 0 },
                                { id: 'express-1-2', nameEn: 'Express (1-2 business days)', nameTh: 'ด่วน 1-2 วันทำการ', defaultPriceModifier: 300 },
                                { id: 'same-day', nameEn: 'Same Day (Pickup/Quick)', nameTh: 'รับวันนี้ (Quick)', defaultPriceModifier: 600 },
                              ] as any
                            ).map((option: any) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{option.nameEn}</span>
                                  {parseFloat(option.defaultPriceModifier as any || '0') !== 0 && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {parseFloat(option.defaultPriceModifier as any || '0') > 0 ? '+' : ''}
                                      ฿{Math.abs(parseFloat(option.defaultPriceModifier as any || '0'))}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Packaging / Corners */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center">
                          <Package className="w-4 h-4 mr-2 text-rose-600" />
                          Packaging
                        </Label>
                        <Select
                          value={selectedOptions['packaging'] || ""}
                          onValueChange={(value) => handleOptionChange('packaging', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select packaging..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              groupedOptions['packaging'] || [
                                { id: 'no-box', nameEn: 'No Box (Default)', nameTh: 'ไม่มีกล่อง', defaultPriceModifier: 0 },
                                { id: 'polybag', nameEn: 'Hologram Polybag', nameTh: 'ถุงโพลีฮอโลแกรม', defaultPriceModifier: 50 },
                                { id: 'namecard-box', nameEn: 'Business Card Box (90x50mm)', nameTh: 'กล่องนามบัตร 90x50', defaultPriceModifier: 100 },
                              ] as any
                            ).map((option: any) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{option.nameEn}</span>
                                  {parseFloat(option.defaultPriceModifier as any || '0') !== 0 && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {parseFloat(option.defaultPriceModifier as any || '0') > 0 ? '+' : ''}
                                      ฿{Math.abs(parseFloat(option.defaultPriceModifier as any || '0'))}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center">
                          <Layers className="w-4 h-4 mr-2 text-sky-600" />
                          Corners
                        </Label>
                        <Select
                          value={selectedOptions['corners'] || ""}
                          onValueChange={(value) => handleOptionChange('corners', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select corners..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              groupedOptions['corners'] || [
                                { id: 'square', nameEn: 'Square Corners', nameTh: 'มุมตรง', defaultPriceModifier: 0 },
                                { id: 'rounded', nameEn: 'Rounded Corners', nameTh: 'มุมมน', defaultPriceModifier: 150 },
                              ] as any
                            ).map((option: any) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-medium">{option.nameEn}</span>
                                  {parseFloat(option.defaultPriceModifier as any || '0') !== 0 && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {parseFloat(option.defaultPriceModifier as any || '0') > 0 ? '+' : ''}
                                      ฿{Math.abs(parseFloat(option.defaultPriceModifier as any || '0'))}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Additional Options */}
                    {Object.entries(groupedOptions).filter(([type]) => !['size', 'paper', 'printing', 'finishing', 'artwork', 'turnaround', 'packaging', 'corners', 'quantity', 'qty'].includes(type)).length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">Additional Options</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(groupedOptions).filter(([type]) => !['size', 'paper', 'printing', 'finishing', 'artwork', 'turnaround', 'packaging', 'corners', 'quantity', 'qty'].includes(type)).map(([type, options]) => (
                            <div key={type} className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 capitalize">{type}</Label>
                              <Select
                                value={selectedOptions[type] || ""}
                                onValueChange={(value) => handleOptionChange(type, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={`Select ${type}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      <div className="flex items-center justify-between w-full">
                                        <span className="font-medium">{locale === 'th' ? (option.nameTh || option.nameEn) : option.nameEn}</span>
                                        {parseFloat(option.defaultPriceModifier as any || '0') !== 0 && (
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            {parseFloat(option.defaultPriceModifier as any || '0') > 0 ? '+' : ''}
                                            ฿{Math.abs(parseFloat(option.defaultPriceModifier as any || '0'))}
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product Specifications Info */}
                    <Card className="border border-blue-200 bg-blue-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start space-x-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <div className="font-medium mb-1">Product Specifications</div>
                            <div className="text-blue-700 space-y-1">
                              <div>• Standard business card size: 90x50mm</div>
                              <div>• Available in various paper weights and finishes</div>
                              <div>• Full color printing on both sides available</div>
                              <div>• Custom finishing options for premium look</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Printing Guidelines Inspired by RedPrinting */}
                    <Accordion type="single" collapsible className="bg-white border rounded-md">
                      <AccordionItem value="guidelines">
                        <AccordionTrigger className="px-4">
                          Printing Guidelines & File Setup
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 text-sm text-gray-700 space-y-3">
                          <div className="font-medium">Cutting / Working Size</div>
                          <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Cutting Size</strong>: Final trim line where artwork is cut.</li>
                            <li><strong>Safety Area</strong>: Keep important content within 3mm from the trim.</li>
                            <li><strong>Working Size (Bleed)</strong>: Add 2mm bleed on all sides to avoid white edges.</li>
                          </ul>
                          <div className="font-medium">Image Resolution</div>
                          <p>Use images at 300dpi for best results. Increasing dpi on low-res images won’t fully improve sharpness.</p>
                          <div className="font-medium">Business Card Notes</div>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Boxes are not included by default. Compatible box size: 90x50mm.</li>
                            <li>Cards without basic contact details or under 100 pcs may be excluded from polybag packaging.</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Quantity Selector */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                      Quantity
                    </Label>

                    {/* Quantity Controls */}
                    <div className="space-y-4">
                      {/* Custom Quantity Input */}
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={selectedQuantity}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value) || 0;
                            const clamped = Math.max(50, Math.min(raw, 10000));
                            const roundedTo50 = Math.round(clamped / 50) * 50;
                            setSelectedQuantity(roundedTo50);
                          }}
                          className="w-32 text-center"
                          min="50"
                          max="10000"
                          step="50"
                        />
                        <span className="text-sm text-gray-600">pieces</span>
                      </div>

                      {/* Quick Quantity Buttons */}
                      <div className="grid grid-cols-8 gap-2">
                        {[50, 100, 250, 500, 1000, 2000, 5000, 10000].map((qty) => (
                          <Button
                            key={qty}
                            variant={selectedQuantity === qty ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedQuantity(qty)}
                            className="text-xs"
                          >
                            {qty.toLocaleString()}
                          </Button>
                        ))}
                      </div>

                      {/* Quantity Range Slider */}
                      <div className="space-y-2">
                        <Slider
                          value={[selectedQuantity]}
                          onValueChange={(value) => setSelectedQuantity(value[0])}
                          max={10000}
                          min={50}
                          step={50}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>50 pcs</span>
                          <span>10,000 pcs</span>
                        </div>
                      </div>

                      {/* Selected Quantity Display */}
                      <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{selectedQuantity.toLocaleString()}</div>
                          <div className="text-xs text-gray-600">pieces selected</div>
                          {tieredPricing && tieredPricing.length > 0 && selectedQuantity >= 500 && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              🎉 Volume discount applied!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Enhanced Pricing Summary */}
                <div className="space-y-6">
                  {/* Tiered Pricing Table (like Gogoprint) */}
                  {tieredPricing && tieredPricing.length > 0 && (
                    <Card className="border border-green-200 bg-green-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-800 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" /> Volume Discounts
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 text-xs font-medium text-green-900 border-b border-green-200">
                          <div className="py-2 px-2">Quantity</div>
                          <div className="py-2 px-2">Unit</div>
                          <div className="py-2 px-2 text-right">Total</div>
                        </div>
                        <div className="max-h-48 overflow-auto">
                          {tieredPricing
                            .slice()
                            .sort((a, b) => a.quantity - b.quantity)
                            .map((tier) => {
                              const unit = (parseFloat(tier.discountedPrice) / tier.quantity) || 0;
                              const isActive = selectedQuantity >= tier.quantity;
                              return (
                                <div key={tier.quantity} className={`grid grid-cols-3 text-xs items-center ${isActive ? 'bg-white' : ''} border-b border-green-100`}>
                                  <div className="py-2 px-2">{tier.quantity.toLocaleString()}</div>
                                  <div className="py-2 px-2">฿{unit.toFixed(2)}</div>
                                  <div className="py-2 px-2 text-right">฿{parseFloat(tier.discountedPrice).toFixed(2)}</div>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {/* Price Breakdown Card */}
                  <Card className="border-2 border-gray-200 bg-white shadow-lg">
                    <CardHeader className="pb-3 bg-gray-50">
                      <CardTitle className="flex items-center text-lg text-gray-800">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Price Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Unit Price Display */}
                      <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                        <div className="text-3xl font-bold text-green-600">฿{pricing.unitPrice.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">per piece</div>
                      </div>

                      {/* Subtotal (Quantity is already shown in the main form) */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Subtotal</span>
                          <span className="font-semibold text-gray-800">฿{pricing.subtotal.toFixed(2)}</span>
                        </div>

                        {/* Volume Discount */}
                        {pricing.savings > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-green-50 rounded px-2">
                            <span className="text-sm text-green-700 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              Volume Discount
                            </span>
                            <span className="font-semibold text-green-700">-฿{pricing.savings.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Shipping */}
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Shipping</span>
                          <span className={`font-semibold ${pricing.shippingCost === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                            {pricing.shippingCost === 0 ? 'FREE' : `฿${pricing.shippingCost.toFixed(2)}`}
                          </span>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg text-center">
                        <div className="text-sm opacity-90">Total Price</div>
                        <div className="text-3xl font-bold">฿{pricing.totalPrice.toFixed(2)}</div>
                        {pricing.savings > 0 && (
                          <div className="text-sm opacity-90 mt-1">
                            You save ฿{pricing.savings.toFixed(2)}!
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Summary Card */}
                  <Card className="border border-gray-200 bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Order Summary
                        </h4>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Product:</span>
                            <span className="font-medium">{currentProduct?.nameEn}</span>
                          </div>

                          {/* Selected Options */}
                          {Object.entries(selectedOptions).map(([type, optionId]) => {
                            const option = groupedOptions[type]?.find(o => o.id === optionId);
                            if (option && parseFloat(option.defaultPriceModifier as any || '0') !== 0) {
                              return (
                                <div key={type} className="flex justify-between">
                                  <span className="text-gray-600 capitalize">{type}:</span>
                                  <span className="font-medium">{option.nameEn}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>

                        {/* Estimated Delivery */}
                        <div className="flex items-center pt-2 border-t border-gray-200">
                          <Clock className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm text-gray-600">Estimated delivery: 2-3 business days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg h-12 text-lg font-semibold"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adding to Cart...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart - ฿{pricing.totalPrice.toFixed(2)}
                      </div>
                    )}
                  </Button>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-1 text-green-600" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1 text-blue-600" />
                      <span>Quality Guaranteed</span>
                    </div>
                    <div className="flex items-center">
                      <Truck className="w-4 h-4 mr-1 text-purple-600" />
                      <span>Fast Delivery</span>
                    </div>
                  </div>


                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <Card className="text-center p-4 bg-white/60">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Instant Pricing</h3>
              <p className="text-xs text-gray-600">Real-time calculations</p>
            </Card>
            <Card className="text-center p-4 bg-white/60">
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Quality Guarantee</h3>
              <p className="text-xs text-gray-600">100% satisfaction</p>
            </Card>
            <Card className="text-center p-4 bg-white/60">
              <Truck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Fast Delivery</h3>
              <p className="text-xs text-gray-600">2-3 business days</p>
            </Card>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}

// Enhanced Loading Skeleton
const LoadingSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <div className="text-center mb-8">
      <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
      <Skeleton className="h-8 w-64 mx-auto mb-2" />
      <Skeleton className="h-4 w-96 mx-auto" />
    </div>
    <Skeleton className="h-96 w-full rounded-lg" />
    <div className="grid md:grid-cols-3 gap-4 mt-8">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  </div>
);