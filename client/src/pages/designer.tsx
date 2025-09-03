import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, FileText, Upload, Palette, ArrowRight } from "lucide-react";

export default function Designer() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Auto-redirect after a short delay to show the page
    const timer = setTimeout(() => {
      navigate('/ai-designer');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const quickActions = [
    {
      icon: FileText,
      title: "Start with Template",
      description: "Choose from professional templates",
      action: () => navigate('/templates'),
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Upload,
      title: "Upload Design",
      description: "Import your own design file",
      action: () => navigate('/ai-designer'),
      color: "from-green-500 to-green-600"
    },
    {
      icon: Sparkles,
      title: "AI Designer",
      description: "Let AI create designs for you",
      action: () => navigate('/ai-designer'),
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Palette,
      title: "Blank Canvas",
      description: "Start from scratch",
      action: () => navigate('/ai-designer'),
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />

      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mb-6">
            AI-Powered Designer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Create stunning designs with our advanced AI tools. Choose how you'd like to start your design journey.
          </p>
          <Button
            onClick={() => navigate('/ai-designer')}
            className="bg-primary text-white hover:bg-primary-600 text-lg px-8 py-4"
          >
            Open Designer
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 group"
              onClick={action.action}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 bg-gradient-to-r ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Redirecting to Advanced Editor...
            </h3>
            <p className="text-gray-600 mb-6">
              You're being redirected to our powerful Konva-based designer with AI features.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
