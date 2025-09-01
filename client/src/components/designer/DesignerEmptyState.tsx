import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Sparkles, Palette, Type, Image as ImageIcon, FileText } from "lucide-react";
import { TemplateGallery } from "./TemplateGallery";

interface DesignerEmptyStateProps {
  popularProducts: any[];
  popularProductsLoading: boolean;
}

export function DesignerEmptyState({ popularProducts, popularProductsLoading }: DesignerEmptyStateProps) {
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const handleTemplateSelect = (template: any) => {
    console.log('🎨 Template selected from empty state:', template);
    // For now, just show a message. In a real app, this would redirect to a product selection
    alert(`Template "${template.title}" selected! Please choose a product to continue.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Design Something
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Amazing
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose a product to start creating your custom design. From business cards to banners, 
            we've got everything you need to bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Browse Products
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowTemplateGallery(true)}
              className="flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Start with Template
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Type className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Text & Typography</h3>
            <p className="text-gray-600">
              Add beautiful text with custom fonts, sizes, and colors to make your design stand out.
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Colors</h3>
            <p className="text-gray-600">
              AI-powered color suggestions and professional palettes for every design style.
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Upload</h3>
            <p className="text-gray-600">
              Upload your own images and designs to customize and enhance your projects.
            </p>
          </Card>
        </div>

        {/* Popular Products */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Popular Products</h2>
          {popularProductsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="bg-gray-200 h-32 rounded mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {popularProducts?.slice(0, 3).map((product) => (
                <Link key={product.id} to={`/designer/${product.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                    <div className="bg-gray-100 h-32 rounded mb-4 flex items-center justify-center">
                      <span className="text-4xl">🎨</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{product.nameEn}</h3>
                    <p className="text-gray-600 text-sm">
                      {product.description || "Start designing your custom " + product.nameEn.toLowerCase()}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of designers who trust our platform for their creative projects.
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
    </div>
  );
}
