import api from "./api";

export const menuService = {
  async getMenuItems(params = {}) {
    const response = await api.get("/menu", { params });
    return response.data;
  },

  async getMenuItem(id) {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  async createMenuItem(menuItemData) {
    const response = await api.post("/menu", menuItemData);
    return response.data;
  },

  async updateMenuItem(id, menuItemData) {
    const response = await api.put(`/menu/${id}`, menuItemData);
    return response.data;
  },

  async deleteMenuItem(id) {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  },
};
