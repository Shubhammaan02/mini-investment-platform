// frontend/src/app/(auth)/signup/page.tsx
import { SignupForm } from '@/components/auth/SignupForm';
import { Header } from '@/components/layout/Header';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <SignupForm />
      </div>
    </div>
  );
}