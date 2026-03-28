import { useState, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { SearchBar } from './SearchBar';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, Globe, Sun, Moon } from 'lucide-react';

function HeaderInner() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isUserMenuOpen]);
  const { toggleCart, cartCount } = useCart();
  const { language, toggleLanguage } = useLanguage();
  const { isAuthenticated, isAdmin, isPartner, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isPartner) return '/partner';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (isAdmin) return 'Admin Dashboard';
    if (isPartner) return 'Partner Dashboard';
    return 'My Account';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-md border-b border-[#D4AF37]/10 transition-all duration-300">
      <div className="container mx-auto flex h-24 items-center justify-between px-6 md:px-12">
        {/* Logo */}
        <Link to="/" className="flex items-center group relative">
          <div className="absolute inset-0 bg-gold-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <img
            src="/brand-logo-gold.png"
            alt="Golden Tier Logo"
            className="h-20 w-auto object-contain drop-shadow-sm group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-700 transform group-hover:scale-105 relative z-10"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center space-x-12">
          {['Products', 'About', 'Research', 'Contact'].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="relative text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground hover:text-[#D4AF37] transition-all duration-500 group"
            >
              <span>{item}</span>
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="hidden xl:flex flex-1 max-w-xs mx-12">
          <SearchBar />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-6">
          <button
            onClick={toggleLanguage}
            aria-label="Switch language"
            className="hidden sm:flex items-center space-x-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground hover:text-gold-500 transition-colors duration-500 uppercase"
            title="Switch language"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{language}</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-muted-foreground hover:text-[#D4AF37] transition-colors duration-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isPartner && (
            <button
              onClick={toggleCart}
              aria-label={`Shopping cart with ${cartCount} items`}
              className="relative p-2.5 text-muted-foreground hover:text-gold-500 transition-all duration-300 hover:scale-110"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center bg-[#D4AF37] text-[9px] font-bold text-white shadow-lg shadow-[#D4AF37]/30 rounded-full animate-reveal">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  aria-label="User account menu"
                  aria-expanded={isUserMenuOpen}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-1.5 border border-[#D4AF37]/20 hover:border-[#D4AF37] rounded-full transition-all duration-700 group bg-surface"
                >
                  <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center border border-[#D4AF37]/10 shadow-sm transition-colors group-hover:border-[#D4AF37]/40">
                    <User className="h-4 w-4 text-[#AA771C] group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-elevated border border-[#D4AF37]/10 p-2 shadow-2xl animate-reveal overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-gradient" />
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center space-x-3 px-4 py-4 text-[10px] font-bold tracking-widest text-muted-foreground hover:text-[#D4AF37] hover:bg-muted transition-all uppercase"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 opacity-70" />
                      <span>{getDashboardLabel()}</span>
                    </Link>
                    <div className="h-[1px] bg-muted mx-2" />
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-4 text-[10px] font-bold tracking-widest text-foreground hover:text-[#D4AF37] hover:bg-muted transition-all uppercase group relative"
                    >
                      <LogOut className="h-4 w-4 opacity-70" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-flex btn-premium h-12 items-center px-10 text-[10px]"
            >
              SIGN IN
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          aria-label="Toggle mobile menu"
          aria-expanded={isMenuOpen}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[#D4AF37]/20 bg-background absolute w-full shadow-2xl">
          <div className="p-6 border-b border-[#D4AF37]/10">
            <SearchBar />
          </div>
          <nav aria-label="Mobile Navigation" className="flex flex-col py-4">
            <Link
              to="/products"
              className="px-6 py-4 text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground hover:text-[#D4AF37] hover:bg-muted transition-colors border-b border-[#D4AF37]/5"
              onClick={() => setIsMenuOpen(false)}
            >
              Catalog
            </Link>
            <Link
              to="/about"
              className="px-6 py-4 text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground hover:text-[#D4AF37] hover:bg-muted transition-colors border-b border-[#D4AF37]/5"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/research"
              className="px-6 py-4 text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground hover:text-[#D4AF37] hover:bg-muted transition-colors border-b border-[#D4AF37]/5"
              onClick={() => setIsMenuOpen(false)}
            >
              Research
            </Link>
            <Link
              to="/contact"
              className="px-6 py-4 text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground hover:text-[#D4AF37] hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>

            {isAuthenticated ? (
              <>
                <div className="mx-6 my-4 border-t border-[#D4AF37]/20" />
                <Link
                  to={getDashboardLink()}
                  className="px-6 py-4 text-[10px] font-bold tracking-[0.3em] uppercase text-[#AA771C] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {getDashboardLabel()}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.3em] uppercase text-foreground border-t border-[#D4AF37]/5"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="p-6">
                <Link
                  to="/login"
                  className="block w-full py-4 bg-[#111] dark:bg-gold-500 text-white dark:text-foreground text-center text-[10px] font-bold tracking-[0.3em] uppercase"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
export const Header = memo(HeaderInner);
