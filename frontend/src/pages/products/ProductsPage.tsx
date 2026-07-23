import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { PaginationBar } from '@/components/PaginationBar';
import { deleteProduct, listProducts } from '@/lib/products';
import type { Product } from '@/types/product';

const PAGE_SIZE = 12;
const CATEGORIES = [
  'pizzas',
  'cakes & bakery',
  'burgers',
  'salads & bowls',
  'pasta & Italian',
  'desserts',
  'beverages',
];

export function ProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', { search, category, page }],
    queryFn: () =>
      listProducts({
        search: search || undefined,
        category: category || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      setProductPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          {user && (
            <Button asChild>
              <Link to="/products/new">
                <Plus className="size-4" aria-hidden="true" />
                Add product
              </Link>
            </Button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search products"
            />
          </div>

          <select
            className="border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading products...</p>}
        {isError && (
          <p role="alert" className="text-sm text-destructive">
            Couldn&apos;t load products. Please try again.
          </p>
        )}
        {!isLoading && !isError && products.length === 0 && (
          <p className="text-sm text-muted-foreground">No products found.</p>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              canManage={Boolean(user)}
              onDelete={setProductPendingDelete}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === product.id}
            />
          ))}
        </div>

        {meta && <PaginationBar meta={meta} onPageChange={setPage} />}
      </main>

      {productPendingDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-heading"
            className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg"
          >
            <h2 id="delete-product-heading" className="font-semibold">
              Delete product?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This will permanently delete &ldquo;{productPendingDelete.name}&rdquo;. This can't be
              undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductPendingDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(productPendingDelete.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
