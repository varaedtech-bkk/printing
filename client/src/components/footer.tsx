import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  MessageSquare,
  Youtube,
  Globe,
  CreditCard,
  Truck,
  Shield,
  Clock
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  const productLinks = [
    { href: "/products/business-cards", labelKey: "footer.links.businessCards", testId: "footer-business-cards" },
    { href: "/products/flyers", labelKey: "footer.links.flyers", testId: "footer-flyers" },
    { href: "/products/posters", labelKey: "footer.links.posters", testId: "footer-posters" },
    { href: "/products/banners", labelKey: "footer.links.banners", testId: "footer-banners" },
    { href: "/products/stickers", labelKey: "footer.links.stickers", testId: "footer-stickers" },
    { href: "/products/packaging", labelKey: "footer.links.packaging", testId: "footer-packaging" },
  ];

  const serviceLinks = [
    { href: "/ai-designer", label: t('navigation.designer'), testId: "footer-ai-designer" },
    { href: "/background-removal", label: t('footer.links.bgRemoval'), testId: "footer-background-removal" },
    { href: "/templates", label: t('footer.links.templates'), testId: "footer-templates" },
    { href: "/custom-design", label: t('footer.links.customDesign'), testId: "footer-custom-design" },
    { href: "/express-delivery", label: t('footer.links.express'), testId: "footer-express-delivery" },
    { href: "/installation", label: t('footer.links.installation'), testId: "footer-installation" },
  ];

  const supportLinks = [
    { href: "/privacy", label: t('footer.links.privacy'), testId: "footer-privacy" },
    { href: "/terms", label: t('footer.links.terms'), testId: "footer-terms" },
    { href: "/faq", label: t('footer.links.faq'), testId: "footer-faq" },
    { href: "/help", label: t('footer.links.help'), testId: "footer-help" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/printeasy", label: "Facebook", testId: "social-facebook" },
    { icon: Instagram, href: "https://instagram.com/printeasy", label: "Instagram", testId: "social-instagram" },
    { icon: MessageSquare, href: "https://line.me/printeasy", label: "LINE", testId: "social-line" },
    { icon: Youtube, href: "https://youtube.com/printeasy", label: "YouTube", testId: "social-youtube" },
  ];

  const features = [
    { icon: CreditCard, label: "PromptPay & Credit Cards", testId: "feature-payment" },
    { icon: Truck, label: t('footer.links.shippingFeature'), testId: "feature-shipping" },
    { icon: Shield, label: "100% Quality Guarantee", testId: "feature-quality" },
    { icon: Clock, label: "24/7 Customer Support", testId: "feature-support" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="md:col-span-1">
            <Link href="/">
              <div className="flex items-center space-x-3 mb-6 cursor-pointer" data-testid="footer-logo">
                <div className="gradient-primary w-10 h-10 rounded-lg flex items-center justify-center">
                  <div className="text-white">🖨️</div>
                </div>
                <span className="text-xl font-bold">{t('navigation.brand')}</span>
              </div>
            </Link>
            
            <p className="text-gray-400 mb-6 leading-relaxed">
              {t('footer.platform')}
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                  data-testid={social.testId}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-6 text-lg">{t('footer.products')}</h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <button 
                      className="text-gray-400 hover:text-white transition-colors text-left"
                      data-testid={link.testId}
                    >
                      {t(link.labelKey)}
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-6 text-lg">{t('footer.services')}</h3>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <button 
                      className="text-gray-400 hover:text-white transition-colors text-left"
                      data-testid={link.testId}
                    >
                      {link.label}
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-semibold mb-6 text-lg">{t('footer.contact')}</h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span data-testid="contact-phone">02-123-4567</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span data-testid="contact-email">info@printeasy.th</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-400">
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span data-testid="contact-line">@printeasy</span>
              </div>
              
              <div className="flex items-start space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed" data-testid="contact-address" style={{ whiteSpace: 'pre-line' }}>
                  {t('footer.address')}
                </span>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-3">Newsletter</h4>
              <p className="text-gray-400 text-sm mb-3">
                Get updates on new features and exclusive offers
              </p>
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  data-testid="newsletter-email"
                />
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary-600"
                  data-testid="newsletter-subscribe"
                >
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-3 text-gray-300"
                  data-testid={feature.testId}
                >
                  <feature.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{feature.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-gray-800 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-gray-400 text-sm">
            <span data-testid="copyright">
              © 2025 SRC Printing Thailand. All rights reserved.
            </span>
            <Globe className="w-4 h-4" />
            <span>Thailand</span>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
            {supportLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <button 
                  className="text-gray-400 hover:text-white transition-colors"
                  data-testid={link.testId}
                >
                  {link.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="sm"
          className="bg-primary hover:bg-primary-600 rounded-full w-12 h-12 p-0 shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          data-testid="back-to-top"
          aria-label="Back to top"
        >
          ↑
        </Button>
      </div>
    </footer>
  );
}
