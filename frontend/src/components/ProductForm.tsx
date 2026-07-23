import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '../types/product';

import { api } from '../lib/api';

// Mirrors backend/src/modules/products/products.schema.ts
const productSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().positive('Price must be greater than 0').max(1_000_000),
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
  category: z.string().trim().min(1, 'Category is required').max(100),
  imageUrl: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z
      .string()
      .refine(
        (val) => {
          if (!val) return true;
          if (val.startsWith('/')) return true;
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: 'Enter a valid image URL' }
      )
      .optional()
  ),
});

type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormValues = z.output<typeof productSchema>;

interface ProductFormProps {
  initialValues?: Partial<Product>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
}

export function ProductForm({
  initialValues,
  onSubmit,
  submitLabel,
  submittingLabel,
}: ProductFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      price: initialValues?.price,
      stock: initialValues?.stock,
      category: initialValues?.category ?? '',
      imageUrl: initialValues?.imageUrl ?? '',
    },
  });

  const currentImageUrl = watch('imageUrl');

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post<{ data: { url: string } }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValue('imageUrl', res.data.data.url, { shouldValidate: true });
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to upload image.';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function submit(values: ProductFormValues) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Something went wrong. Please try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" type="text" {...register('name')} />
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={3}
          className="border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
          {...register('description')}
        />
        {errors.description && (
          <p role="alert" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input id="price" type="number" step="0.01" min="0" {...register('price')} />
          {errors.price && (
            <p role="alert" className="text-sm text-destructive">
              {errors.price.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" step="1" min="0" {...register('stock')} />
          {errors.stock && (
            <p role="alert" className="text-sm text-destructive">
              {errors.stock.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input id="category" type="text" {...register('category')} />
        {errors.category && (
          <p role="alert" className="text-sm text-destructive">
            {errors.category.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileUpload">Product Image</Label>
        <Input
          id="fileUpload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        {isUploading && <p className="text-xs text-muted-foreground">Uploading image to server...</p>}
        {uploadError && (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        )}
        <input type="hidden" id="imageUrl" {...register('imageUrl')} />
        {errors.imageUrl && (
          <p role="alert" className="text-sm text-destructive">
            {errors.imageUrl.message}
          </p>
        )}
        {typeof currentImageUrl === 'string' && currentImageUrl !== '' && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>Uploaded image path: <span className="font-mono text-foreground">{currentImageUrl}</span></p>
          </div>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
