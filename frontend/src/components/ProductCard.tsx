import { Link } from 'react-router-dom';
import { Pencil, Trash2, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { Product } from '../types/product';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

interface ProductCardProps {
  product: Product;
  canManage: boolean;
  onDelete: (product: Product) => void;
  isDeleting?: boolean;
}

const API_HOST = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ?? 'http://localhost:4000';

export function ProductCard({ product, canManage, onDelete, isDeleting }: ProductCardProps) {
  const imageSrc =
    product.imageUrl && product.imageUrl.startsWith('/')
      ? `${API_HOST}${product.imageUrl}`
      : product.imageUrl;

  return (
    <Card className="overflow-hidden py-0">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <PackageX className="size-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <CardContent className="space-y-1 pt-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {product.category}
        </p>
        <h3 className="truncate font-medium">{product.name}</h3>
        <p className="text-sm text-muted-foreground">
          {currencyFormatter.format(product.price)} &middot;{' '}
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>
      </CardContent>

      {canManage && (
        <CardFooter className="gap-2 pb-4">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/products/${product.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={() => onDelete(product)}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
