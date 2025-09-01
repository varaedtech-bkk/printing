import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type CartItem } from "@shared/prisma-schema";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard,
  Smartphone,
  Truck,
  CheckCircle
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export default function Cart() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { userId, role } = useAuth(); // Get userId and role from useAuth
  const [checkoutStep, setCheckoutStep] = useState("cart"); // cart, shipping, payment, confirmation
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    postalCode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("promptpay");

  const { data: cartItems = [], isLoading: isLoadingCart } = useQuery<CartItem[]>({
    queryKey: ["/api/cart", userId],
    queryFn: async () => {
      if (!userId) return []; // Don't fetch if no userId
      const response = await fetch(`/api/cart?userId=${userId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
    enabled: !!userId, // Only run query if userId exists
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!userId) throw new Error("User not authenticated");
      await apiRequest("DELETE", `/api/cart/${itemId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({ title: "Item removed from cart" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove item",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!userId) throw new Error("User not authenticated");
      await apiRequest("PUT", `/api/cart/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update quantity",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      if (!userId) throw new Error("User not authenticated");
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] }); // Clear cart after order
      const data = await response.json();
      setCheckoutStep("confirmation");
      toast({ 
        title: "Order placed successfully! 🎉",
        description: `Your order number is ${data.orderNumber}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  // Fetch product details for items in cart
  const productDetailsQuery = useQuery({
    queryKey: ["cartProductDetails", cartItems.map(item => item.productId).join(",")],
    queryFn: async () => {
      if (!cartItems.length) return {};
      const details: { [key: string]: any } = {};
      for (const item of cartItems) {
        const res = await fetch(`/api/products/${item.productId}`, { credentials: 'include' });
        if (res.ok) {
          details[item.productId ?? ''] = await res.json();
        }
      }
      return details;
    },
    enabled: cartItems.length > 0,
  });

  const isLoading = isLoadingCart || productDetailsQuery.isLoading; // Combine loading states

  // Calculate totals
  const subtotal = Array.isArray(cartItems) ? cartItems.reduce((sum: number, item: CartItem) => {
    return sum + (parseFloat(item.totalPrice?.toString() || '0'));
  }, 0) : 0;
  const shippingCost = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shippingCost;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItemMutation.mutate(itemId);
      return;
    }
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleCheckout = () => {
    if (!userId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to proceed with checkout.",
        variant: "destructive",
      });
      return;
    }
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart first.",
        variant: "destructive",
      });
      return;
    }
    setCheckoutStep("shipping");
  };

  const handlePlaceOrder = () => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order.",
        variant: "destructive",
      });
      return;
    }
    // Generate a unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const orderData = {
      userId,
      orderNumber,
      subtotal: parseFloat(subtotal.toString()), // Convert to number
      shippingCost: parseFloat(shippingCost.toString()), // Convert to number
      totalAmount: parseFloat(total.toString()), // Convert to number
      paymentMethod,
      shippingAddress: shippingInfo,
      status: "PENDING", // Must be uppercase
      paymentStatus: "pending",
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice?.toString() || '0', // Keep as string for items
        totalPrice: item.totalPrice?.toString() || '0', // Keep as string for items
        selectedOptions: item.selectedOptions && typeof item.selectedOptions === 'object' && !Array.isArray(item.selectedOptions)
          ? item.selectedOptions
          : {}, // Ensure it's always an object, never an array
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {["cart", "shipping", "payment", "confirmation"].map((step, index) => (
            <div key={step} className="flex items-center">
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${checkoutStep === step || (index < ["cart", "shipping", "payment", "confirmation"].indexOf(checkoutStep))
                    ? "bg-primary border-primary text-white" 
                    : "border-gray-300 text-gray-400"
                  }`}
              >
                {step === "cart" && <ShoppingCart className="w-5 h-5" />}
                {step === "shipping" && <Truck className="w-5 h-5" />}
                {step === "payment" && <CreditCard className="w-5 h-5" />}
                {step === "confirmation" && <CheckCircle className="w-5 h-5" />}
              </div>
              {index < 3 && (
                <div 
                  className={`w-16 h-0.5 mx-2 
                    ${index < ["cart", "shipping", "payment", "confirmation"].indexOf(checkoutStep)
                      ? "bg-primary" 
                      : "bg-gray-300"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {checkoutStep === "cart" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Shopping Cart ({cartItems.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!userId ? (
                    <div className="text-center py-12">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Please log in to view your cart
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Log in to manage your items and proceed with checkout.
                      </p>
                      {/* <Button>Go to Login</Button> */}
                    </div>
                  ) : cartItems.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Your cart is empty
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start designing and add some amazing print products!
                      </p>
                      <Button data-testid="continue-shopping-button">
                        Continue Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map((item: any) => (
                        <div 
                          key={item.id} 
                          className="flex items-center space-x-4 p-4 border rounded-lg"
                          data-testid={`cart-item-${item.id}`}
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            {productDetailsQuery.data?.[item.productId]?.imageUrl ? (
                              <img 
                                src={productDetailsQuery.data[item.productId].imageUrl}
                                alt={productDetailsQuery.data[item.productId].nameEn}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl">📄</div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {productDetailsQuery.data?.[item.productId]?.nameEn || "Product Design"}
                            </h4>
                            <p className="text-sm text-gray-600">{t('cart.quantityPrice', { quantity: item.quantity, price: parseFloat(item.unitPrice?.toString() || '0').toLocaleString() })}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              data-testid={`decrease-quantity-${item.id}`}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              data-testid={`increase-quantity-${item.id}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold">{t('cart.lineTotal', { price: parseFloat(item.totalPrice?.toString() || '0').toLocaleString() })}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemMutation.mutate(item.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`remove-item-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between"><span>Subtotal</span><span>{t('cart.subtotal', { subtotal: subtotal.toLocaleString() })}</span></div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? "text-green-600" : ""}>{shippingCost === 0 ? t('cart.shippingFree') : `฿${shippingCost}`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{t('cart.total', { total: total.toLocaleString() })}</span></div>
                  
                  {shippingCost > 0 && subtotal < 1000 && (
                    <Badge variant="outline" className="w-full justify-center py-2">{t('cart.freeShipUpsell', { amount: (1000 - subtotal).toLocaleString() })}</Badge>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0 || !userId}
                    data-testid="checkout-button"
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {checkoutStep === "shipping" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={shippingInfo.firstName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      data-testid="shipping-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={shippingInfo.lastName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      data-testid="shipping-last-name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                    data-testid="shipping-phone"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                    data-testid="shipping-address"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="province">Province</Label>
                    <Select value={shippingInfo.province} onValueChange={(value) => setShippingInfo(prev => ({ ...prev, province: value }))}>
                      <SelectTrigger data-testid="shipping-province">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bangkok">Bangkok</SelectItem>
                        <SelectItem value="chiang-mai">Chiang Mai</SelectItem>
                        <SelectItem value="phuket">Phuket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={shippingInfo.district}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, district: e.target.value }))}
                      data-testid="shipping-district"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                      data-testid="shipping-postal-code"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setCheckoutStep("cart")}
                    data-testid="back-to-cart-button"
                  >
                    Back to Cart
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => setCheckoutStep("payment")}
                    data-testid="continue-to-payment-button"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {checkoutStep === "payment" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Options */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Choose Payment Method</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-colors ${paymentMethod === "promptpay" ? "border-primary bg-primary-50" : ""}`}
                      onClick={() => setPaymentMethod("promptpay")}
                      data-testid="payment-promptpay"
                    >
                      <CardContent className="p-6 text-center">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <h3 className="font-semibold">PromptPay</h3>
                        <p className="text-sm text-gray-600">QR Code Payment</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-colors ${paymentMethod === "credit_card" ? "border-primary bg-primary-50" : ""}`}
                      onClick={() => setPaymentMethod("credit_card")}
                      data-testid="payment-credit-card"
                    >
                      <CardContent className="p-6 text-center">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <h3 className="font-semibold">Credit Card</h3>
                        <p className="text-sm text-gray-600">Visa, Mastercard</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Order Summary */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-4">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>฿{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{shippingCost === 0 ? "Free" : `฿${shippingCost}`}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>฿{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex space-x-4 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setCheckoutStep("shipping")}
                    data-testid="back-to-shipping-button"
                  >
                    Back to Shipping
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handlePlaceOrder}
                    disabled={createOrderMutation.isPending}
                    data-testid="place-order-button"
                  >
                    {createOrderMutation.isPending ? "Processing..." : "Place Order"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {checkoutStep === "confirmation" && (
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="p-12">
                <div className="text-green-600 text-6xl mb-6">✅</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Order Confirmed!
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Thank you for your order. We'll start processing it right away.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold mb-4">Next Steps:</h3>
                  <div className="space-y-2 text-left">
                    <p>• You'll receive an email confirmation shortly</p>
                    <p>• We'll notify you when your order is ready for printing</p>
                    <p>• Estimated delivery: 2-3 business days</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    className="w-full"
                    data-testid="track-order-button"
                  >
                    Track Your Order
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setCheckoutStep("cart");
                      // In production, also clear the cart
                    }}
                    data-testid="continue-shopping-confirmation"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}