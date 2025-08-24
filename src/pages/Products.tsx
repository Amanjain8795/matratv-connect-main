import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";
import { Search, ShoppingCart, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { getProducts, testSupabaseConnection, type Product } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { toast } from "@/components/ui/use-toast";
import "@/components/ui/product-card.css";

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'sanitary-pads', label: 'Sanitary Pads' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
  { value: 'created_at_desc', label: 'Newest First' },
];

const ITEMS_PER_PAGE = 12;

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const { addToCart, updateQuantity, isInCart, getItemQuantity, loading: cartLoading } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🛒 Fetching products...');

      const data = await getProducts();
      console.log('📦 Products fetched:', data?.length || 0);
      setProducts(data || []);

      if (!data || data.length === 0) {
        console.warn('⚠️ No products returned');
      }
    } catch (error: any) {
      console.error('❌ Error fetching products:', error);
      let errorMessage = 'Failed to load products. Please try again.';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.details) {
        errorMessage = error.details;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Set empty array so UI shows "no products" instead of loading forever
      setProducts([]);
    } finally {
      setLoading(false);
      console.log('✅ Products loading completed');
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search)
      );
    }

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'created_at_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [products, selectedCategory, searchTerm, sortBy]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    try {
      await addToCart(product, quantity);
    } catch (error) {
      // Error handled in cart context
    }
  };

  const handleQuantityIncrease = async (product: Product) => {
    if (isInCart(product.id)) {
      const currentQuantity = getItemQuantity(product.id);
      await updateQuantity(product.id, currentQuantity + 1);
    } else {
      await handleAddToCart(product, 1);
    }
  };

  const handleQuantityDecrease = async (product: Product) => {
    const currentQuantity = getItemQuantity(product.id);
    if (currentQuantity > 0) {
      await updateQuantity(product.id, currentQuantity - 1);
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
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  return (
    <div className="container py-4 md:py-6 max-w-7xl">
      <Seo
        title={t("nav.products")}
        description="Browse our premium collection of sanitary pads and feminine hygiene products"
      />

      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-3">
          <h1 className="text-xl md:text-3xl font-bold">MATRATV CARE Products</h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto px-4">
            Premium feminine hygiene products with 15 hours stain-free protection
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-lg border p-3 md:p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h2 className="text-sm md:text-base font-semibold">Filter & Search</h2>
          </div>

          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Showing {paginatedProducts.length} of {filteredAndSortedProducts.length} products
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </p>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-0">
                  <Skeleton className="h-40 md:h-48 w-full" />
                </CardHeader>
                <CardContent className="p-3 md:p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
                <CardFooter className="p-3 md:p-4 pt-0">
                  <Skeleton className="h-9 md:h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-4">
              <div className="text-6xl">🔍</div>
              <h3 className="text-2xl font-semibold">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSortBy("created_at_desc");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
              {paginatedProducts.map((product) => (
                <Card key={product.id} className="product-card group overflow-hidden max-w-sm mx-auto bg-white">
                  <CardHeader className="p-0">
                    <div className="product-image-container aspect-[4/3] relative overflow-hidden rounded-t-lg">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain p-3"
                          loading="lazy"
                          onError={(e) => {
                            console.error('Image failed to load:', product.image_url);
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                          onLoad={(e) => {
                            console.log('Image loaded successfully:', product.image_url);
                          }}
                        />
                      ) : null}
                      <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                        <div className="text-center">
                          <div className="text-3xl mb-2">📦</div>
                          <div className="text-xs">No Image</div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs shadow-sm bg-white/90 backdrop-blur-sm">
                          {getCategoryLabel(product.category)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 space-y-2">
                    <CardTitle className="text-base font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
                      <Link
                        to={`/products/${product.id}`}
                        className="hover:text-primary transition-colors text-gray-900"
                      >
                        {product.name}
                      </Link>
                    </CardTitle>

                    <CardDescription className="text-xs text-gray-600 line-clamp-2 min-h-[2rem]">
                      {product.description}
                    </CardDescription>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      <Badge
                        variant={product.stock_quantity > 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="p-3 pt-0 space-y-2">
                    {isInCart(product.id) ? (
                      <div className="flex items-center justify-between w-full gap-2">
                        <QuantitySelector
                          quantity={getItemQuantity(product.id)}
                          onIncrease={() => handleQuantityIncrease(product)}
                          onDecrease={() => handleQuantityDecrease(product)}
                          disabled={cartLoading || product.stock_quantity === 0}
                          max={product.stock_quantity}
                          size="sm"
                          className="flex-1"
                        />
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Link to={`/products/${product.id}`}>
                            Details
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock_quantity === 0 || cartLoading}
                          className="w-full h-9 text-sm font-medium"
                          variant={product.stock_quantity === 0 ? "secondary" : "default"}
                        >
                          <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          {product.stock_quantity === 0 ? "Out of Stock" : t("cart.add")}
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          className="w-full text-xs md:text-sm h-8 md:h-9"
                        >
                          <Link to={`/products/${product.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    const isVisible =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2);

                    if (!isVisible) {
                      if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Trust Indicators */}
        <div className="bg-card rounded-lg border p-6 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl">🛡️</div>
              <h3 className="font-semibold">100% Safe</h3>
              <p className="text-sm text-muted-foreground">
                Medical grade materials and rigorous quality testing
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🚚</div>
              <h3 className="font-semibold">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Discreet packaging with quick delivery across India
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">💎</div>
              <h3 className="font-semibold">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">
                Carefully curated products for your comfort and confidence
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
