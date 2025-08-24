import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "./NewAuthContext";
import { useNavigate } from "react-router-dom";
import {
  getCartItems,
  addToCart as addToCartDB,
  updateCartItem as updateCartItemDB,
  removeFromCart as removeFromCartDB,
  clearCart as clearCartDB,
  type CartItem,
  type Product
} from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { errorManager } from "@/lib/error-manager";

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  loading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCartFromLocalStorage: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface LocalCartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const { user, hasActiveSubscription, subscriptionLoading } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!user;

  // Load cart on auth state change
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserCart();
    } else {
      loadLocalCart();
    }
  }, [isAuthenticated, user]);

  const loadUserCart = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is available before attempting to fetch
      if (!window.navigator.onLine) {
        console.log('No internet connection, loading from localStorage');
        loadLocalCart();
        return;
      }

      const cartItems = await getCartItems(user.id);
      setItems(cartItems || []);
    } catch (error: any) {
      console.error('Error loading cart:', error?.message || error);

      // Check for network errors
      if (error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('fetch') ||
          error?.message?.includes('network') ||
          error?.name === 'TypeError') {
        console.log('Network error detected, using localStorage fallback');
        setError('Using offline data due to connection issues');
      } else {
        const appError = errorManager.categorizeError(error, 'CartProvider.loadUserCart');
        setError(appError.userMessage);
      }

      // Always try to load from localStorage as fallback
      loadLocalCart();
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadLocalCart = () => {
    try {
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const parsedCart: LocalCartItem[] = JSON.parse(localCart);
        // Convert local cart format to CartItem format
        const cartItems: CartItem[] = parsedCart.map(item => ({
          id: `local-${item.productId}`,
          user_id: 'guest',
          product_id: item.productId,
          quantity: item.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product: item.product
        }));
        setItems(cartItems);
      }
    } catch (error) {
      console.error('Error loading local cart:', error);
    }
  };

  const saveToLocalStorage = (cartItems: CartItem[]) => {
    const localCart: LocalCartItem[] = cartItems.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      product: item.product
    }));
    localStorage.setItem('cart', JSON.stringify(localCart));
  };

  const syncCartFromLocalStorage = async () => {
    if (!user) return;

    try {
      const localCart = localStorage.getItem('cart');
      if (!localCart) return;

      const parsedCart: LocalCartItem[] = JSON.parse(localCart);
      if (parsedCart.length === 0) return;

      setLoading(true);

      // Sync each item to Supabase
      for (const item of parsedCart) {
        await addToCartDB(user.id, item.productId, item.quantity);
      }

      // Clear local storage and reload user cart
      localStorage.removeItem('cart');
      await loadUserCart();
      
      toast({ description: `${parsedCart.length} items synced to your account` });
    } catch (error) {
      console.error('Error syncing cart:', error);
      toast({ 
        description: 'Failed to sync cart items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    // Check subscription status for authenticated users
    if (isAuthenticated && !subscriptionLoading && !hasActiveSubscription) {
      toast({
        description: 'Active subscription required to add items to cart',
        variant: 'destructive'
      });
      navigate('/subscription');
      return;
    }

    try {
      setOperationInProgress(`add-${product.id}`);
      setError(null);

      if (isAuthenticated && user) {
        // Add to Supabase
        await addToCartDB(user.id, product.id, quantity);
        await loadUserCart();
      } else {
        // Add to local storage
        const existingItemIndex = items.findIndex(item => item.product_id === product.id);
        let newItems: CartItem[];

        if (existingItemIndex > -1) {
          // Update existing item
          newItems = [...items];
          newItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `local-${product.id}`,
            user_id: 'guest',
            product_id: product.id,
            quantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            product
          };
          newItems = [...items, newItem];
        }

        setItems(newItems);
        saveToLocalStorage(newItems);
      }

      toast({ description: `${product.name} added to cart` });
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'CartProvider.addToCart');
      setError(appError.userMessage);

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });
    } finally {
      setOperationInProgress(null);
    }
  }, [items, isAuthenticated, user, loadUserCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    // Check subscription status for authenticated users
    if (isAuthenticated && !subscriptionLoading && !hasActiveSubscription) {
      toast({
        description: 'Active subscription required to modify cart',
        variant: 'destructive'
      });
      navigate('/subscription');
      return;
    }

    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    const previousItems = [...items];

    try {
      setOperationInProgress(`update-${productId}`);
      setError(null);

      // Optimistic update
      const optimisticItems = items.map(item =>
        item.product_id === productId
          ? { ...item, quantity, updated_at: new Date().toISOString() }
          : item
      );
      setItems(optimisticItems);

      if (isAuthenticated && user) {
        await updateCartItemDB(user.id, productId, quantity);
        // Refresh to get accurate data from server
        await loadUserCart();
      } else {
        saveToLocalStorage(optimisticItems);
      }
    } catch (error) {
      // Revert optimistic update on error
      setItems(previousItems);

      const appError = errorManager.categorizeError(error, 'CartProvider.updateQuantity');
      setError(appError.userMessage);

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });
    } finally {
      setOperationInProgress(null);
    }
  }, [items, isAuthenticated, user, loadUserCart]);

  const removeItem = useCallback(async (productId: string) => {
    // Check subscription status for authenticated users
    if (isAuthenticated && !subscriptionLoading && !hasActiveSubscription) {
      toast({
        description: 'Active subscription required to modify cart',
        variant: 'destructive'
      });
      navigate('/subscription');
      return;
    }

    const previousItems = [...items];

    try {
      setOperationInProgress(`remove-${productId}`);
      setError(null);

      // Optimistic update
      const optimisticItems = items.filter(item => item.product_id !== productId);
      setItems(optimisticItems);

      if (isAuthenticated && user) {
        await removeFromCartDB(user.id, productId);
        // Refresh to ensure sync
        await loadUserCart();
      } else {
        saveToLocalStorage(optimisticItems);
      }

      toast({ description: 'Item removed from cart' });
    } catch (error) {
      // Revert optimistic update on error
      setItems(previousItems);

      const appError = errorManager.categorizeError(error, 'CartProvider.removeItem');
      setError(appError.userMessage);

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });
    } finally {
      setOperationInProgress(null);
    }
  }, [items, isAuthenticated, user, loadUserCart]);

  const clearCart = useCallback(async () => {
    const previousItems = [...items];

    try {
      setOperationInProgress('clear');
      setError(null);

      // Optimistic update
      setItems([]);

      if (isAuthenticated && user) {
        await clearCartDB(user.id);
      } else {
        localStorage.removeItem('cart');
      }

      toast({ description: 'Cart cleared successfully' });
    } catch (error) {
      // Revert optimistic update on error
      setItems(previousItems);

      const appError = errorManager.categorizeError(error, 'CartProvider.clearCart');
      setError(appError.userMessage);

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });
    } finally {
      setOperationInProgress(null);
    }
  }, [items, isAuthenticated, user]);

  // Utility methods
  const refreshCart = useCallback(async () => {
    if (isAuthenticated && user) {
      await loadUserCart();
    } else {
      loadLocalCart();
    }
  }, [isAuthenticated, user, loadUserCart]);

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.product_id === productId);
  }, [items]);

  const getItemQuantity = useCallback((productId: string) => {
    const item = items.find(item => item.product_id === productId);
    return item?.quantity || 0;
  }, [items]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    return {
      items,
      totalItems,
      totalAmount,
      loading: loading || !!operationInProgress,
      error,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      syncCartFromLocalStorage,
      refreshCart,
      isInCart,
      getItemQuantity,
      clearError,
    };
  }, [
    items,
    loading,
    error,
    operationInProgress,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    syncCartFromLocalStorage,
    refreshCart,
    isInCart,
    getItemQuantity,
    clearError
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
