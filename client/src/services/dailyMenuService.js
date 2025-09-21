import api from "./api";

export const dailyMenuService = {
  // Get daily menu for specific date or today
  async getDailyMenu(date = "today") {
    const response = await api.get(`/daily-menu/${date}`);
    return response.data;
  },

  // Get all daily menus with filters and pagination
  async getAllDailyMenus(params = {}) {
    const response = await api.get("/daily-menu", { params });
    return response.data;
  },

  // Create new daily menu
  async createDailyMenu(menuData) {
    const response = await api.post("/daily-menu", menuData);
    return response.data;
  },

  // Update existing daily menu
  async updateDailyMenu(id, menuData) {
    const response = await api.put(`/daily-menu/${id}`, menuData);
    return response.data;
  },

  // Delete daily menu (soft delete)
  async deleteDailyMenu(id) {
    const response = await api.delete(`/daily-menu/${id}`);
    return response.data;
  },

  // Clone menu from one date to another
  async cloneDailyMenu(sourceDate, targetDate) {
    const response = await api.post("/daily-menu/clone", {
      sourceDate,
      targetDate,
    });
    return response.data;
  },

  // Get menu for date range
  async getMenusForDateRange(startDate, endDate) {
    const response = await api.get("/daily-menu", {
      params: {
        startDate,
        endDate,
        limit: 100, // Get more results for calendar view
      },
    });
    return response.data;
  },
};
