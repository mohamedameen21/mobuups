import { Link } from 'react-router-dom';
import { Search, ShieldCheck, PackageSearch, FileText, ExternalLink } from 'lucide-react';
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

          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/products">Browse products</Link>
            </Button>
            {!user && (
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">Get started</Link>
              </Button>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
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

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <a
            href="/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-start gap-4 rounded-xl border border-primary/30 bg-primary/5 p-6 transition-colors hover:border-primary hover:bg-primary/10 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  API Documentation
                  <ExternalLink
                    className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore every endpoint interactively with the Swagger / OpenAPI UI - try requests
                  live and inspect schemas.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform group-hover:scale-[1.02]">
              Open API docs
            </span>
          </a>
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
