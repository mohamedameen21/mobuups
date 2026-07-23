import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { Product } from '../types/product';

const product: Product = {
  id: '1',
  name: 'Wireless Mouse',
  description: 'A mouse',
  price: 29.99,
  stock: 5,
  category: 'electronics',
  imageUrl: 'https://images.unsplash.com/photo-abc',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderCard(props: Partial<ComponentProps<typeof ProductCard>> = {}) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} canManage={false} onDelete={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('ProductCard', () => {
  it('renders the product name, price, and category', () => {
    renderCard();

    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
    expect(screen.getByText('electronics')).toBeInTheDocument();
    expect(screen.getByText(/\$29\.99/)).toBeInTheDocument();
  });

  it('shows stock count when in stock', () => {
    renderCard();
    expect(screen.getByText(/5 in stock/)).toBeInTheDocument();
  });

  it('shows "Out of stock" when stock is zero', () => {
    renderCard({ product: { ...product, stock: 0 } });
    expect(screen.getByText(/Out of stock/)).toBeInTheDocument();
  });

  it('renders a placeholder icon when there is no image', () => {
    renderCard({ product: { ...product, imageUrl: null } });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('hides edit/delete controls when canManage is false', () => {
    renderCard({ canManage: false });
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows edit/delete controls when canManage is true', () => {
    renderCard({ canManage: true });
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onDelete with the product when Delete is clicked', async () => {
    const onDelete = vi.fn();
    renderCard({ canManage: true, onDelete });

    await userEvent.click(screen.getByText('Delete'));

    expect(onDelete).toHaveBeenCalledWith(product);
  });

  it('disables the delete button while deleting', () => {
    renderCard({ canManage: true, isDeleting: true });
    expect(screen.getByText('Deleting...')).toBeDisabled();
  });
});
