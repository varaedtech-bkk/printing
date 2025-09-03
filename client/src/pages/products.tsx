import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ShoppingCart, Sparkles, ArrowLeft } from "lucide-react";
import { type ProductCategory, type Product } from "@shared/prisma-schema";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient"; // Import apiRequest
import { useMutation } from "@tanstack/react-query"; // Import useMutation

// Function to get demo images for products
const getDemoImage = (product: Product) => {
  const productName = product.nameEn.toLowerCase();
  
  // Generate consistent demo images based on product type
  if (productName.includes('business card')) {
    return `https://picsum.photos/400/300?random=business-card&id=${product.id}`;
  } else if (productName.includes('flyer') || productName.includes('brochure')) {
    return `https://picsum.photos/400/300?random=flyer&id=${product.id}`;
  } else if (productName.includes('banner') || productName.includes('poster')) {
    return `https://picsum.photos/400/300?random=banner&id=${product.id}`;
  } else if (productName.includes('sticker') || productName.includes('label')) {
    return `https://picsum.photos/400/300?random=sticker&id=${product.id}`;
  } else {
    return `https://picsum.photos/400/300?random=product&id=${product.id}`;
  }
};

export default function Products() {
  const { category } = useParams<{ category?: string }>();
  const cart = useCart();
  const { toast } = useToast();
  
  const { data: categories, isLoading: categoriesLoading } = useQuery<ProductCategory[]>({
    queryKey: ["/api/categories"]
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: category ? ["/api/products", `?category=${category}`] : ["/api/products"]
  });

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
      const priceResponse = await calculatePriceMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
        selectedOptions: [], // Should be an array, not an object
      });
      const priceData = await priceResponse.json();

      if (!priceData || typeof priceData.basePrice === 'undefined' || typeof priceData.totalPrice === 'undefined') {
        throw new Error("Server did not return valid price data.");
      }

      cart.addToCart({
        productId: product.id,
        quantity: 1,
        unitPrice: priceData.basePrice.toString(),
        totalPrice: priceData.totalPrice.toString(), 
        designProjectId: null,
        selectedOptions: [],
        updatedAt: new Date(),
      });
      toast({
        title: `${product.nameEn} added to cart! 🛒`,
        description: `Added ${product.nameEn} to your cart.`,
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

  if (categoriesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {category ? `${category} Products` : 'All Products'}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose from our wide range of high-quality printing products
            </p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Link href="/products">
                <Button 
                  variant={!category ? "default" : "outline"}
                  data-testid="category-all"
                >
                  All Categories
                </Button>
              </Link>
              {Array.isArray(categories) && categories.map((cat: ProductCategory) => (
                <Link key={cat.id} href={`/products/${cat.slug}`}>
                  <Button 
                    variant={category === cat.slug ? "default" : "outline"}
                    data-testid={`category-${cat.slug}`}
                  >
                    {cat.nameEn}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!Array.isArray(products) || products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600">
                {category 
                  ? `No products available in the ${category} category yet.`
                  : "No products are currently available."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.isArray(products) && products.map((product: Product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-all duration-300"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img 
                      src={product.image || getDemoImage(product)}
                      alt={product.nameEn}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getDemoImage(product);
                      }}
                    />
                    <Badge className="absolute top-2 left-2 bg-primary text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Ready
                    </Badge>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.nameEn}
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
                          starting price
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Link href={`/designer/${product.id}`}>
                        <Button 
                          className="w-full bg-primary hover:bg-primary-600"
                          data-testid={`design-button-${product.id}`}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Design with AI
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleQuickAddToCart(product)}
                        disabled={cart.isAdding || calculatePriceMutation.isPending}
                        data-testid={`quick-add-${product.id}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {cart.isAdding ? "Adding..." : "Quick Add to Cart"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
