'use client';

import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

const convex = new ConvexReactClient(
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_DEV_CONVEX_URL!
    : process.env.NEXT_PUBLIC_CONVEX_URL!
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
