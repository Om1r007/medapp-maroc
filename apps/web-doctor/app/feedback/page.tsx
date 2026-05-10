"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star, MessageSquare } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface FeedbackItem {
  id: string;
  stars: number;
  feedback: string | null;
  tags: string[];
  createdAt: string;
}

interface FeedbackResponse {
  items: FeedbackItem[];
  total: number;
  page: number;
  limit: number;
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < count ? "fill-warning-500 text-warning-500" : "text-neutral-200",
          )}
        />
      ))}
    </div>
  );
}

function FeedbackSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const user = useRequireAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery<FeedbackResponse>({
    queryKey: ["doctor-feedback", page],
    queryFn: () =>
      api.get<FeedbackResponse>(`/doctors/me/feedback?page=${page}&limit=${limit}`),
    enabled: !!user,
  });

  if (!user) return null;

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-16 flex items-center px-6">
        <div className="mx-auto w-full max-w-2xl flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg p-1.5 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="text-base font-semibold text-neutral-900">Mes avis patients</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-6">
        {isLoading ? (
          <FeedbackSkeleton />
        ) : !data?.items.length ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-10">
            <EmptyState
              icon={MessageSquare}
              title="Aucun commentaire reçu"
              description="Les commentaires laissés par vos patients apparaîtront ici."
            />
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-neutral-500">
              {data.total} commentaire{data.total !== 1 ? "s" : ""} — anonymisés
            </p>

            <div className="space-y-3">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-neutral-200 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <StarRow count={item.stars} />
                    <span className="text-xs text-neutral-400">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="primary">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {item.feedback && (
                    <p className="text-sm text-neutral-700 italic">
                      &ldquo;{item.feedback}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg p-2 hover:bg-white border border-neutral-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-neutral-600" />
                </button>
                <span className="text-sm text-neutral-600">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg p-2 hover:bg-white border border-neutral-200 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-neutral-600" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
