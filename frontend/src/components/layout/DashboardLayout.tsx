// frontend/src/components/layout/DashboardLayout.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header />
//       <div className="flex h-[calc(100vh-4rem)]">
//         <Sidebar />
//         <main className="flex-1 overflow-auto">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// };

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}