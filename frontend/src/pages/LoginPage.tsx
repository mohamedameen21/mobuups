import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user } = useAuth();

  if (user) return <Navigate to="/" replace />;

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Welcome back - enter your details to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            No account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Demo user: <span className="font-medium text-foreground">demouser@gmail.com</span> /{' '}
            <span className="font-medium text-foreground">password</span>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
