import { Skeleton } from '@/components/ui/skeleton';

export default function FileDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}