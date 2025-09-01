import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery as useReactQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Product, type User } from "@shared/prisma-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import PricingCalculator from "@/components/pricing-calculator";

export default function VendorShop() {
  const { shopName } = useParams();
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Get vendor information
  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useReactQuery({
    queryKey: shopName ? ["/api/vendor/shop", shopName] : [],
    queryFn: () => shopName ?
      apiRequest("GET", `/api/vendor/shop/${shopName}`).then(res => res.json()) :
      Promise.resolve(null),
    enabled: !!shopName
  });

  // Get vendor's products
  const { data: products, isLoading: productsLoading, error: productsError } = useReactQuery({
    queryKey: vendor?.id ? ["/api/products", `?vendorId=${vendor.id}${selectedCategory ? `&category=${selectedCategory}` : ''}`] : [],
    queryFn: () => vendor?.id ?
      apiRequest("GET", `/api/products?vendorId=${vendor.id}${selectedCategory ? `&category=${selectedCategory}` : ''}`).then(res => res.json()) :
      Promise.resolve([]),
    enabled: !!vendor?.id
  });

  // Get categories
  const { data: categories } = useReactQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories").then(res => res.json())
  });

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading vendor shop...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (vendorError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Shop</h2>
          <p className="text-gray-600">Unable to load vendor shop information.</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop Not Found</h2>
          <p className="text-gray-600">The vendor shop "{shopName}" doesn't exist or is not available.</p>
          <p className="text-sm text-gray-500 mt-2">Available shops: sunnyshop, bkkprints, creativeprint</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <main className="flex-grow">
        {/* Vendor Header */}
        <header className="bg-gradient-to-r from-red-600 to-amber-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-4">
                {(vendor.firstName?.[0] || 'S').toUpperCase() + (vendor.lastName?.[0] || '').toUpperCase()}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{vendor.firstName} {vendor.lastName}</h1>
              <p className="text-base md:text-lg opacity-90 mb-4">Professional Print Services</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{vendor.phone}</Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{vendor.email}</Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white rounded-lg border p-1 shadow-sm">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

          <TabsContent value="products" className="mt-8">
            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("")}
                >
                  All Categories
                </Button>
                {categories?.map((category: any) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    {category.nameEn}
                  </Button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products?.map((product: Product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow flex flex-col">
                    <CardHeader className="p-0">
                      <img
                        src={(product as any).thumbnail || product.image || `https://picsum.photos/300/200?random=${product.id}`}
                        alt={product.nameEn}
                        className="w-full h-48 object-cover rounded-t-lg"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = `https://picsum.photos/300/200?random=${product.id}`;
                        }}
                      />
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <CardTitle className="text-lg mb-1 truncate">{product.nameEn}</CardTitle>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <div className="mt-auto flex justify-between items-center">
                        <span className="text-xl font-bold text-primary">฿{parseFloat(product.basePrice.toString()).toLocaleString()}</span>
                        <Button size="sm" onClick={() => setSelectedProduct(product)}>
                          Order Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!productsLoading && productsError && (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg">Error loading products. Please try again.</p>
              </div>
            )}

            {!productsLoading && !productsError && products?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {selectedCategory ? `No products available in ${selectedCategory} category.` : "No products available."}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>About {vendor.firstName} {vendor.lastName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Professional printing services specializing in high-quality custom prints.
                  We offer a wide range of products from business cards to large format banners.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="font-medium text-gray-700">Phone</label>
                  <p className="text-gray-600">{vendor.phone}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Email</label>
                  <p className="text-gray-600">{vendor.email}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Address</label>
                  <p className="text-gray-600">Bangkok, Thailand</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>

        {/* Pricing Calculator Modal */}
        {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Order {selectedProduct.nameEn}</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProduct(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6">
              <PricingCalculator initialProduct={selectedProduct} />
            </div>
          </div>
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
