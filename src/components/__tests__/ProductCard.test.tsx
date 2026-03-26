import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '../ProductCard';

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isPartner: true,
    user: { discountRate: 0 },
  }),
}));

// Mock ProductRating to avoid needing the full review stats chain
vi.mock('@/components/reviews/ProductRating', () => ({
  ProductRating: () => <div data-testid="product-rating" />,
}));

// Mock framer-motion to render plain divs
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      // Filter out framer-motion specific props
      const { initial, whileInView, viewport, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
}));

const baseProduct = {
  id: 'prod-1',
  sku: 'BPC-157-5MG',
  name: 'BPC-157',
  description: 'A research peptide for lab use.',
  price: 1500,
  category: 'Peptides',
  purity: '99%',
  stockQuantity: 50,
  lowStockThreshold: 10,
  imageUrl: '',
  isNew: false,
  benefits: [],
  dosage: '5mg',
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ProductCard', () => {
  it('renders the product name', () => {
    renderWithRouter(<ProductCard product={baseProduct as any} />);
    expect(screen.getByText('BPC-157')).toBeInTheDocument();
  });

  it('renders the product category', () => {
    renderWithRouter(<ProductCard product={baseProduct as any} />);
    expect(screen.getByText('Peptides')).toBeInTheDocument();
  });

  it('renders the product description', () => {
    renderWithRouter(<ProductCard product={baseProduct as any} />);
    expect(screen.getByText('A research peptide for lab use.')).toBeInTheDocument();
  });

  it('shows IN STOCK for products with stock', () => {
    renderWithRouter(<ProductCard product={baseProduct as any} />);
    expect(screen.getByText('IN STOCK')).toBeInTheDocument();
  });

  it('shows OUT OF STOCK when stockQuantity is 0', () => {
    const outOfStock = { ...baseProduct, stockQuantity: 0 };
    renderWithRouter(<ProductCard product={outOfStock as any} />);
    expect(screen.getByText('OUT OF STOCK')).toBeInTheDocument();
  });

  it('shows LOW STOCK when stock is below threshold', () => {
    const lowStock = { ...baseProduct, stockQuantity: 5, lowStockThreshold: 10 };
    renderWithRouter(<ProductCard product={lowStock as any} />);
    expect(screen.getByText('LOW STOCK')).toBeInTheDocument();
  });

  it('shows New Arrival badge when isNew is true', () => {
    const newProduct = { ...baseProduct, isNew: true };
    renderWithRouter(<ProductCard product={newProduct as any} />);
    expect(screen.getByText('New Arrival')).toBeInTheDocument();
  });

  it('links to the product detail page using SKU', () => {
    renderWithRouter(<ProductCard product={baseProduct as any} />);
    const links = screen.getAllByRole('link');
    const productLinks = links.filter(l => l.getAttribute('href') === '/product/BPC-157-5MG');
    expect(productLinks.length).toBeGreaterThan(0);
  });
});
