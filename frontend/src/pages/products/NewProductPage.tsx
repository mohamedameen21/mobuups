import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProductForm, type ProductFormValues } from '@/components/ProductForm';
import { createProduct } from '@/lib/products';

export function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => createProduct(values),
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
            <CardTitle>Add product</CardTitle>
            <CardDescription>Add a new product to the catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm
              onSubmit={async (values) => {
                await mutation.mutateAsync(values);
              }}
              submitLabel="Add product"
              submittingLabel="Adding..."
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
