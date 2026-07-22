import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <Package className="size-5" aria-hidden="true" />
        Product Store
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
