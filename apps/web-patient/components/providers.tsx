"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { extractErrorMessage } from "../lib/error-message";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (err) => console.error("Query error:", extractErrorMessage(err)),
        }),
        mutationCache: new MutationCache({
          onError: (err) => console.error("Mutation error:", extractErrorMessage(err)),
        }),
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
