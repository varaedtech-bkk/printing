import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Sparkles, 
  Phone, 
  ArrowRight, 
  CheckCircle,
  Star,
  Users
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function CallToAction() {
  const { t } = useI18n();
  const benefits = [
    "No credit card required",
    "AI design tools included",
    "Free shipping on first order",
    "24/7 customer support"
  ];

  return (
    <section className="py-20 gradient-cta">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main CTA Content */}
        <div className="mb-12">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30">
            <Star className="w-4 h-4 mr-2" />
            Limited Time Offer
          </Badge>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">{t('cta.title')}</h2>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">{t('cta.subtitle')}</p>

          {/* Benefits List */}
          <div className="grid md:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="flex items-center justify-center md:justify-start space-x-3 text-white/90"
                data-testid={`benefit-${index + 1}`}
              >
                <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span className="text-sm md:text-base">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/products">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
                data-testid="start-free-trial-button"
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                {t('cta.tryAI')}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4 transition-all duration-300"
              data-testid="contact-sales-button"
            >
              <Phone className="w-5 h-5 mr-2" />
              {t('cta.contactSales')}
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold mb-2">99.8%</div>
              <div className="text-white/80">Customer Satisfaction</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold mb-2">24h</div>
              <div className="text-white/80">Average Delivery</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold mb-2">10K+</div>
              <div className="text-white/80">Happy Customers</div>
            </CardContent>
          </Card>
        </div>

        {/* Social Proof */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex -space-x-1">
              {Array.from({ length: 5 }, (_, index) => (
                <div 
                  key={index}
                  className="w-8 h-8 bg-white/20 rounded-full border-2 border-white/40 flex items-center justify-center"
                >
                  <Users className="w-4 h-4 text-white/60" />
                </div>
              ))}
            </div>
            <span className="text-white/90 text-sm">+500 businesses joined this week</span>
          </div>
          
          <p className="text-white/70 text-sm">
            Trusted by startups, SMEs, and enterprises across Thailand
          </p>
        </div>

        {/* Urgency Element */}
        <Card className="bg-yellow-400/20 border-yellow-400/40 mt-8 inline-block">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2 text-yellow-200">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">
                Free AI credits expire in 7 days - Start now!
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
