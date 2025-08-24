import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShoppingCart, 
  ShoppingBag,
  ArrowRight,
  Trash2,
  Plus
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/NewAuthContext";
import CartItem from "./CartItem";

interface CartDrawerProps {
  children?: React.ReactNode;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const { items, totalItems, totalAmount, clearCart, loading } = useCart();
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleCheckout = () => {
    setOpen(false);
    // Navigation will be handled by the Link component
  };

  const handleClearCart = async () => {
    if (window.confirm("Remove all items from cart?")) {
      await clearCart();
    }
  };

  const trigger = children || (
    <Button variant="outline" size="sm" className="relative">
      <ShoppingCart className="h-4 w-4" />
      {totalItems > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {totalItems > 99 ? '99+' : totalItems}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            {totalItems > 0 && (
              <Badge variant="secondary">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {totalItems === 0 
              ? "Your cart is empty"
              : `Review your items before checkout`
            }
          </SheetDescription>
        </SheetHeader>

        {totalItems === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">
                Add some products to get started
              </p>
            </div>
            <Button asChild className="w-full" onClick={() => setOpen(false)}>
              <Link to="/products">
                <Plus className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-grow flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Items in cart</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCart}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>

              <ScrollArea className="flex-grow">
                <div className="space-y-3 pr-4">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      variant="compact"
                      className="border rounded-lg"
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Summary and Actions */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                {user ? (
                  <Button asChild className="w-full" onClick={handleCheckout}>
                    <Link to="/checkout">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Checkout
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full" onClick={handleCheckout}>
                    <Link to="/login" state={{ from: '/cart' }}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Sign in to Checkout
                    </Link>
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setOpen(false)}
                  >
                    <Link to="/cart">View Cart</Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    <Link to="/products">Continue Shopping</Link>
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Free shipping on all orders • Secure checkout
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
