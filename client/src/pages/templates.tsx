import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Eye, Edit, Star, Heart, ArrowLeft } from "lucide-react";
import { type DesignTemplate } from "@shared/prisma-schema";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Link } from "wouter";

export default function Templates() {
  const [, navigate] = useLocation();

  const { data: templates, isLoading, error } = useQuery<DesignTemplate[]>({
    queryKey: ["/api/templates"],
  });

  // Ensure templates is always an array to prevent map errors
  const safeTemplates = Array.isArray(templates) ? templates : [];

  // Map category IDs to appropriate product IDs
  const getProductIdForCategory = (categoryId: string) => {
    console.log('🎨 Mapping category to product:', categoryId);

    const categoryToProductMap: { [key: string]: string } = {
      'cmf1ahbz00005uc2shy136py5': 'cmf1ahbzx000cuc2s70gchc2o', // Business Cards -> Square Business Card
      'cmf1ahbz90006uc2sqdm6o86y': 'cmf1ahc01000euc2s4u03xz6y', // Flyers & Brochures -> A4 Flyer
      'cmf1ahbzc0007uc2s8b4rwzib': 'cmf1ahbzx000cuc2s70gchc2o', // Banners & Posters -> Square Business Card
      'cmf1ahbze0008uc2sihufp8ob': 'cmf1ahc08000iuc2sr4euio6n', // Stickers & Labels -> Round Stickers
    };

    const productId = categoryToProductMap[categoryId];

    if (!productId) {
      console.warn('🎨 Unknown category ID:', categoryId, '- using default product');
      return 'cmf1ahbzx000cuc2s70gchc2o'; // Default to Square Business Card
    }

    console.log('🎨 Mapped to product ID:', productId);
    return productId;
  };

  const handleUseTemplate = (templateId: string, categoryId: string) => {
    const productId = getProductIdForCategory(categoryId);
    navigate(`/konva-demo?template=${templateId}&product=${productId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading templates...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Failed to load templates</h2>
            <p className="text-gray-600 mb-6">Please try refreshing the page or contact support.</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Professional Templates
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Choose from hundreds of professionally designed templates. Start designing faster with our AI-powered templates.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => navigate('/products')} className="bg-primary text-white hover:bg-primary-600">Browse Products First</Button>
              <Button onClick={() => navigate('/konva-demo')} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Start Designing Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {safeTemplates.map((template) => (
              <Card key={template.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={template.thumbnail || `https://picsum.photos/300/400?random=${template.id}`}
                      alt={template.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to a generic template image if the specific one fails
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('picsum.photos')) {
                          target.src = `/images/templates/default-template.svg`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    <div className="absolute top-3 right-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        data-testid={`preview-${template.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Premium badge - could be based on template tags */}
                    {template.tags?.includes('premium') && (
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2 line-clamp-2">
                    {template.name}
                  </CardTitle>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Heart className="w-4 h-4 mr-1" />
                      <span>{Math.floor(Math.random() * 1000) + 100}</span>
                    </div>
                    <Button
                      onClick={() => handleUseTemplate(template.id, template.categoryId)}
                      className="bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700"
                      data-testid={`use-template-${template.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {safeTemplates.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                No templates available yet
              </h3>
              <p className="text-gray-600 mb-8">
                We're working on adding more beautiful templates for you.
              </p>
              <Button onClick={() => navigate("/products")} data-testid="browse-products">
                Browse Products Instead
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}