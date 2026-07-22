import { Link } from 'react-router-dom';
import { Search, ShieldCheck, PackageSearch } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: PackageSearch,
    title: 'Full product catalog',
    description: 'Browse every product with paginated, fast-loading results.',
  },
  {
    icon: Search,
    title: 'Search & filter',
    description: 'Debounced search finds products by name or description instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    description: 'JWT-authenticated writes keep adding, editing, and deleting locked down.',
  },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Manage your product catalog, end to end
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A lightweight REST API and web client for adding, editing, searching, and browsing
            products - built for a real online store, not just a demo.
          </p>

          {!user && (
            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/register">Get started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <CardTitle className="mt-3">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <p className="text-center text-sm text-muted-foreground">
          Product Store &middot; FullStack Developer Test Assignment
        </p>
      </footer>
    </div>
  );
}
