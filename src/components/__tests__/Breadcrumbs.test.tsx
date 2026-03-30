import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '../Breadcrumbs';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Breadcrumbs />
    </MemoryRouter>,
  );
}

describe('Breadcrumbs', () => {
  it('renders nothing at the root path', () => {
    const { container } = renderAt('/');
    expect(container.firstChild).toBeNull();
  });

  it('renders a breadcrumb nav with aria-label="breadcrumb"', () => {
    renderAt('/products');
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
  });

  it('renders a Home icon link pointing to "/"', () => {
    renderAt('/products');
    const homeLink = screen.getByRole('link', { name: '' }); // Home icon — no text, just SVG
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders the current page label as plain text, not a link', () => {
    renderAt('/products');
    // "products" should appear as an aria-current="page" span, not a link
    const currentItem = screen.getByText('products');
    expect(currentItem.tagName).toBe('SPAN');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders intermediate segments as links', () => {
    renderAt('/admin/orders/detail');
    // "admin" and "orders" are intermediate — they should be anchor tags
    const adminLink = screen.getByRole('link', { name: 'admin' });
    expect(adminLink).toHaveAttribute('href', '/admin');

    const ordersLink = screen.getByRole('link', { name: 'orders' });
    expect(ordersLink).toHaveAttribute('href', '/admin/orders');
  });

  it('renders the deepest segment as the current page, not a link', () => {
    renderAt('/admin/orders/detail');
    const currentItem = screen.getByText('detail');
    expect(currentItem.tagName).toBe('SPAN');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('decodes URI-encoded path segments and replaces hyphens with spaces', () => {
    renderAt('/products/bpc-157');
    expect(screen.getByText('bpc 157')).toBeInTheDocument();
  });

  it('renders the correct number of breadcrumb items for a two-segment path', () => {
    renderAt('/research/peptides');
    // Home icon link + 2 path segments = 3 <li> elements
    const list = screen.getByRole('list');
    expect(list.children.length).toBe(3);
  });
});
