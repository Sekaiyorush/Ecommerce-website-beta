import { Link } from 'react-router-dom';
import { useDatabase } from '@/context/DatabaseContext';

export function Footer() {
  const { db } = useDatabase();
  const { companyName } = db.siteSettings;
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Products', to: '/products' },
    { label: 'About', to: '/about' },
    { label: 'Research', to: '/research' },
    { label: 'Contact', to: '/contact' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Terms', to: '/terms' },
    { label: 'Privacy', to: '/privacy' },
    { label: 'Shipping', to: '/shipping' },
  ];

  return (
    <footer className="relative z-20 text-center py-24 px-6 bg-background border-t border-[#D4AF37]/5 shrink-0">
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Subtle gold line accent */}
        <div className="w-[1px] h-16 bg-gradient-to-b from-[#D4AF37]/30 to-transparent" />

        <nav aria-label="Footer Navigation" className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-[9px] font-bold tracking-[0.3em] uppercase text-muted-foreground hover:text-[#D4AF37] transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-[10px] font-bold tracking-[0.3em] text-[#D4AF37]/80 uppercase">
          © {currentYear} {companyName}
        </p>

        <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase max-w-md leading-relaxed mx-auto">
          Premium research peptides for scientific exploration. Validated purity, consistent quality. For Research Purposes Only.
        </p>
      </div>
    </footer>
  );
}
