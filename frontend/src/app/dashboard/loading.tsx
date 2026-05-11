import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-72" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}