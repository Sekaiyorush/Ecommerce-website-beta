import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { Search } from 'lucide-react';

export function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [text, setText] = useState(searchParams.get('q') || '');
  const [query] = useDebounce(text, 500);

  useEffect(() => {
    if (query) {
      navigate(`/products?q=${encodeURIComponent(query)}`);
    } else if (location.pathname === '/products' && searchParams.get('q')) {
      navigate('/products');
    }
  }, [query, navigate, location.pathname, searchParams]);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-muted-foreground" />
      </div>
      <input
        type="search"
        aria-label="Search products"
        className="block w-full py-2.5 pl-10 pr-4 text-[10px] font-bold tracking-[0.2em] uppercase text-foreground bg-transparent border-b border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 focus:outline-none transition-all placeholder:text-muted-foreground/50"
        placeholder="SEARCH COMPOUNDS..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
