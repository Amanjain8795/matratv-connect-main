import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag,
  AlertCircle,
  Loader2,
  Heart,
  RotateCcw,
  Truck,
  Shield
} from "lucide-react";
import { useAuth } from "@/context/NewAuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "@/components/ui/use-toast";

const Cart = () => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const { items, totalItems, totalAmount, loading, updateQuantity, removeItem, clearCart } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Initialize quantities from cart items
  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    items.forEach(item => {
      initialQuantities[item.product_id] = item.quantity;
    });
    setQuantities(initialQuantities);
  }, [items]);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(productId);
    setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
    
    try {
      await updateQuantity(productId, newQuantity);
      toast({
        description: "Cart updated successfully",
        variant: "default"
      });
    } catch (error) {
      // Revert on error
      const item = items.find(i => i.product_id === productId);
      if (item) {
        setQuantities(prev => ({ ...prev, [productId]: item.quantity }));
      }
      toast({
        description: "Failed to update cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setIsUpdating(productId);
    try {
      await removeItem(productId);
      toast({
        description: "Item removed from cart",
        variant: "default"
      });
    } catch (error) {
      toast({
        description: "Failed to remove item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to remove all items from your cart?")) {
      return;
    }

    setIsUpdating("clear");
    try {
      await clearCart();
      toast({
        description: "Cart cleared successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        description: "Failed to clear cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleCheckout = () => {
    if (!user) {
      toast({
        description: "Please sign in to proceed with checkout",
        variant: "destructive"
      });
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getDeliveryEstimate = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3); // 3 days delivery
    
    return deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Seo title="Your Cart" description="Review items in your shopping cart" />
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading your cart...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Seo title="Your Cart" description="Your shopping cart is empty" />
        <div className="container py-8">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="text-3xl font-bold">Your cart is empty</h1>
              <p className="text-muted-foreground text-lg">
                Looks like you haven't added anything to your cart yet.
              </p>
            </div>

            <div className="space-y-4">
              <Button onClick={handleContinueShopping} size="lg" className="w-full sm:w-auto">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Continue Shopping
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <p>Need help? <Link to="/contact" className="text-primary hover:underline">Contact us</Link></p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo 
        title={`Your Cart (${totalItems} items)`}
        description="Review and manage items in your shopping cart before checkout"
      />

      <SubscriptionGuard feature="shopping cart">
        <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-8 w-8" />
                  Shopping Cart
                </h1>
                <p className="text-muted-foreground mt-2">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
              
              {items.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleClearCart}
                  disabled={isUpdating === "clear"}
                >
                  {isUpdating === "clear" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Clear Cart
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-lg overflow-hidden">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg leading-tight">
                            {item.product?.name}
                          </h3>
                          
                          {item.product?.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.product.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {item.product?.category?.replace('-', ' ')}
                            </Badge>
                            {item.product?.stock_quantity && item.product.stock_quantity > 0 && (
                              <Badge variant="outline" className="text-green-600">
                                In Stock
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Price and Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="space-y-2">
                            <div className="text-2xl font-bold text-primary">
                              {formatPrice(item.product?.price || 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatPrice((item.product?.price || 0) * item.quantity)} total
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.product_id, (quantities[item.product_id] || 1) - 1)}
                                disabled={isUpdating === item.product_id || (quantities[item.product_id] || 1) <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              
                              <div className="w-20">
                                <Input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={quantities[item.product_id] || 1}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 1;
                                    if (newQty > 0 && newQty <= 99) {
                                      handleQuantityChange(item.product_id, newQty);
                                    }
                                  }}
                                  className="text-center"
                                  disabled={isUpdating === item.product_id}
                                />
                              </div>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.product_id, (quantities[item.product_id] || 1) + 1)}
                                disabled={isUpdating === item.product_id || (quantities[item.product_id] || 1) >= 99}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Remove Button */}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveItem(item.product_id)}
                              disabled={isUpdating === item.product_id}
                            >
                              {isUpdating === item.product_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal ({totalItems} items)</span>
                      <span className="font-medium">{formatPrice(totalAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    className="w-full" 
                    size="lg"
                    disabled={loading || totalItems === 0}
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Proceed to Checkout
                  </Button>

                  <Button 
                    onClick={handleContinueShopping}
                    variant="outline" 
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="font-medium">Free Delivery</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estimated delivery by {getDeliveryEstimate()}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">Secure Checkout</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your payment information is protected
                  </p>
                </CardContent>
              </Card>

              {/* Security Badge */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>100% Secure Checkout</strong><br />
                  Secure UPI payments with admin verification
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
        </div>
      </SubscriptionGuard>
    </>
  );
};

export default Cart;
