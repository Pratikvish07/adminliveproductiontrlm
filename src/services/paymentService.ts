import api from './api';

export const paymentService = {
  getLoanTracking: async () => {
    const response = await api.get('/api/payment/loan-tracking');
    return response.data;
  },

  approveLoan: async (loanId: string) => {
    const response = await api.patch(`/api/payment/loans/${loanId}/approve`);
    return response.data;
  },

  getPayments: async () => {
    const response = await api.get('/api/payment/payments');
    return response.data;
  },
};

