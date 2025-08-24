import { CheckCircle, Package, Truck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface OrderSuccessProps {
  orderReference: string;
  amount: number;
  customerName: string;
  estimatedDelivery?: string;
}

export default function OrderSuccess({
  orderReference,
  amount,
  customerName,
  estimatedDelivery = "3-5 business days"
}: OrderSuccessProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-green-800">
              Order Placed Successfully! 🎉
            </h1>
            <p className="text-green-700">
              Thank you {customerName}! Your order has been placed and payment notification sent.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg p-6 space-y-4 border border-green-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Order ID:</span>
                <p className="font-semibold">#{orderReference}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Amount Paid:</span>
                <p className="font-semibold text-green-600">{formatAmount(amount)}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                <Clock className="h-3 w-3 mr-1" />
                Payment Verification Pending
              </Badge>
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">What happens next?</h3>
            
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div className="text-left">
                  <p className="font-medium">Payment Verification</p>
                  <p className="text-muted-foreground">Our admin will verify your UPI payment within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <div className="text-left">
                  <p className="font-medium">Order Processing</p>
                  <p className="text-muted-foreground">Your order will be processed and prepared for shipping</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <div className="text-left">
                  <p className="font-medium">Shipping & Delivery</p>
                  <p className="text-muted-foreground">
                    <Truck className="h-4 w-4 inline mr-1" />
                    Estimated delivery: {estimatedDelivery}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/profile">
                <Package className="mr-2 h-4 w-4" />
                Track Your Orders
              </Link>
            </Button>
            <Button asChild>
              <Link to="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Support Note */}
          <div className="text-xs text-muted-foreground p-4 bg-gray-50 rounded-lg">
            <p>
              <strong>Need help?</strong> Contact our support team if you have any questions about your order.
              We're here to help! 📞
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
