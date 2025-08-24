import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Heart, 
  ShoppingBag,
  Loader2,
  AlertCircle
} from "lucide-react";
import { type CartItem as CartItemType } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { toast } from "@/components/ui/use-toast";

interface CartItemProps {
  item: CartItemType;
  variant?: 'default' | 'compact' | 'checkout';
  showRemoveButton?: boolean;
  showQuantityControls?: boolean;
  className?: string;
  onItemUpdate?: (productId: string, quantity: number) => void;
  onItemRemove?: (productId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  variant = 'default',
  showRemoveButton = true,
  showQuantityControls = true,
  className = '',
  onItemUpdate,
  onItemRemove
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const { updateQuantity, removeItem, loading } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    
    setIsUpdating(true);
    setLocalQuantity(newQuantity);
    
    try {
      if (onItemUpdate) {
        onItemUpdate(item.product_id, newQuantity);
      } else {
        await updateQuantity(item.product_id, newQuantity);
      }
    } catch (error) {
      // Revert local quantity on error
      setLocalQuantity(item.quantity);
      toast({
        description: "Failed to update quantity",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      if (onItemRemove) {
        onItemRemove(item.product_id);
      } else {
        await removeItem(item.product_id);
      }
    } catch (error) {
      toast({
        description: "Failed to remove item",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 1;
    if (newValue >= 1 && newValue <= 99) {
      handleQuantityChange(newValue);
    }
  };

  const isDisabled = isUpdating || loading;
  const product = item.product;

  if (!product) {
    return (
      <Card className={`${className} border-destructive`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Product not available</span>
            {showRemoveButton && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                disabled={isDisabled}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant for mobile/drawer
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-3 ${className}`}>
        <div className="w-12 h-12 flex-shrink-0 bg-muted rounded overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <h4 className="font-medium text-sm truncate">{product.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-muted-foreground">
              × {localQuantity}
            </span>
          </div>
        </div>

        {showQuantityControls && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuantityChange(localQuantity - 1)}
              disabled={isDisabled || localQuantity <= 1}
              className="h-7 w-7 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-6 text-center">
              {localQuantity}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuantityChange(localQuantity + 1)}
              disabled={isDisabled || localQuantity >= 99}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}

        {showRemoveButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={isDisabled}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  // Checkout variant - read-only
  if (variant === 'checkout') {
    return (
      <div className={`flex items-center gap-4 p-4 ${className}`}>
        <div className="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-grow">
          <h4 className="font-medium">{product.name}</h4>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {product.category?.replace('-', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Qty: {localQuantity}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-primary">
            {formatPrice(product.price)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatPrice(product.price * localQuantity)} total
          </div>
        </div>
      </div>
    );
  }

  // Default variant - full controls
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <Link to={`/products/${product.id}`}>
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Product Details */}
          <div className="flex-grow space-y-4">
            <div className="space-y-2">
              <Link to={`/products/${product.id}`}>
                <h3 className="font-semibold text-lg leading-tight hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {product.category?.replace('-', ' ')}
                </Badge>
                {product.stock_quantity && product.stock_quantity > 0 && (
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
                  {formatPrice(product.price)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatPrice(product.price * localQuantity)} total
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Quantity Controls */}
                {showQuantityControls && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(localQuantity - 1)}
                      disabled={isDisabled || localQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={localQuantity}
                        onChange={handleInputChange}
                        className="text-center"
                        disabled={isDisabled}
                      />
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(localQuantity + 1)}
                      disabled={isDisabled || localQuantity >= 99}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {showRemoveButton && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRemove}
                      disabled={isDisabled}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartItem;
