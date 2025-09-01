import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Scissors, 
  Palette, 
  ArrowRight,
  Sparkles,
  Wand2,
  Eye,
  Zap
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AIFeatures() {
  const { t } = useI18n();
  const features = [
    {
      icon: Brain,
      title: "AI Text-to-Design",
      description: t('aiFeatures.prompt.description'),
      gradient: "from-purple-50 to-blue-50",
      iconBg: "from-purple-500 to-blue-500",
      iconColor: "text-purple-600",
      linkColor: "text-purple-600 hover:text-purple-700",
      borderColor: "border-purple-100",
      testId: "ai-text-to-design"
    },
    {
      icon: Scissors,
      title: t('aiFeatures.bgRemoval.title'),
      description: t('aiFeatures.bgRemoval.description'),
      gradient: "from-orange-50 to-red-50",
      iconBg: "from-orange-500 to-red-500",
      iconColor: "text-orange-600",
      linkColor: "text-orange-600 hover:text-orange-700",
      borderColor: "border-orange-100",
      testId: "ai-background-removal"
    },
    {
      icon: Palette,
      title: t('aiFeatures.colorSuggest.title'),
      description: t('aiFeatures.colorSuggest.description'),
      gradient: "from-green-50 to-teal-50",
      iconBg: "from-green-500 to-teal-500",
      iconColor: "text-green-600",
      linkColor: "text-green-600 hover:text-green-700",
      borderColor: "border-green-100",
      testId: "ai-color-suggestions"
    }
  ];

  const additionalFeatures = [
    {
      icon: Wand2,
      title: "Layout Optimization",
      description: "AI optimizes your layout for maximum visual impact and readability",
      testId: "ai-layout-optimization"
    },
    {
      icon: Eye,
      title: "Error Detection",
      description: "Automatic detection of print quality issues before production",
      testId: "ai-error-detection"
    },
    {
      icon: Zap,
      title: "Smart Templates",
      description: "Personalized template recommendations based on your industry",
      testId: "ai-smart-templates"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4" data-testid="ai-features-badge">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Technology
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('aiFeatures.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('aiFeatures.subtitle')}
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`bg-gradient-to-br ${feature.gradient} rounded-2xl border ${feature.borderColor} hover:shadow-lg transition-all duration-300 group`}
              data-testid={feature.testId}
            >
              <CardContent className="p-8">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <Button 
                  variant="link" 
                  className={`p-0 ${feature.linkColor} font-semibold group-hover:translate-x-1 transition-transform duration-300`}
                  data-testid={`try-${feature.testId}`}
                >
                  {t('aiFeatures.try')} 
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              More AI-Powered Features
            </h3>
            <p className="text-gray-600">
              Discover additional intelligent tools that enhance your design workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="bg-white hover:shadow-md transition-shadow duration-300"
                data-testid={feature.testId}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-primary-500 to-secondary-500 border-0">
            <CardContent className="p-8 md:p-12 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Experience AI-Powered Design?
              </h3>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of businesses using our AI tools to create stunning print designs
              </p>
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4"
                data-testid="start-free-trial-button"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
