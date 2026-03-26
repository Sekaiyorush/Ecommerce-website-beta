import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SEO } from '../SEO';

describe('SEO', () => {
  afterEach(() => {
    cleanup();
    // Reset title
    document.title = '';
    // Remove meta tags added by SEO component
    document.querySelectorAll('meta[property^="og:"], meta[name="description"]').forEach(el => el.remove());
    document.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove());
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
  });

  it('sets document.title with brand suffix', () => {
    render(<SEO title="Products" />);
    expect(document.title).toBe('Products | Golden Tier Peptide');
  });

  it('sets meta description when provided', () => {
    render(<SEO title="Home" description="Premium peptides" />);
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta!.getAttribute('content')).toBe('Premium peptides');
  });

  it('sets Open Graph title', () => {
    render(<SEO title="About" />);
    const og = document.querySelector('meta[property="og:title"]');
    expect(og).not.toBeNull();
    expect(og!.getAttribute('content')).toBe('About | Golden Tier Peptide');
  });

  it('sets og:image when provided', () => {
    render(<SEO title="Test" ogImage="https://example.com/img.jpg" />);
    const og = document.querySelector('meta[property="og:image"]');
    expect(og).not.toBeNull();
    expect(og!.getAttribute('content')).toBe('https://example.com/img.jpg');
  });

  it('sets canonical link when provided', () => {
    render(<SEO title="Test" canonical="https://example.com/page" />);
    const link = document.querySelector('link[rel="canonical"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('https://example.com/page');
  });

  it('injects JSON-LD script tag', () => {
    const jsonLd = { '@type': 'Product', name: 'BPC-157' };
    render(<SEO title="Test" jsonLd={jsonLd} />);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(JSON.parse(script!.textContent!)).toEqual(jsonLd);
  });

  it('cleans up JSON-LD script on unmount', () => {
    const jsonLd = { '@type': 'Product', name: 'BPC-157' };
    const { unmount } = render(<SEO title="Test" jsonLd={jsonLd} />);
    expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull();
    unmount();
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('resets document.title on unmount', () => {
    const { unmount } = render(<SEO title="Custom" />);
    expect(document.title).toBe('Custom | Golden Tier Peptide');
    unmount();
    expect(document.title).toBe('Golden Tier Peptide | Premium Research Supplies');
  });

  it('renders nothing (returns null)', () => {
    const { container } = render(<SEO title="Test" />);
    expect(container.innerHTML).toBe('');
  });
});
