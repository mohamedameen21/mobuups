import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function AppRoutes() {
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
