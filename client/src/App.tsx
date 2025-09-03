import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products";
import Designer from "@/pages/designer";
import AIDesigner from "@/pages/ai-designer";
import Cart from "@/pages/cart";
import Templates from "@/pages/templates";
import Contact from "@/pages/contact";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import Admin from "@/pages/admin";
import Vendor from "@/pages/vendor";
import VendorShop from "@/pages/vendor-shop";
import Login from "@/pages/login";
import PricingPage from "@/pages/pricing"; // Import the new pricing page
import { CartProvider } from "@/context/cart-context"; // Import CartProvider from new context file
import { StripeProvider } from "@/context/stripe-context"; // Import StripeProvider
import ScrollToTop from "./lib/scrolltop";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:category" component={Products} />
      {/* Designer requires a product ID */}
      <Route path="/designer" component={Designer} />
      <Route path="/designer/:productId" component={Designer} />
      {/* AI Designer */}
      <Route path="/ai-designer" component={AIDesigner} />
      <Route path="/templates" component={Templates} />
      <Route path="/contact" component={Contact} />
      <Route path="/cart" component={Cart} />
      <Route path="/pricing" component={PricingPage} /> {/* Add route for pricing page */}
      <Route path="/admin" component={Admin} />
      <Route path="/vendor" component={Vendor} />
      <Route path="/printing/:shopName" component={VendorShop} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <StripeProvider>
            <TooltipProvider>
              <Toaster />
              <CartProvider> {/* Wrap Router with CartProvider */}
                   <ScrollToTop />
                <Router />
              </CartProvider>
            </TooltipProvider>
          </StripeProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
