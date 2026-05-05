import api from './api';

export const paymentService = {
  async requestSubscription(plan: 'basic' | 'pro', amount: number, transactionRef: string, paymentProof: File) {
    const formData = new FormData();
    formData.append('plan', plan);
    formData.append('amount', amount.toString());
    formData.append('transactionRef', transactionRef);
    formData.append('paymentProof', paymentProof);

    const { data } = await api.post('/payments/subscribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getPaymentHistory() {
    const { data } = await api.get('/payments/history');
    return data;
  },

  async getPendingPayments() {
    const { data } = await api.get('/payments/pending');
    return data;
  },

  async confirmPayment(paymentId: string, status: 'approved' | 'rejected', adminNote?: string) {
    const { data } = await api.post('/payments/confirm', {
      paymentId,
      status,
      adminNote,
    });
    return data;
  },
};
