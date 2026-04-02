import { useCart } from '@/contexts/CartContext';
import { Truck } from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 5000;

export default function FreeShippingBar() {
  const { subtotal } = useCart();
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  if (subtotal <= 0) return null;

  return (
    <div className="bg-brand-surface border-b border-brand-border px-4 py-2" data-testid="free-shipping-bar">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Truck className="w-4 h-4 text-primary shrink-0" />
        {remaining > 0 ? (
          <p className="text-xs font-sans text-muted-foreground">
            Add <span className="text-primary font-medium">Rs {remaining.toLocaleString('en-IN')}</span> more for <span className="text-primary font-medium">FREE shipping!</span>
          </p>
        ) : (
          <p className="text-xs font-sans text-green-400 font-medium">You've unlocked FREE shipping!</p>
        )}
      </div>
      <div className="max-w-xs mx-auto mt-1">
        <div className="h-1 bg-brand-border rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
