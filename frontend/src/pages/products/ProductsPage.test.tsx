import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductsPage } from './ProductsPage';
import { useAuth } from '@/context/AuthContext';
import { listProducts, deleteProduct } from '@/lib/products';
import type { Product } from '@/types/product';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/lib/products', () => ({
  listProducts: vi.fn(),
  deleteProduct: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockListProducts = vi.mocked(listProducts);
const mockDeleteProduct = vi.mocked(deleteProduct);

const product: Product = {
  id: 'p1',
  name: 'Wireless Mouse',
  description: 'A mouse',
  price: 29.99,
  stock: 5,
  category: 'electronics',
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockUseAuth.mockReset();
  mockListProducts.mockReset();
  mockDeleteProduct.mockReset();
  mockUseAuth.mockReturnValue({
    user: null,
    isAuthenticating: false,
    isInitializing: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
});

describe('ProductsPage', () => {
  it('renders products returned from the API', async () => {
    mockListProducts.mockResolvedValue({
      data: [product],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument();
  });

  it('shows an empty state when there are no products', async () => {
    mockListProducts.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByText('No products found.')).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    mockListProducts.mockRejectedValue(new Error('network down'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load/i);
  });

  it('does not show the "Add product" button when signed out', async () => {
    mockListProducts.mockResolvedValue({
      data: [product],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    renderPage();
    await screen.findByText('Wireless Mouse');

    expect(screen.queryByText('Add product')).not.toBeInTheDocument();
  });

  it('shows the "Add product" button and manage controls when signed in', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', name: 'Ameen', email: 'a@b.com' },
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    mockListProducts.mockResolvedValue({
      data: [product],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    renderPage();
    await screen.findByText('Wireless Mouse');

    expect(screen.getByText('Add product')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('re-queries with the search term after the debounce delay', async () => {
    mockListProducts.mockResolvedValue({
      data: [product],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    renderPage();
    await screen.findByText('Wireless Mouse');

    await userEvent.type(screen.getByLabelText('Search products'), 'mouse');

    await waitFor(() =>
      expect(mockListProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'mouse', page: 1 })
      )
    );
  });

  it('paginates using the Next button', async () => {
    mockListProducts.mockResolvedValue({
      data: [product],
      meta: { page: 1, limit: 12, total: 24, totalPages: 2 },
    });

    renderPage();
    await screen.findByText('Wireless Mouse');

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() =>
      expect(mockListProducts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
    );
  });

  it('deletes a product after confirming in the dialog', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', name: 'Ameen', email: 'a@b.com' },
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    mockListProducts.mockResolvedValue({
      data: [product],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
    mockDeleteProduct.mockResolvedValue(undefined);

    renderPage();
    await screen.findByText('Wireless Mouse');

    await userEvent.click(screen.getByText('Delete'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Delete product?')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mockDeleteProduct).toHaveBeenCalledWith('p1'));
  });

  it('cancels the delete confirmation without calling deleteProduct', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', name: 'Ameen', email: 'a@b.com' },
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    mockListProducts.mockResolvedValue({
      data: [product],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    renderPage();
    await screen.findByText('Wireless Mouse');

    await userEvent.click(screen.getByText('Delete'));
    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Delete product?')).not.toBeInTheDocument();
    expect(mockDeleteProduct).not.toHaveBeenCalled();
  });
});
