import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, LogIn, UserPlus, Home } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function UnauthorizedPage() {
  const location = useLocation();

  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader className="flex flex-col items-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-7" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Restricted</CardTitle>
            <CardDescription className="mt-2 text-base font-medium text-destructive">
              You are unauthorized. Please log in to access this page.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              The page or action you requested requires an authenticated account. Please log in with your credentials or create a new account to continue.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/login" state={{ from: location.state?.from ?? location }}>
                <LogIn className="size-4 mr-1.5" aria-hidden="true" />
                Log in
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/register">
                <UserPlus className="size-4 mr-1.5" aria-hidden="true" />
                Sign up
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full sm:w-auto">
              <Link to="/">
                <Home className="size-4 mr-1.5" aria-hidden="true" />
                Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
