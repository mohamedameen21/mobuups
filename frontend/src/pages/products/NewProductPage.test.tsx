import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewProductPage } from './NewProductPage';
import { createProduct } from '@/lib/products';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/lib/products', () => ({
  createProduct: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockCreateProduct = vi.mocked(createProduct);
const mockUseAuth = vi.mocked(useAuth);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/products/new']}>
        <Routes>
          <Route path="/products/new" element={<NewProductPage />} />
          <Route path="/products" element={<div>Products Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockCreateProduct.mockReset();
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({
    user: { id: 'u1', name: 'Ameen', email: 'a@b.com' },
    isAuthenticating: false,
    isInitializing: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
});

describe('NewProductPage', () => {
  it('renders the form', () => {
    renderPage();
    expect(screen.getByText('Add a new product to the catalog.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('creates the product and navigates back to the catalog on success', async () => {
    mockCreateProduct.mockResolvedValue({
      id: 'p1',
      name: 'New Product',
      description: null,
      price: 10,
      stock: 1,
      category: 'misc',
      imageUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    renderPage();
    await userEvent.type(screen.getByLabelText('Name'), 'New Product');
    await userEvent.type(screen.getByLabelText('Price (USD)'), '10');
    await userEvent.type(screen.getByLabelText('Stock'), '1');
    await userEvent.type(screen.getByLabelText('Category'), 'misc');
    await userEvent.click(screen.getByRole('button', { name: 'Add product' }));

    expect(await screen.findByText('Products Page')).toBeInTheDocument();
    expect(mockCreateProduct).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Product', price: 10, stock: 1, category: 'misc' })
    );
  });
});
