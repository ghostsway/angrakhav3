import { useState, useEffect } from 'react';

const STORAGE_KEY = 'recently_viewed';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const addItem = (product) => {
    setItems(prev => {
      const filtered = prev.filter(p => p.slug !== product.slug);
      const updated = [{ slug: product.slug, name: product.name, price: product.price, image: (product.images || [])[0] || '', category: product.category }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { items, addItem };
}
