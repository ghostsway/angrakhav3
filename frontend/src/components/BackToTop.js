import { useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = useState(false);

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setShow(window.scrollY > 400);
    }, { passive: true });
  }

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all"
      data-testid="back-to-top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
