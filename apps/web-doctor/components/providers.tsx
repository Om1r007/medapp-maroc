"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { extractErrorMessage } from "../lib/error-message";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => {
    // _qc allows MutationCache.onSuccess to reference the client without a
    // circular type error — by the time onSuccess fires, _qc is already set.
    let _qc: QueryClient | null = null;

    const qc = new QueryClient({
      queryCache: new QueryCache({
        onError: (err) => console.error("Query error:", extractErrorMessage(err)),
      }),
      mutationCache: new MutationCache({
        onError: (err) => console.error("Mutation error:", extractErrorMessage(err)),
        onSuccess: () => _qc?.invalidateQueries(),
      }),
      defaultOptions: {
        queries: {
          staleTime: 0,
          refetchOnWindowFocus: true,
          refetchOnMount: "always",
          refetchOnReconnect: true,
          retry: 1,
        },
      },
    });

    _qc = qc;
    return qc;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
