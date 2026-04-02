import { Link } from 'react-router-dom';

export default function RecentlyViewed({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-12 border-t border-brand-border" data-testid="recently-viewed">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-light text-foreground mb-6">Recently Viewed</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {items.map(item => (
            <Link key={item.slug} to={`/products/${item.slug}`}
              className="shrink-0 w-36 group" data-testid={`recent-${item.slug}`}>
              <div className="aspect-[3/4] bg-brand-surface overflow-hidden">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
              </div>
              <p className="mt-2 text-xs font-sans text-muted-foreground truncate">{item.name}</p>
              <p className="text-xs font-sans text-primary">Rs {item.price?.toLocaleString('en-IN')}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
