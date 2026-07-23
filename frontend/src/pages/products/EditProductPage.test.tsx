import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditProductPage } from './EditProductPage';
import { getProduct, updateProduct } from '@/lib/products';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/lib/products', () => ({
  getProduct: vi.fn(),
  updateProduct: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockGetProduct = vi.mocked(getProduct);
const mockUpdateProduct = vi.mocked(updateProduct);
const mockUseAuth = vi.mocked(useAuth);

const product = {
  id: 'p1',
  name: 'Existing Product',
  description: 'desc',
  price: 20,
  stock: 4,
  category: 'electronics',
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/products/p1/edit']}>
        <Routes>
          <Route path="/products/:id/edit" element={<EditProductPage />} />
          <Route path="/products" element={<div>Products Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockGetProduct.mockReset();
  mockUpdateProduct.mockReset();
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

describe('EditProductPage', () => {
  it('loads and prefills the existing product', async () => {
    mockGetProduct.mockResolvedValue(product);

    renderPage();

    expect(await screen.findByLabelText('Name')).toHaveValue('Existing Product');
    expect(mockGetProduct).toHaveBeenCalledWith('p1');
  });

  it('shows an error state when the product fails to load', async () => {
    mockGetProduct.mockRejectedValue(new Error('not found'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load/i);
  });

  it('submits the update and navigates back to the catalog', async () => {
    mockGetProduct.mockResolvedValue(product);
    mockUpdateProduct.mockResolvedValue({ ...product, price: 25 });

    renderPage();
    await screen.findByLabelText('Name');

    const priceInput = screen.getByLabelText('Price (USD)');
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '25');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Products Page')).toBeInTheDocument();
    expect(mockUpdateProduct).toHaveBeenCalledWith('p1', expect.objectContaining({ price: 25 }));
  });
});
