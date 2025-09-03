import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, 
  Sparkles, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { type ProductCategory, type Product } from "@shared/prisma-schema";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/hooks/use-cart"; // Import useCart
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest

export default function ProductCategories() {
  const { t } = useI18n();
  const { data: categories, isLoading: categoriesLoading } = useQuery<ProductCategory[]>({
    queryKey: ["/api/categories"]
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"]
  });

  // Use the fetched products directly
  const displayProducts = products;

  const { addToCart, isAdding } = useCart(); // Destructure isAdding from useCart
  const { toast } = useToast();
  
  const calculatePriceMutation = useMutation({
    mutationFn: async ({ productId, quantity, selectedOptions }: { productId: string; quantity: number; selectedOptions?: Record<string, any> }) => {
      return await apiRequest("POST", "/api/calculate-price", { productId, quantity, selectedOptions });
    },
    onError: (error) => {
      toast({
        title: "Failed to calculate price",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickAddToCart = async (product: Product) => {
    try {
      if (!product.id) {
        toast({ title: "Invalid product", description: "Cannot add an invalid product to cart.", variant: "destructive" });
        return;
      }
      const priceResponse = await calculatePriceMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
        selectedOptions: {}, // Should be an object, not an array
      });
      const priceData = await priceResponse.json();

      if (!priceData || typeof priceData.basePrice === 'undefined' || typeof priceData.totalPrice === 'undefined') {
        throw new Error("Server did not return valid price data.");
      }
 
      addToCart({
        productId: product.id,
        quantity: 1,
        unitPrice: priceData.basePrice.toString(),
        totalPrice: priceData.totalPrice.toString(),
        designProjectId: null,
        selectedOptions: [], // Should be an array, not an object
        updatedAt: new Date(),
      });
      toast({
        title: `${product.nameEn || product.nameTh} added to cart! 🛒`,
        description: `Added ${product.nameEn || product.nameTh} to your cart.`,
      });
    } catch (error) {
      console.error("Error quick adding to cart:", error);
      toast({
        title: "Failed to add to cart",
        description: (error as Error).message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (categoriesLoading || productsLoading || calculatePriceMutation.isPending) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="w-full h-48" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4" data-testid="popular-products-badge">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('categories.title')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('categories.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('categories.subtitle')}
          </p>
        </div>

        {!displayProducts || displayProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600">
                No products are currently available.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {displayProducts.map((product: Product, index: number) => (
                <Card 
                  key={product.id || index}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white"
                  data-testid={`product-card-${product.id || index}`}
                >
                  {/* Product Image */}
                  <div className="relative overflow-hidden">
                    <img 
                      src={(product as any).thumbnail || product.image || `https://picsum.photos/400/300?random=${product.id}`}
                      alt={product.nameEn || product.nameTh}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = `https://picsum.photos/400/300?random=${product.id}`;
                      }}
                    />
                    {/* Popular badge - can be implemented later if needed */}
                    <Badge className="absolute top-2 right-2 bg-primary text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Ready
                    </Badge>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.nameTh || product.nameEn}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      {product.description || "Professional quality printing"}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          ฿{parseFloat(product.basePrice.toString()).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          {t('categories.businessCards.startFrom')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Link href={`/designer/${product.id}`}>
                        <Button 
                          className="w-full bg-primary hover:bg-primary-600 group-hover:scale-105 transition-transform duration-300"
                          data-testid={`design-ai-button-${product.id}`}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {t('categories.businessCards.designWithAI')}
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                        onClick={() => handleQuickAddToCart(product)}
                        disabled={isAdding || calculatePriceMutation.isPending || !product.id}
                        data-testid={`quick-order-button-${product.id || index}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isAdding || calculatePriceMutation.isPending ? "Adding..." : t('categories.businessCards.orderNow')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        {/* Categories Section */}
        {categories && categories.length > 0 && (
          <div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Browse by Category</h3>
              <p className="text-gray-600">Find exactly what you need for your business</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category: any) => (
                <Link key={category.id} href={`/products/${category.slug}`}>
                  <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-200 transition-colors">
                        <span className="text-2xl">📄</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
                        {category.nameEn}
                      </h4>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            <CardContent className="p-8 md:p-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Don't see what you need?
              </h3>
              <p className="text-xl text-gray-600 mb-8">
                We offer custom printing solutions for any project size
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary-600"
                  data-testid="view-all-products-button"
                >
                  View All Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  data-testid="contact-sales-button"
                >
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
