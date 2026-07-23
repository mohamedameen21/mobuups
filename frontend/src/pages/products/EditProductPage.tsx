import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProductForm, type ProductFormValues } from '@/components/ProductForm';
import { getProduct, updateProduct } from '@/lib/products';

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id!),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => updateProduct(id!, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void navigate('/products');
    },
  });

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Edit product</CardTitle>
            <CardDescription>Update this product's details.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {isError && (
              <p role="alert" className="text-sm text-destructive">
                Couldn&apos;t load this product.
              </p>
            )}
            {product && (
              <ProductForm
                initialValues={product}
                onSubmit={async (values) => {
                  await mutation.mutateAsync(values);
                }}
                submitLabel="Save changes"
                submittingLabel="Saving..."
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
