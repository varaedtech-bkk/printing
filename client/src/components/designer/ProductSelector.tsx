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
  Triangle
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
        return <FileText className="w-4 h-4" />;
      case 'flyers':
        return <FileText className="w-4 h-4" />;
      case 'posters':
        return <ImageIcon className="w-4 h-4" />;
      case 'banners':
        return <ImageIcon className="w-4 h-4" />;
      case 'stickers':
        return <Square className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
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
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-3 border-b bg-gray-50">
        <h3 className="text-base font-semibold text-gray-900">Choose Print Product</h3>
        <p className="text-xs text-gray-600 mt-1">
          Select a product type to start designing
        </p>
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
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getCategoryIcon(category)}
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {getCategoryName(category as any)}
                  </div>
                                  <div className="text-xs text-gray-500">
                  {getCategoryNameThai(category as any)}
                </div>
                </div>
              </div>
              {expandedCategories.has(category) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Products in Category */}
            {expandedCategories.has(category) && (
              <div className="bg-gray-50 border-t">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`px-3 py-2 border-b last:border-b-0 hover:bg-white transition-colors cursor-pointer ${
                      selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getShapeIcon(product)}
                          <span className="font-medium text-gray-900">
                            {product.nameEn}
                          </span>
                          {selectedProduct?.id === product.id && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-1">
                          {product.description}
                        </div>

                        {/* Product Details */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            <span>
                              {product.dimensions.width} × {product.dimensions.height} mm
                            </span>
                          </div>
                          
                          {product.dimensions.bleed > 0 && (
                            <div className="flex items-center gap-1">
                              <Printer className="w-3 h-3" />
                              <span>
                                Bleed: {product.dimensions.bleed}mm
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Use Cases */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.useCases.slice(0, 2).map((useCase, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {useCase}
                            </Badge>
                          ))}
                          {product.useCases.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.useCases.length - 2} more
                            </Badge>
                          )}
                        </div>

                        {/* Price Range */}
                        <div className="mt-1 text-xs font-medium text-green-600">
                          {product.priceRange}
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
      <div className="p-3 border-t bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>All products include professional print preparation</p>
          <p className="mt-1">Bleed areas and crop marks automatically applied</p>
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
