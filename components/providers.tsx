"use client";

import type { ReactNode } from "react";

// ClerkProvider is in app/layout.tsx — no wrapper needed here.
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
