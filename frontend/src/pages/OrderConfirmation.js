import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Package, MapPin, CreditCard, Mail, Phone } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API}/api/orders/by-number/${orderNumber}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">Order Not Found</h1>
          <Link to="/" className="text-primary hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-2">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground mb-4">
            Your order is confirmed and will be delivered soon. We'll notify you via email.
          </p>
          <div className="inline-block bg-brand-surface border border-brand-border px-6 py-3 rounded">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Order Number</p>
            <p className="font-mono text-xl text-primary">{order.order_number}</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Order Items */}
          <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="font-sans text-lg font-medium text-foreground">Order Items</h2>
            </div>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b border-brand-border last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-sans text-sm font-medium text-foreground mb-1">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Size: {item.size} | Qty: {item.quantity}
                    </p>
                    <p className="text-sm text-foreground font-medium">₹{item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-brand-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span className="text-foreground">₹{order.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">₹{order.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-medium pt-2 border-t border-brand-border">
                <span className="text-foreground">Total</span>
                <span className="text-primary">₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-block bg-brand-surface border border-brand-border px-8 py-3 text-center text-sm font-sans uppercase tracking-wider text-foreground hover:bg-brand-border transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to="/collections"
            className="inline-block bg-primary border border-primary px-8 py-3 text-center text-sm font-sans uppercase tracking-wider text-white hover:bg-primary/90 transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      </div>
    </div>
  );
}
