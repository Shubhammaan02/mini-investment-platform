// frontend/src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm';
import { Header } from '@/components/layout/Header';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </div>
  );
}