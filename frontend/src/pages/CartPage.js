import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const { cart, updateItem, removeItem, itemCount, subtotal } = useCart();
  const items = cart.items || [];
  const tax = Math.round(subtotal * 0.18);
  const shipping = subtotal >= 5000 ? 0 : 500;
  const total = subtotal + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center" data-testid="cart-empty">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
        <h1 className="font-serif text-3xl font-light text-foreground mb-3">Your cart is empty</h1>
        <p className="text-sm font-sans text-muted-foreground mb-8">Discover something extraordinary from our collections.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="bg-primary text-primary-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all" data-testid="cart-empty-home">Home</Link>
          <Link to="/collections" className="border border-primary text-primary px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all" data-testid="cart-empty-collections">Collections</Link>
          <Link to="/#occasion" className="border border-brand-border text-foreground px-6 py-3 text-xs font-sans uppercase tracking-[0.2em] hover:border-primary transition-all">Shop by Occasion</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 lg:py-20" data-testid="cart-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-10" data-testid="cart-title">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map(item => (
              <div key={item.item_id} className="flex gap-4 sm:gap-6 border-b border-brand-border pb-6" data-testid={`cart-item-${item.item_id}`}>
                <Link to={`/products/${item.product_slug}`} className="w-20 sm:w-24 aspect-[3/4] bg-brand-surface shrink-0 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product_slug}`} className="font-serif text-lg text-foreground hover:text-primary transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  <p className="text-xs font-sans text-muted-foreground mt-1">Size: {item.size}</p>
                  <p className="text-sm font-sans text-primary mt-1">Rs {item.price?.toLocaleString('en-IN')}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-brand-border">
                      <button onClick={() => updateItem(item.item_id, Math.max(1, item.quantity - 1))} className={`p-1.5 transition-colors ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-surface'}`} disabled={item.quantity <= 1} data-testid={`cart-minus-${item.item_id}`}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-sans">{item.quantity}</span>
                      <button onClick={() => updateItem(item.item_id, item.quantity + 1)} className="p-1.5 hover:bg-brand-surface transition-colors" data-testid={`cart-plus-${item.item_id}`}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.item_id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`cart-remove-${item.item_id}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-brand-surface border border-brand-border p-6 sticky top-28" data-testid="cart-summary">
              <h2 className="font-serif text-xl font-light text-foreground mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span className="text-foreground">Rs {subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="text-foreground">Rs {tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">{shipping === 0 ? 'Free' : `Rs ${shipping}`}</span>
                </div>
                {shipping > 0 && <p className="text-xs text-primary">Free shipping on orders above Rs 5,000</p>}
                <div className="border-t border-brand-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="font-serif text-lg text-primary">Rs {total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <Link to="/checkout"
                className="mt-6 w-full flex items-center justify-center bg-primary text-primary-foreground px-6 py-4 text-xs font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-all"
                data-testid="checkout-btn">
                Proceed to Checkout
              </Link>
              <Link to="/collections"
                className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-sans text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em] py-2"
                data-testid="continue-shopping-btn">
                <ArrowLeft className="w-3 h-3" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
