import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { 
  ShoppingCart, 
  Menu, 
  User,
  Search,
  Globe,
  Sparkles,
  ChevronDown,
  X,
  Heart,
  MessageCircle
} from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { locale, setLocale, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState<string | null>(null);
  const { cartCount } = useCart();
  const { role, userId, logout } = useAuth();

  const navLinks = [
    {
      href: "/",
      key: "navigation.home",
      hasMegaMenu: false
    },
    {
      href: "/products",
      key: "navigation.products",
      hasMegaMenu: true,
      megaMenuItems: [
        { title: "Business Cards", href: "/products/business-cards", icon: "💼" },
        { title: "Stickers", href: "/products/stickers", icon: "🏷️" },
        { title: "Posters", href: "/products/posters", icon: "📰" },
        { title: "Apparel", href: "/products/apparel", icon: "👕" },
        { title: "Stationery", href: "/products/stationery", icon: "📝" },
        { title: "Promotional Items", href: "/products/promotional", icon: "🎁" }
      ]
    },
    {
      href: "/templates",
      key: "navigation.templates",
      hasMegaMenu: false
    },
    {
      href: "/ai-designer",
      key: "navigation.designer",
      hasMegaMenu: false
    },
    {
      href: "/pricing",
      key: "navigation.orderPricing",
      hasMegaMenu: false
    },
    {
      href: "/contact",
      key: "navigation.contact",
      hasMegaMenu: false
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log("Searching for:", searchQuery);
      // Here you would typically navigate to search results
      // For now, we'll just close the search
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar - Hidden on mobile, shown on md+ */}
      <div className="hidden md:block bg-primary text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span>📞</span>
                <span>+66 94 887 7955</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🕒</span>
                <span>Everyday (9:30am - 6:30pm)</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 hover:text-gray-200 transition-colors px-2 py-1 rounded">
                <Heart className="w-4 h-4" />
                <span className="hidden lg:inline">Wishlist</span>
              </button>
              <button className="flex items-center space-x-2 hover:text-gray-200 transition-colors px-2 py-1 rounded">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden lg:inline">Chat Support</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 md:space-x-4 cursor-pointer" data-testid="logo">
              <div className="gradient-primary w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <div className="text-white text-xl md:text-2xl">🖨️</div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {t('navigation.brand')}
                </span>
                <span className="text-xs md:text-sm text-gray-500 hidden sm:block">Printing & Design Solutions</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <div key={link.href} className="relative">
                {link.hasMegaMenu ? (
                  <div
                    onMouseEnter={() => setShowMegaMenu(link.href)}
                    onMouseLeave={() => setShowMegaMenu(null)}
                  >
                    <button className="flex items-center space-x-1 text-gray-700 hover:text-primary font-medium transition-colors py-2">
                      <span>{t(link.key)}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {showMegaMenu === link.href && (
                      <div className="absolute top-full left-0 w-80 bg-white shadow-xl border border-gray-200 rounded-lg py-4 z-50">
                        <div className="grid grid-cols-2 gap-4 px-6">
                          {link.megaMenuItems?.map((item) => (
                            <Link key={item.href} href={item.href}>
                              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-gray-700 font-medium">{item.title}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 mt-4 pt-4 px-6">
                          <Link href={link.href}>
                            <div className="text-primary hover:text-primary-600 font-medium cursor-pointer">
                              View All {t(link.key)} →
                            </div>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={link.href}>
                    <button 
                      className={`text-gray-700 hover:text-primary font-medium transition-colors py-2 ${
                        location === link.href ? 'text-primary' : ''
                      }`}
                      data-testid={`nav-link-${link.href.replace('/', '') || 'home'}`}
                    >
                      {t(link.key)}
                    </button>
                  </Link>
                )}
              </div>
            ))}
            {role === 'VENDOR' && (
              <Link href="/vendor">
                <button className="text-gray-700 hover:text-primary font-medium transition-colors py-2">Vendor</button>
              </Link>
            )}
            {role === 'ADMIN' && (
              <Link href="/admin">
                <button className="text-gray-700 hover:text-primary font-medium transition-colors py-2">Admin</button>
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-1 md:space-x-2 lg:space-x-4">
            {/* Search - Desktop */}
            <div className="hidden md:block relative">
              {showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Search products, templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 lg:w-64"
                    autoFocus
                  />
                  <Button type="submit" size="sm" variant="ghost">
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSearch(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  data-testid="search-button"
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Language Switcher - Desktop */}
            <div className="hidden lg:flex items-center space-x-1 text-sm">
              <Button
                variant={locale === "th" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocale("th")}
                data-testid="language-th"
                className="px-2 py-1 text-xs"
              >
                TH
              </Button>
              <Button
                variant={locale === "en" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocale("en")}
                data-testid="language-en"
                className="px-2 py-1 text-xs"
              >
                EN
              </Button>
            </div>

            {/* Shopping Cart */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2"
                data-testid="cart-button"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]"
                    data-testid="cart-count"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 md:hidden"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* User Menu - Desktop */}
            <div className="hidden sm:block">
              {userId ? (
                <Button
                  className="bg-primary text-white hover:bg-primary-600 text-sm px-3 py-2"
                  onClick={logout}
                  data-testid="logout-button"
                >
                  <User className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              ) : (
                <Link href="/login">
                  <Button
                    className="bg-primary text-white hover:bg-primary-600 text-sm px-3 py-2"
                    data-testid="login-button"
                  >
                    <User className="w-4 h-4 mr-1" />
                    <span className="hidden md:inline">{t('navigation.login')}</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 md:hidden"
                  data-testid="mobile-menu-trigger"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 max-w-[90vw]">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-semibold text-gray-900">Menu</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Mobile Search */}
                  <div className="p-4 border-b">
                    <form onSubmit={handleSearch} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Search products, templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" size="sm">
                        <Search className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {navLinks.map((link) => (
                      <div key={link.href}>
                        <Link href={link.href}>
                          <button
                            className="w-full text-left p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                            data-testid={`mobile-nav-${link.href.replace('/', '') || 'home'}`}
                          >
                            {t(link.key)}
                          </button>
                        </Link>

                        {/* Mobile Mega Menu Items */}
                        {link.hasMegaMenu && link.megaMenuItems && (
                          <div className="ml-4 space-y-1 mt-2">
                            {link.megaMenuItems.map((item) => (
                              <Link key={item.href} href={item.href}>
                                <button
                                  className="w-full text-left p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors text-sm flex items-center"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <span className="mr-3 text-lg">{item.icon}</span>
                                  <span>{item.title}</span>
                                </button>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Mobile Role-based Links */}
                    {role === 'VENDOR' && (
                      <Link href="/vendor">
                        <button
                          className="w-full text-left p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Vendor Dashboard
                        </button>
                      </Link>
                    )}
                    {role === 'ADMIN' && (
                      <Link href="/admin">
                        <button
                          className="w-full text-left p-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Admin Dashboard
                        </button>
                      </Link>
                    )}
                  </div>

                  {/* Mobile Footer */}
                  <div className="border-t p-4 space-y-4">
                    {/* Mobile Language Switcher */}
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-sm text-gray-600 mr-2">Language:</span>
                      <Button
                        variant={locale === "en" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLocale("en")}
                        className="flex-1"
                      >
                        English
                      </Button>
                      <Button
                        variant={locale === "th" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLocale("th")}
                        className="flex-1"
                      >
                        ไทย
                      </Button>
                    </div>

                    {/* Mobile User Menu */}
                    <div className="flex items-center justify-center">
                      {userId ? (
                        <Button
                          className="w-full bg-primary text-white hover:bg-primary-600"
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      ) : (
                        <Link href="/login" className="w-full">
                          <Button
                            className="w-full bg-primary text-white hover:bg-primary-600"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="w-4 h-4 mr-2" />
                            {t('navigation.login')}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setShowSearch(false)}>
          <div className="absolute top-16 left-4 right-4 bg-white rounded-lg shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Search products, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="sm">
                <Search className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowSearch(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}