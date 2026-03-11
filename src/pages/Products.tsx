import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDatabase } from '@/context/DatabaseContext';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { Search, Filter, ChevronDown, Lock, Tag, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function Products() {
  const { db, isLoading } = useDatabase();
  const products = db.products;
  const { isPartner, user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(queryParam);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [debouncedSearchTerm, selectedCategory, sortBy, products]);

  return (
    <div className="min-h-screen bg-background py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.03)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_transparent_60%)]" />
      <SEO
        title="Research Catalog | Golden Tier"
        description="Browse our complete catalog of premium research peptides and laboratory compounds. Supreme purity guaranteed."
      />
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <Breadcrumbs />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-4 mt-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-gold-gradient">Research Catalog</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold-primary mt-3">Curated selection of premium peptides</p>
          </div>
          {isPartner && (
            <div className="mt-3 inline-flex items-center space-x-2 px-6 py-3 border border-[#D4AF37]/30 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 text-gold-primary text-[10px] font-bold tracking-[0.2em] uppercase">
              <span>Partner Privileges:</span>
              <span className="text-gold-500">{user?.discountRate}% Discount Active</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-card/80 backdrop-blur-md border border-[#D4AF37]/20 p-8 mb-12 shadow-[0_8px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.2)] relative">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
              <input
                type="text"
                placeholder="SEARCH COMPOUNDS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 h-12 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-[10px] font-bold tracking-[0.2em] uppercase transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/50" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-12 pr-10 h-12 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground appearance-none transition-all cursor-pointer min-w-[160px]"
                >
                  <option value="all">ALL CATEGORIES</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]" pointerEvents="none" />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-6 pr-10 h-12 bg-transparent border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-0 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground appearance-none transition-all cursor-pointer min-w-[160px]"
                >
                  <option value="name">SORT A-Z</option>
                  <option value="price-low">PRICE: LOW TO HIGH</option>
                  <option value="price-high">PRICE: HIGH TO LOW</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]" pointerEvents="none" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#D4AF37]/10 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
              SHOWING <span className="text-gold-500">{filteredProducts.length}</span> PRODUCTS
            </span>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold-primary hover:text-gold-500 transition-colors"
              >
                CLEAR FILTERS ×
              </button>
            )}
          </div>
        </div>

        {/* Non-partner upgrade banner */}
        {!isPartner && (
          <div className="mb-10 relative overflow-hidden border border-[#D4AF37]/30 bg-gradient-to-r from-[#111] to-[#1a1a1a]">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-[150%] animate-[shimmer_4s_infinite]" />
            {/* Gold left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#AA771C] to-[#D4AF37]" />

            <div className="pl-8 pr-6 py-6 flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Lock badge */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 border border-[#D4AF37]/30 bg-[#D4AF37]/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]">Partner Exclusive</p>
                  <p className="text-[10px] tracking-[0.15em] text-slate-400 uppercase mt-0.5">Pricing & purchasing locked</p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-[1px] self-stretch bg-[#D4AF37]/15" />

              {/* Benefits */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-[#D4AF37]/70 shrink-0" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300">Exclusive Partner Pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-[#D4AF37]/70 shrink-0" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300">Priority Order Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]/70 shrink-0" />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-300">Verified Research Access</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                to="/contact"
                className="shrink-0 relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#AA771C] to-[#D4AF37] text-white text-[10px] font-bold tracking-[0.25em] uppercase overflow-hidden group/cta transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                <span className="relative z-10">Request Partner Access</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-white/40 transition-all duration-500 ease-out group-hover/cta:w-full" />
              </Link>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card border border-[#D4AF37]/20 relative">
            <div className="w-16 h-16 bg-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-6">
              <Search className="h-6 w-6 text-gold-primary" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-3 tracking-tight">No products found</h3>
            <p className="text-sm text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed uppercase tracking-widest">
              We couldn't find any products matching your search. Try adjusting your filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setDebouncedSearchTerm('');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center justify-center px-8 py-3 bg-[#111] dark:bg-gold-500 text-white dark:text-slate-900 text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-black dark:hover:bg-gold-400 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent -translate-x-[150%] animate-[shimmer_3s_infinite]" />
              <span className="relative z-10">Clear Filters</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] dark:from-slate-900 dark:to-slate-800 transition-all duration-500 ease-out group-hover:w-full" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
