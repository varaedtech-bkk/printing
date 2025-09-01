import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Play, 
  Brain, 
  Scissors,
  ArrowRight,
  Palette,
  Star,
  Zap,
  Shield,
  Clock
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function HeroSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { t } = useI18n();

  const featuredCategories = [
    { name: "Business Cards", icon: "💼", href: "/products/business-cards", color: "from-blue-500 to-blue-600" },
    { name: "Stickers", icon: "🏷️", href: "/products/stickers", color: "from-green-500 to-green-600" },
    { name: "Posters", icon: "📰", href: "/products/posters", color: "from-purple-500 to-purple-600" },
    { name: "Apparel", icon: "👕", href: "/products/apparel", color: "from-orange-500 to-orange-600" },
  ];

  const features = [
    { icon: Zap, title: "Fast Turnaround", description: "Same day printing available" },
    { icon: Shield, title: "Quality Guaranteed", description: "100% satisfaction or reprint" },
    { icon: Clock, title: "24/7 Support", description: "Always here to help you" },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      ></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3 mb-6">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-4 py-2">
                <Star className="w-4 h-4 mr-2" />
                #1 Printing Platform
              </Badge>
              <Badge className="bg-green-100 text-green-700 border-0 px-4 py-2">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Design
              </Badge>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Professional
              <span className="block text-gradient-primary">
                Printing Solutions
              </span>
              <span className="block text-3xl lg:text-4xl text-gray-600 font-normal mt-4">
                Made Simple & Beautiful
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Transform your ideas into stunning printed materials with our AI-powered design tools and premium printing services.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  data-testid="start-ai-design-button"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Start Designing Now
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary text-lg px-8 py-6 hover:bg-gray-50 transition-all duration-300"
                onClick={() => setIsVideoPlaying(true)}
                data-testid="watch-demo-button"
              >
                <Play className="w-6 h-6 mr-3" />
                Watch Demo
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Enhanced Design */}
          <div className="relative">
            {/* Main Editor Window */}
            <Card className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-2 hover:rotate-1 transition-all duration-500 hover:shadow-3xl">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl h-80 flex items-center justify-center mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50"></div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-gray-700 font-semibold text-lg mb-2">AI Design Studio</p>
                  <p className="text-sm text-gray-500">Create stunning designs in minutes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-500 ml-3 font-medium">CognitoSphere Designer</span>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-bounce">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Palette className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">AI Templates</p>
                    <p className="text-xs text-gray-500">1000+ designs</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Custom Cuts</p>
                    <p className="text-xs text-gray-500">Any shape</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Featured Categories */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Categories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our most requested printing services and start creating your perfect design
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredCategories.map((category, index) => (
              <Link key={index} href={category.href}>
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-3xl">{category.icon}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <div className="flex items-center justify-center mt-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm">Explore</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
