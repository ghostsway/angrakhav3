import { ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';

export default function TrustBadges({ compact = false }) {
  const badges = [
    { icon: ShieldCheck, label: 'Secure Checkout', sub: '256-bit SSL' },
    { icon: Truck, label: 'Free Shipping', sub: 'Orders above Rs 5,000' },
    { icon: RotateCcw, label: 'Easy Returns', sub: '14-day return policy' },
    { icon: Lock, label: 'Safe Payments', sub: 'UPI, Cards, Net Banking' },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-3 justify-center" data-testid="trust-badges-compact">
        {badges.map(b => (
          <div key={b.label} className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
            <b.icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="trust-badges">
      {badges.map(b => (
        <div key={b.label} className="flex flex-col items-center text-center p-4 bg-brand-surface border border-brand-border">
          <b.icon className="w-6 h-6 text-primary mb-2" strokeWidth={1.5} />
          <p className="text-xs font-sans font-medium text-foreground mb-0.5">{b.label}</p>
          <p className="text-[10px] font-sans text-muted-foreground">{b.sub}</p>
        </div>
      ))}
    </div>
  );
}
