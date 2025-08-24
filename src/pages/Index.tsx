import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Seo from "@/components/Seo";
import { Helmet } from "react-helmet-async";
import { ShoppingCart, Shield, Truck, Heart, Star, Users } from "lucide-react";
import Footer from "@/components/layout/Footer";

const Index = () => {
  const { t } = useTranslation();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MATRATV CARE',
    url: window.location.origin,
    logo: window.location.origin + '/favicon.ico',
    description: 'Premium feminine hygiene products with SAP gel technology for 15 hours stain-free protection',
  };

  // Your exact 2 MATRATV CARE products - no dummy data
  const featuredProducts = [
    {
      id: '1',
      name: 'MATRATV CARE - 1 Month Pack (6 Sanitary Pads)',
      description: '15 Hours Stain-Free Protection • Extra Long 280mm • SAP gel technology',
      price: 55,
      image: 'https://cdn.builder.io/api/v1/image/assets%2Fa1ebc5b67aec4d009962145ee3462ec2%2Fd920d98653d84a75a667603b0f9136f5?format=webp&width=800',
      features: ['SAP gel technology', 'Anti-bacterial green anion chip', 'Rash-free protection']
    },
    {
      id: '2',
      name: 'MATRATV CARE - 1 Year Pack (61 Sanitary Pads)',
      description: '15 Hours Stain-Free Protection • Extra Long 280mm • Complete Annual Protection',
      price: 900,
      image: 'https://cdn.builder.io/api/v1/image/assets%2Fa1ebc5b67aec4d009962145ee3462ec2%2Fb3f6eebc919045f9aa86d412a3b4e2c3?format=webp&width=800',
      features: ['Bulk savings', 'Stress-free days', 'High absorption']
    }
  ];

  return (
    <div>
      <Seo
        title="MATRATV CARE - Premium Feminine Hygiene Products"
        description="15 Hours Stain-Free Protection with SAP gel technology. Anti-bacterial sanitary pads for complete comfort and confidence."
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white">
        <div className="container grid md:grid-cols-2 gap-10 items-center py-20">
          <div className="space-y-8 animate-enter">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                Premium Feminine Care
              </Badge>
              <h1 className="font-display text-4xl md:text-6xl leading-tight">
                मातृत्व केयर
                <br />
                <span className="text-3xl md:text-4xl font-normal">MATRATV CARE</span>
              </h1>
            </div>
            <div className="space-y-4">
              <p className="text-xl text-purple-100">
                15 Hours Stain-Free Protection
              </p>
              <p className="text-lg text-purple-200">
                Premium sanitary pads with SAP gel technology and anti-bacterial green anion chip for complete comfort and confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button variant="secondary" size="lg" asChild className="bg-white text-purple-700 hover:bg-purple-50">
                <Link to="/products">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Shop Now
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="bg-white text-purple-700 hover:bg-purple-50">
                <Link to="/register">
                  <Users className="mr-2 h-5 w-5" />
                  Join & Earn
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="bg-white text-purple-700 hover:bg-purple-50">
                <Link to="/admin">
                  <Shield className="mr-2 h-5 w-5" />
                  Admin Login
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa1ebc5b67aec4d009962145ee3462ec2%2Fd920d98653d84a75a667603b0f9136f5?format=webp&width=400"
                  alt="MATRATV CARE 1 Month Pack"
                  className="w-full rounded-lg shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300"
                />
              </div>
              <div className="space-y-4 mt-8">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa1ebc5b67aec4d009962145ee3462ec2%2Fb3f6eebc919045f9aa86d412a3b4e2c3?format=webp&width=400"
                  alt="MATRATV CARE 1 Year Pack"
                  className="w-full rounded-lg shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Premium Products</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the difference with our scientifically designed sanitary pads featuring advanced SAP gel technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 p-4 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold leading-tight flex-1">{product.name}</CardTitle>
                    <Badge variant="default" className="text-base font-bold shrink-0">
                      ₹{product.price}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          <span className="text-xs">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild className="w-full h-9">
                      <Link to={`/products/${product.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose MATRATV CARE?</h2>
            <p className="text-lg text-muted-foreground">
              Trusted by thousands of women across India for premium protection and comfort
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">15 Hours Protection</h3>
              <p className="text-muted-foreground text-sm">
                Advanced SAP gel technology ensures stain-free protection for up to 15 hours
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Rash-Free Comfort</h3>
              <p className="text-muted-foreground text-sm">
                Anti-bacterial green anion chip prevents infections and ensures comfort
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Premium Quality</h3>
              <p className="text-muted-foreground text-sm">
                Extra long 280mm pads with high absorption technology
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Truck className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold">Fast Delivery</h3>
              <p className="text-muted-foreground text-sm">
                Discreet packaging with quick delivery across India
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-purple-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your Journey to Better Feminine Care
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and experience the confidence that comes with premium protection
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild className="bg-white text-purple-700 hover:bg-purple-50">
              <Link to="/products">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Shop Products
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="bg-white text-purple-700 hover:bg-purple-50">
              <Link to="/register">
                <Users className="mr-2 h-5 w-5" />
                Join & Earn Referrals
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
