import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import AIFeatures from "@/components/ai-features";
import ProductCategories from "@/components/product-categories";
import VendorShowcase from "@/components/vendor-showcase";
import DesignEditor from "@/components/design-editor";
import PricingCalculator from "@/components/pricing-calculator";
import CustomerReviews from "@/components/customer-reviews";
import CallToAction from "@/components/call-to-action";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <HeroSection />
      <AIFeatures />
      <VendorShowcase />
      <ProductCategories />
      {/* Streamline flow: emphasize products and order & pricing instead of inline editor */}
      {/* <DesignEditor /> */}
      <PricingCalculator />
      <CustomerReviews />
      <CallToAction />
      <Footer />
    </div>
  );
}
