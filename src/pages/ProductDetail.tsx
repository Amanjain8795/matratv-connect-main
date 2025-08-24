import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  ArrowLeft, 
  Star, 
  Shield, 
  Truck, 
  RefreshCw,
  Plus,
  Minus
} from "lucide-react";
import { getProduct, type Product } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { SubscriptionButton } from "@/components/subscription/SubscriptionGuard";
import { toast } from "@/components/ui/use-toast";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { t } = useTranslation();
  const { addToCart, loading: cartLoading } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const data = await getProduct(productId);
      if (data) {
        setProduct(data);
      } else {
        navigate('/products');
        toast({
          title: "Product not found",
          description: "The product you're looking for doesn't exist.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details. Please try again.",
        variant: "destructive"
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addToCart(product, quantity);
      setQuantity(1); // Reset quantity after adding
    } catch (error) {
      // Error handled in cart context
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryLabel = (category?: string) => {
    const categories: Record<string, string> = {
      'sanitary-pads': 'Sanitary Pads',
      'panty-liners': 'Panty Liners',
      'maternity-pads': 'Maternity Pads',
      'menstrual-cups': 'Menstrual Cups',
      'intimate-care': 'Intimate Care',
    };
    return categories[category || ''] || category;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="container py-8">
      <Seo 
        title={product.name} 
        description={product.description || `${product.name} - Premium feminine care product`}
      />
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary">Products</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square relative overflow-hidden rounded-lg border bg-muted">
            <img
              src={product.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EProduct Image%3C/text%3E%3C/svg%3E"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.stock_quantity === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
          
          {/* Thumbnail gallery - placeholder for future implementation */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-md border bg-muted opacity-50">
                <img
                  src={product.image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E"}
                  alt={`${product.name} view ${i}`}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">
              {getCategoryLabel(product.category)}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">(4.8/5 • 124 reviews)</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-primary mb-4">
              {formatPrice(product.price)}
            </div>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
              {product.stock_quantity > 0 ? 
                `${product.stock_quantity} units available` : 
                "Out of stock"
              }
            </Badge>
            {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Only {product.stock_quantity} left!
              </Badge>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Product Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Key Features - Static for demo */}
          <div>
            <h3 className="font-semibold mb-3">Key Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                100% medical grade materials
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Dermatologically tested and hypoallergenic
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Superior absorption technology
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Leak-proof protection for up to 12 hours
              </li>
            </ul>
          </div>

          <Separator />

          {/* Quantity Selector & Add to Cart */}
          {product.stock_quantity > 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium min-w-[3ch] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <SubscriptionButton
                  onClick={handleAddToCart}
                  feature="shopping cart"
                  className="w-full"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {cartLoading ? "Adding..." : `Add ${quantity} to Cart`}
                </SubscriptionButton>
                
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link to="/checkout">
                    Buy Now
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center space-y-2">
              <Truck className="h-6 w-6 mx-auto text-green-600" />
              <div className="text-xs">
                <div className="font-medium">Free Shipping</div>
                <div className="text-muted-foreground">On orders ₹500+</div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <RefreshCw className="h-6 w-6 mx-auto text-blue-600" />
              <div className="text-xs">
                <div className="font-medium">Easy Returns</div>
                <div className="text-muted-foreground">15-day return</div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <Shield className="h-6 w-6 mx-auto text-purple-600" />
              <div className="text-xs">
                <div className="font-medium">Secure Payment</div>
                <div className="text-muted-foreground">SSL encrypted</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-16 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Category:</span>
                <span className="ml-2 text-muted-foreground">{getCategoryLabel(product.category)}</span>
              </div>
              <div>
                <span className="font-medium">SKU:</span>
                <span className="ml-2 text-muted-foreground">{product.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <span className="font-medium">Availability:</span>
                <span className="ml-2 text-muted-foreground">
                  {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
              <div>
                <span className="font-medium">Added:</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;
