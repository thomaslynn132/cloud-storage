import { Skeleton } from '@/components/ui/skeleton';

export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-64 mx-auto" />
        <div className="grid md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}