import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDatabase } from '@/context/DatabaseContext';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function FeaturedProducts() {
  const { isPartner, user } = useAuth();
  const { db, isLoading } = useDatabase();

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Parallax effects
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "150%"]);

  const featuredProducts = db.products.slice(0, 3);

  return (
    <section ref={sectionRef} className="py-32 md:py-48 relative overflow-hidden bg-white">
      {/* Luxury Background Hint - Scroll Linked Parallax */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.02)_0%,_rgba(255,255,255,1)_70%)]"
      />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          style={{ y: textY }}
          className="flex flex-col items-center text-center mb-24"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-[1px] w-8 bg-[#D4AF37]" />
            <span className="text-[10px] font-bold text-[#AA771C] uppercase tracking-[0.4em]">Elite Selection</span>
            <div className="h-[1px] w-8 bg-[#D4AF37]" />
          </div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight text-gold-gradient mb-8 pb-2">
            Signature Compounds
          </h2>
          <p className="max-w-2xl text-slate-400 text-sm md:text-base leading-relaxed tracking-[0.1em] uppercase font-light">
            Our most requested formulations for advanced analytical study. <br className="hidden md:block" /> Absolute purity. Unrivaled precision.
          </p>
          {isPartner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="mt-10 px-8 py-3 border border-gold-300/30 bg-gold-500/5 text-[#AA771C] text-[10px] font-bold tracking-[0.3em] uppercase rounded-full"
            >
              Partner Privileges Active — {user?.discountRate}% Discount
            </motion.div>
          )}
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gold-300/10 h-[600px] animate-pulse rounded-sm" />
            ))
          ) : featuredProducts.length === 0 ? (
            <div className="col-span-3 text-center py-24 border border-dashed border-gold-300/30">
              <p className="text-slate-400 font-serif text-xl italic tracking-wide">New formulations pending validation...</p>
            </div>
          ) : (
            featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))
          )}
        </div>

        <div className="flex justify-center mt-20">
          <Link
            to="/products"
            aria-label="View full product catalog"
            className="group flex items-center justify-center space-x-3 px-10 py-5 border border-[#D4AF37]/30 text-slate-900 transition-all duration-500 hover:border-[#D4AF37] hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)] bg-white relative overflow-hidden focus:ring-2 focus:ring-[#D4AF37] outline-none"
          >
            <span className="relative z-10 text-[10px] font-bold tracking-[0.3em] uppercase">VIEW FULL CATALOG</span>
            <ArrowRight className="relative z-10 h-4 w-4 text-[#D4AF37] group-hover:translate-x-2 transition-transform duration-300" aria-hidden="true" />
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-all duration-500 ease-out group-hover:w-full" />
          </Link>
        </div>
      </div>
    </section>
  );
}
