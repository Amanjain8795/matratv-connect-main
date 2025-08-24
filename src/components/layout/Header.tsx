import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu, ShoppingCart, User, LogOut, Home, Package, Gift, Crown, AlertCircle } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "@/context/NewAuthContext";
import { useCart } from "@/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { user, profile, signOut, hasActiveSubscription, subscriptionLoading } = useAuth();
  const isAuthenticated = !!user;
  const { items, totalItems } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    console.log('🚪 Logout button clicked');
    try {
      await signOut();
      setMobileMenuOpen(false);
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-primary">
            {t("brand.name")}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <NavLink 
              to="/"
              className={({ isActive }) => 
                isActive ? "bg-accent text-accent-foreground" : ""
              }
            >
              <Home className="h-4 w-4 mr-2" />
              {t("nav.home")}
            </NavLink>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <NavLink 
              to="/products"
              className={({ isActive }) => 
                isActive ? "bg-accent text-accent-foreground" : ""
              }
            >
              <Package className="h-4 w-4 mr-2" />
              {t("nav.products")}
            </NavLink>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <NavLink
              to="/rewards"
              className={({ isActive }) =>
                isActive ? "bg-accent text-accent-foreground" : ""
              }
            >
              <Gift className="h-4 w-4 mr-2" />
              Rewards
            </NavLink>
          </Button>
          {isAuthenticated && (
            <Button variant="ghost" size="sm" asChild>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? "bg-accent text-accent-foreground" : ""
                }
              >
                <User className="h-4 w-4 mr-2" />
                {t("nav.profile")}
              </NavLink>
            </Button>
          )}
          {/* Admin link - visible for admin users */}
          {isAuthenticated && user?.email === 'aman.csc.99188@gmail.com' && (
            <Button variant="ghost" size="sm" asChild>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive ? "bg-accent text-accent-foreground" : ""
                }
              >
                <User className="h-4 w-4 mr-2" />
                Admin
              </NavLink>
            </Button>
          )}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          {/* Cart Drawer */}
          <CartDrawer />

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {!subscriptionLoading && (
                  <>
                    {hasActiveSubscription ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    ) : (
                      <Button variant="default" size="sm" asChild>
                        <Link to="/subscription">
                          <Crown className="h-4 w-4 mr-2" />
                          Get Premium
                        </Link>
                      </Button>
                    )}
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("auth.logout")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <span className="font-display text-xl font-bold text-primary">
                    {t("brand.name")}
                  </span>
                </div>

                <nav className="flex flex-col gap-2">
                  <Button variant="ghost" className="justify-start" asChild onClick={closeMobileMenu}>
                    <Link to="/">
                      <Home className="h-4 w-4 mr-3" />
                      {t("nav.home")}
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild onClick={closeMobileMenu}>
                    <Link to="/products">
                      <Package className="h-4 w-4 mr-3" />
                      {t("nav.products")}
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild onClick={closeMobileMenu}>
                    <Link to="/rewards">
                      <Gift className="h-4 w-4 mr-3" />
                      Rewards
                    </Link>
                  </Button>

                  {isAuthenticated && (
                    <Button variant="ghost" className="justify-start" asChild onClick={closeMobileMenu}>
                      <Link to="/profile">
                        <User className="h-4 w-4 mr-3" />
                        {t("nav.profile")}
                      </Link>
                    </Button>
                  )}

                  {/* Admin link - visible for admin users */}
                  {isAuthenticated && user?.email === 'aman.csc.99188@gmail.com' && (
                    <Button variant="ghost" className="justify-start" asChild onClick={closeMobileMenu}>
                      <Link to="/admin">
                        <User className="h-4 w-4 mr-3" />
                        Admin Panel
                      </Link>
                    </Button>
                  )}
                </nav>

                <Separator className="my-6" />

                {/* User Info & Auth */}
                <div className="space-y-4">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm font-medium">
                          Welcome back!
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.full_name || "User"}
                        </p>
                        {!subscriptionLoading && (
                          <div className="flex items-center gap-1 mt-2">
                            {hasActiveSubscription ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No Subscription
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {!subscriptionLoading && !hasActiveSubscription && (
                        <Button variant="default" className="w-full justify-start" asChild onClick={closeMobileMenu}>
                          <Link to="/subscription">
                            <Crown className="h-4 w-4 mr-3" />
                            Get Premium
                          </Link>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        {t("auth.logout")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start" 
                        asChild 
                        onClick={closeMobileMenu}
                      >
                        <Link to="/login">{t("nav.login")}</Link>
                      </Button>
                      <Button 
                        variant="default" 
                        className="w-full" 
                        asChild 
                        onClick={closeMobileMenu}
                      >
                        <Link to="/register">{t("nav.register")}</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Cart Summary in Mobile */}
                {totalItems > 0 && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-3">
                      <h4 className="font-medium">Cart Summary</h4>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm">
                          {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
                        </p>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          navigate("/checkout");
                          closeMobileMenu();
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Go to Checkout
                      </Button>
                    </div>
                  </>
                )}

                {/* CTA */}
                <div className="mt-auto pt-6">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    asChild 
                    onClick={closeMobileMenu}
                  >
                    <Link to="/products">
                      <Package className="h-4 w-4 mr-2" />
                      {t("hero.ctaShop")}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
