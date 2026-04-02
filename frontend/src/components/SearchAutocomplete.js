import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, TrendingUp, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SearchAutocomplete({ onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/search/popular`).then(r => setPopular(r.data.popular || [])).catch(() => {});
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      axios.get(`${API}/search/autocomplete?q=${encodeURIComponent(query)}`)
        .then(r => setSuggestions(r.data.suggestions || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      onClose?.();
    }
  };

  return (
    <div className="w-full" data-testid="search-autocomplete">
      <form onSubmit={handleSubmit} className="flex items-center bg-brand-surface border border-brand-border">
        <Search className="w-5 h-5 text-muted-foreground ml-4" />
        <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search for sherwanis, kurtas, bandhgalas..."
          className="flex-1 bg-transparent px-4 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
          data-testid="autocomplete-input" />
      </form>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="mt-1 bg-brand-surface border border-brand-border divide-y divide-brand-border" data-testid="autocomplete-results">
          {suggestions.map(s => (
            <Link key={s.slug} to={`/products/${s.slug}`} onClick={() => onClose?.()}
              className="flex items-center gap-3 p-3 hover:bg-brand-bg transition-colors">
              <div className="w-10 h-12 bg-brand-bg shrink-0 overflow-hidden">
                {s.image && <img src={s.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans text-foreground truncate">{s.name}</p>
                <p className="text-xs font-sans text-muted-foreground">{s.category?.replace('_', ' ')}</p>
              </div>
              <span className="text-sm font-sans text-primary">Rs {s.price?.toLocaleString('en-IN')}</span>
            </Link>
          ))}
          <button onClick={handleSubmit} className="w-full p-3 text-xs font-sans text-primary hover:bg-brand-bg transition-colors text-center uppercase tracking-wider">
            View all results for "{query}"
          </button>
        </div>
      )}

      {/* Popular searches when no query */}
      {!query && popular.length > 0 && (
        <div className="mt-3" data-testid="popular-searches">
          <p className="text-xs font-sans uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Popular Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {popular.map(p => (
              <Link key={p.term} to={p.slug} onClick={() => onClose?.()}
                className="px-3 py-1.5 border border-brand-border text-xs font-sans text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                {p.term}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
