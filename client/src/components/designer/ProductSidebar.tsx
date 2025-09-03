import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ProductSelector } from '@/components/designer/ProductSelector';
import { PrintProduct } from '@/lib/print-product-config';
import { X } from 'lucide-react';

interface ProductSidebarProps {
  showSidebar: boolean;
  onClose: () => void;
  onProductSelect: (product: PrintProduct) => void;
  selectedProduct: PrintProduct | null;
}

export function ProductSidebar({
  showSidebar,
  onClose,
  onProductSelect,
  selectedProduct,
}: ProductSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block transition-all duration-300 ease-in-out ${
          showSidebar ? "w-64 md:w-72" : "w-0"
        } bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 ${
          !showSidebar ? "overflow-hidden" : ""
        }`}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Products</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Separator />
        <div className="p-3">
          <ProductSelector
            onProductSelect={onProductSelect}
            currentProduct={selectedProduct || undefined}
          />
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      {showSidebar && (
        <>
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-lg shadow-xl z-50 max-h-[50vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Products</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3">
              <ProductSelector
                onProductSelect={onProductSelect}
                currentProduct={selectedProduct || undefined}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
