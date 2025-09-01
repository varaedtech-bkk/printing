import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type CartItem as DBCartItem } from "@shared/prisma-schema";
import { useAuth } from "@/lib/auth";

// Define the interface for a CartItem, extending DBCartItem
export interface CartItem extends Omit<DBCartItem, 'userId' | 'createdAt'> {
  productName?: string;
  previewImage?: string;
}

// Define the interface for the CartContextValue
interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  isLoading: boolean;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  isItemInCart: (productId: string, designProjectId?: string) => boolean;
  getItemQuantity: (productId: string, designProjectId?: string) => number;
  isAdding: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  isClearing: boolean;
}

// Create the CartContext with an initial undefined value
export const CartContext = createContext<CartContextValue | undefined>(undefined);

// Define the CartProvider component
interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { toast } = useToast();
  const { userId } = useAuth();

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/cart?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
    enabled: !!userId,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (item: Omit<CartItem, 'id'>) => {
      if (!userId) throw new Error("User not authenticated");
      return await apiRequest("POST", "/api/cart", {
        ...item,
        userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Added to cart! 🛒",
        description: "Item has been added to your cart successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!userId) throw new Error("User not authenticated");
      return await apiRequest("PUT", `/api/cart/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update quantity",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!userId) throw new Error("User not authenticated");
      return await apiRequest("DELETE", `/api/cart/${itemId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove item",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User not authenticated");
      return await apiRequest("DELETE", "/api/cart", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
  });

  const cartCount = Array.isArray(cartItems) ? cartItems.length : 0;
  const cartTotal = Array.isArray(cartItems) ? cartItems.reduce((sum: number, item: CartItem) => {
    return sum + parseFloat(item.totalPrice?.toString() || '0');
  }, 0) : 0;

  const subtotal = cartTotal;
  const shippingCost = cartTotal > 1000 ? 0 : 50;
  const total = subtotal + shippingCost;

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    addToCartMutation.mutate(item);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCartMutation.mutate(itemId);
    } else {
      updateQuantityMutation.mutate({ itemId, quantity });
    }
  };

  const removeItem = (itemId: string) => {
    removeFromCartMutation.mutate(itemId);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
  };

  const isItemInCart = (productId: string, designProjectId?: string) => {
    return Array.isArray(cartItems) ? cartItems.some((item: CartItem) => 
      item.productId === productId && 
      item.designProjectId === designProjectId
    ) : false;
  };

  const getItemQuantity = (productId: string, designProjectId?: string) => {
    if (!Array.isArray(cartItems)) return 0;
    const item = cartItems.find((item: CartItem) => 
      item.productId === productId && 
      item.designProjectId === designProjectId
    );
    return item?.quantity || 0;
  };

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    subtotal,
    shippingCost,
    total,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    isItemInCart,
    getItemQuantity,
    isAdding: addToCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use the CartContext
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
