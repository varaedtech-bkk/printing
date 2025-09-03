import React, { useState } from 'react';
import { 
  PRINT_PRODUCTS, 
  getProductsByCategory, 
  getCategoryName, 
  getCategoryNameThai 
} from '@/lib/print-product-config';
import { PrintProduct } from '@/lib/print-product-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Ruler,
  Printer,
  FileText,
  Image as ImageIcon,
  Square,
  Circle,
  Triangle,
  Star,
  Sparkles,
  Palette,
  Zap,
  Award
} from 'lucide-react';

interface ProductSelectorProps {
  onProductSelect: (product: PrintProduct) => void;
  currentProduct?: PrintProduct;
  className?: string;
}

export function ProductSelector({ 
  onProductSelect, 
  currentProduct,
  className = '' 
}: ProductSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['business-cards']));
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(currentProduct || null);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleProductSelect = (product: PrintProduct) => {
    setSelectedProduct(product);
    onProductSelect(product);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business-cards':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'flyers':
        return <Palette className="w-5 h-5 text-green-600" />;
      case 'posters':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'banners':
        return <Zap className="w-5 h-5 text-orange-600" />;
      case 'stickers':
        return <Star className="w-5 h-5 text-pink-600" />;
      case 'brochures':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'letterheads':
        return <Award className="w-5 h-5 text-teal-600" />;
      case 'envelopes':
        return <Square className="w-5 h-5 text-gray-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-500" />;
    }
  };

  const getShapeIcon = (product: PrintProduct) => {
    const { width, height } = product.dimensions;
    const ratio = width / height;
    
    if (Math.abs(ratio - 1) < 0.1) {
      return <Square className="w-3 h-3" />;
    } else if (ratio > 1) {
      return <ImageIcon className="w-3 h-3" />;
    } else {
      return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className={`bg-white rounded-xl border shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="relative p-4 border-b bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Choose Print Product</h3>
          </div>
          <p className="text-sm text-gray-600">
            Select a product type to start designing
          </p>
        </div>
      </div>

      {/* Product Categories */}
      <div className="max-h-80 overflow-y-auto">
        {Object.entries(
          PRINT_PRODUCTS.reduce((acc, product) => {
            if (!acc[product.category]) {
              acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
          }, {} as Record<string, PrintProduct[]>)
        ).map(([category, products]) => (
          <div key={category} className="border-b last:border-b-0">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  {getCategoryIcon(category)}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 group-hover:text-gray-800">
                    {getCategoryName(category as any)}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-600">
                    {getCategoryNameThai(category as any)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {products.length}
                </span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                )}
              </div>
            </button>

            {/* Products in Category */}
            {expandedCategories.has(category) && (
              <div className="bg-gray-50 border-t">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 m-2 rounded-lg border transition-all duration-200 cursor-pointer group ${
                      selectedProduct?.id === product.id
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                            {getShapeIcon(product)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 group-hover:text-gray-800">
                                {product.nameEn}
                              </span>
                              {selectedProduct?.id === product.id && (
                                <div className="p-1 bg-blue-500 rounded-full">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {product.description}
                            </p>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <div className="flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            <span>{product.dimensions.width} × {product.dimensions.height} mm</span>
                          </div>

                          {product.dimensions.bleed > 0 && (
                            <div className="flex items-center gap-1">
                              <Printer className="w-3 h-3" />
                              <span>Bleed: {product.dimensions.bleed}mm</span>
                            </div>
                          )}
                        </div>

                        {/* Use Cases */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.useCases.slice(0, 2).map((useCase, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                              {useCase}
                            </Badge>
                          ))}
                          {product.useCases.length > 2 && (
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              +{product.useCases.length - 2}
                            </Badge>
                          )}
                        </div>

                        {/* Price Range */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {product.priceRange}
                          </Badge>
                          {selectedProduct?.id === product.id && (
                            <span className="text-xs font-medium text-blue-600">Selected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Professional Quality</span>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>✨ All products include professional print preparation</p>
            <p>🎯 Bleed areas and crop marks automatically applied</p>
            <p>🚀 High-resolution output for crisp printing</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Product Picker for compact use
export function QuickProductPicker({ 
  onProductSelect, 
  currentProduct,
  className = '' 
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const popularProducts = PRINT_PRODUCTS.filter(product => 
    ['business-card-standard', 'flyer-a4', 'poster-a3'].includes(product.id)
  );

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full justify-between"
      >
        <span>
          {currentProduct ? currentProduct.nameEn : 'Select Product'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">
              Popular Products
            </div>
            {popularProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  onProductSelect(product);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-50 transition-colors ${
                  currentProduct?.id === product.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="font-medium">{product.nameEn}</div>
                <div className="text-xs text-gray-500">
                  {product.dimensions.width} × {product.dimensions.height} mm
                </div>
              </button>
            ))}
            
            <div className="border-t mt-2 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                View All Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
