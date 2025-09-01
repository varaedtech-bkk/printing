import PricingCalculator from "@/components/pricing-calculator";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Zap, Shield, Truck, Star, CheckCircle, ArrowRight } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 antialiased [text-rendering:optimizeLegibility]">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full shadow-lg">
              <Calculator className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Order & Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Get instant, accurate pricing for your custom printing projects. Choose from our wide range of products and customize options to see real-time pricing updates.
          </p>

          {/* Key Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Best Price Guarantee</span>
            </div>
            <div className="flex items-center text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
              <Zap className="w-5 h-5 mr-2" />
              <span className="font-medium">Instant Calculations</span>
            </div>
            <div className="flex items-center text-purple-600 bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
              <Shield className="w-5 h-5 mr-2" />
              <span className="font-medium">Quality Assurance</span>
            </div>
          </div>

          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg text-lg px-8 py-4">
            Start Order <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Main Calculator */}
      <main className="flex-grow">
        <PricingCalculator />
      </main>

      {/* Additional Features Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Calculator?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our smart pricing calculator helps you make informed decisions with transparent pricing and professional quality guarantees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <Calculator className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Smart Calculations</h3>
              <p className="text-gray-600 text-sm">Real-time pricing updates as you configure your options</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Quality Options</h3>
              <p className="text-gray-600 text-sm">Premium materials and professional finishing options</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <Truck className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">Express and standard delivery options available</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Satisfaction Guarantee</h3>
              <p className="text-gray-600 text-sm">100% quality guarantee on all our products</p>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 max-w-2xl mx-auto border-0">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold mb-4">Ready to Order?</h3>
                <p className="mb-6 opacity-90">Configure your perfect product above and add it to your cart to proceed with your order.</p>
                <div className="flex items-center justify-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Free Shipping on Orders $100+
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    30-Day Money Back Guarantee
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
