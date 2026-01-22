"use client";

import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-1 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-1 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Header Skeleton */}
        <div className="mb-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Skeleton className="h-10 w-3/4 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-32 w-full" />
                </div>

                {/* Additional fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Documents Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
