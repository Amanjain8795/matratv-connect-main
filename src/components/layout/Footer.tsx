import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin, Shield, Truck, Users, Star, MessageCircle, Instagram, ExternalLink } from "lucide-react";
import "./footer-styles.css";

const Footer = () => {
  return (
    <footer className="footer-gradient text-white mt-8 relative overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-300 rounded-full translate-x-32 translate-y-32 blur-3xl"></div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-8 md:py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">

          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-4 footer-section">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                मातृत्व केयर
              </h3>
              <p className="text-base font-semibold text-purple-100">MATRATV CARE</p>
            </div>
            <p className="text-purple-200 text-sm leading-relaxed">
              Premium feminine hygiene products with 15 hours stain-free protection. 
              Trusted by thousands of women across India.
            </p>
            <div className="flex items-center gap-2 text-purple-100">
              <Heart className="h-4 w-4 text-pink-300 footer-icon" />
              <span className="text-sm font-medium">Trusted by 50,000+ women</span>
            </div>
          </div>

          {/* Connect With Us */}
          <div className="space-y-4 footer-section">
            <h4 className="text-base font-bold text-white">Connect With Us</h4>
            <nav className="space-y-3">
              <a 
                href="https://chat.whatsapp.com/JeyO4C7T5BtHcxVtUYme5q?mode=ac_t" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 text-purple-100 hover:text-white footer-link text-sm transition-all duration-300 hover:bg-green-500/10 rounded-lg px-3 py-2 group"
              >
                <div className="bg-green-500 rounded-full p-1.5 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-5 w-5 text-white fill-white" />
                </div>
                <span className="font-medium">Join WhatsApp Community</span>
                <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
              </a>
              <a 
                href="https://www.instagram.com/matratvcare?igsh=Ynp1MzQ4dHZ3dmcw" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 text-purple-100 hover:text-white footer-link text-sm transition-all duration-300 hover:bg-pink-500/10 rounded-lg px-3 py-2 group"
              >
                <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg p-1.5 group-hover:scale-110 transition-transform duration-300">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium">Follow on Instagram</span>
                <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
              </a>

              <div className="flex items-start gap-3">
                <div className="bg-green-500/20 rounded-full p-2 mt-0.5">
                  <MessageCircle className="h-4 w-4 text-green-300 footer-icon" />
                </div>
                <div>
                  <p className="text-xs text-purple-300 mb-1">WhatsApp</p>
                  <a 
                    href="https://wa.me/918303367209?text=Hello%20MATRATV%20CARE,%20I'm%20interested%20in%20your%20products" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-white text-sm font-medium contact-link hover:text-purple-100 transition-colors duration-200"
                  >
                    Chat with us
                  </a>
                </div>
              </div>
            </nav>

      
            
          </div>

          {/* Why Choose Us */}
          <div className="space-y-4 footer-section">
            <h4 className="text-base font-bold text-white">Why Choose Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 rounded-full p-2">
                  <Shield className="h-4 w-4 text-green-300 footer-icon" />
                </div>
                <span className="text-purple-200 text-sm font-medium">15 Hours Protection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 rounded-full p-2">
                  <Truck className="h-4 w-4 text-blue-300 footer-icon" />
                </div>
                <span className="text-purple-200 text-sm font-medium">Fast & Free Delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/20 rounded-full p-2">
                  <Users className="h-4 w-4 text-yellow-300 footer-icon" />
                </div>
                <span className="text-purple-200 text-sm font-medium">Referral Rewards Program</span>
              </div>
            </div>

            {/* Customer Service */}
 
          </div>

          {/* Contact Information */}
          <div className="space-y-4 footer-section">
            <h4 className="text-base font-bold text-white">Get In Touch</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 rounded-full p-2 mt-0.5">
                  <Mail className="h-4 w-4 text-purple-300 footer-icon" />
                </div>
                <div>
                  <p className="text-xs text-purple-300 mb-1">Email us</p>
                  <a 
                    href="mailto:Matratvcare@gmail.com" 
                    className="text-white text-sm font-medium contact-link hover:text-purple-100 transition-colors duration-200"
                  >
                    Matratvcare@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 rounded-full p-2 mt-0.5">
                  <Phone className="h-4 w-4 text-purple-300 footer-icon" />
                </div>
                <div>
                  <p className="text-xs text-purple-300 mb-1">Call us</p>
                  <a 
                    href="tel:+918303367209" 
                    className="text-white text-sm font-medium contact-link hover:text-purple-100 transition-colors duration-200"
                  >
                    +91 83033 67209
                  </a>
                </div>
              </div>
              
             
            </div>

            {/* Address */}
            <div className="pt-2">
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 rounded-full p-2 mt-0.5">
                  <MapPin className="h-4 w-4 text-purple-300 footer-icon" />
                </div>
                <div>
                  <p className="text-xs text-purple-300 mb-1">Visit us</p>
                  <p className="text-white text-sm font-medium">
                  Near TVS agency Chirgaon Jhansi, Uttar Pradesh pincode - 284301<br />
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      
    </footer>
  );
};

export default Footer;