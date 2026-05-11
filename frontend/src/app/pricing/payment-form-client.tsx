'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const plans = {
  basic: { name: 'Basic', price: 49, storage: '50 GB', features: ['50 GB Storage', '30-day free file expiry', 'Email support'] },
  pro: { name: 'Pro', price: 99, storage: '500 GB', features: ['500 GB Storage', 'Permanent storage', 'Priority support', 'Advanced analytics'] },
};

export default function PaymentFormClient() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedPlan || !transactionRef || !paymentProof) {
      setError('Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.requestSubscription(selectedPlan, plans[selectedPlan].price, transactionRef, paymentProof);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your payment request has been submitted. An admin will review and approve it shortly.
          </p>
          <Button variant="link" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8">
        {(Object.entries(plans) as [string, typeof plans.basic][]).map(([key, plan]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all ${selectedPlan === key ? 'ring-2 ring-blue-600' : ''}`}
            onClick={() => setSelectedPlan(key as 'basic' | 'pro')}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-3xl font-bold mt-4">${plan.price}<span className="text-sm font-normal">/year</span></p>
              <p className="text-gray-600 mt-2">{plan.storage} Storage</p>
            </CardHeader>
            <CardContent>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-6" variant={selectedPlan === key ? 'default' : 'outline'} onClick={() => setSelectedPlan(key as 'basic' | 'pro')}>
                Select {plan.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <Card className="mt-8">
          <CardHeader><CardTitle>Complete Payment</CardTitle></CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="transactionRef">Transaction Reference</Label>
                <Input id="transactionRef" type="text" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="Enter payment transaction ID" required />
              </div>
              <div>
                <Label htmlFor="paymentProof">Payment Proof (Screenshot)</Label>
                <Input id="paymentProof" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setPaymentProof(e.target.files[0])} required />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Payment Proof'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}