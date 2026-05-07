'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paymentService } from '@/services/payment.service';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Admin() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!currentUser.isAdmin) {
      router.push('/dashboard');
      return;
    }
    setUser(currentUser);
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await paymentService.getPendingPayments();
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (paymentId: string, status: 'approved' | 'rejected') => {
    try {
      await paymentService.confirmPayment(paymentId, status);
      alert(`Payment ${status}!`);
      loadPayments();
    } catch (err) {
      alert('Failed to update payment');
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <Button variant="link" className="text-red-600" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl font-semibold mb-6">Pending Payments</h2>

        {payments.length === 0 ? (
          <p className="text-gray-500">No pending payments</p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment: any) => (
              <Card key={payment.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{payment.user?.email}</h3>
                      <p className="text-sm text-gray-500">Plan: {payment.plan}</p>
                      <p className="text-sm text-gray-500">Amount: ${payment.amount / 100}</p>
                      <p className="text-sm text-gray-500">Ref: {payment.stripeSubscriptionId}</p>
                      <Badge variant="secondary" className="mt-2">
                        {new Date(payment.createdAt).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="space-x-2">
                      <Button
                        onClick={() => handleConfirm(payment.id, 'approved')}
                        variant="default"
                        size="sm"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleConfirm(payment.id, 'rejected')}
                        variant="destructive"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
