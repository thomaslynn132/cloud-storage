import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PaymentFormClient from './payment-form-client';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">FileHost</h1>
          <Button variant="link" asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>
        <PaymentFormClient />
      </main>
    </div>
  );
}