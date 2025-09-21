import api from "./api";

export const transactionService = {
  async createTransaction(transactionData) {
    const response = await api.post("/transactions", transactionData);
    return response.data;
  },

  async getUserTransactions(userId, params = {}) {
    const response = await api.get(`/transactions/user/${userId}/history`, {
      params,
    });
    return response.data;
  },

  async getAllTransactions(params = {}) {
    const response = await api.get("/transactions", { params });
    return response.data;
  },

  async getTransaction(id) {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
};
