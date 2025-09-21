import api from "./api";

// Get today's menu
export const getTodaysMenu = async () => {
  try {
    const response = await api.get("/weekly-menu/today");
    return response.data;
  } catch (error) {
    console.error("Error fetching today's menu:", error);
    throw error;
  }
};

// Get menu for specific day of week (0-6, 0=Sunday)
export const getMenuForDay = async (dayOfWeek) => {
  try {
    const response = await api.get(`/weekly-menu/day/${dayOfWeek}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu for day ${dayOfWeek}:`, error);
    throw error;
  }
};

// Get full week menu
export const getFullWeekMenu = async () => {
  try {
    const response = await api.get("/weekly-menu/week");
    return response.data;
  } catch (error) {
    console.error("Error fetching full week menu:", error);
    throw error;
  }
};

// Create or update weekly menu for a specific day
export const createOrUpdateWeeklyMenu = async (menuData) => {
  try {
    const response = await api.post("/weekly-menu", menuData);
    return response.data;
  } catch (error) {
    console.error("Error creating/updating weekly menu:", error);
    throw error;
  }
};

// Delete weekly menu for a specific day
export const deleteWeeklyMenu = async (dayOfWeek) => {
  try {
    const response = await api.delete(`/weekly-menu/day/${dayOfWeek}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting weekly menu for day ${dayOfWeek}:`, error);
    throw error;
  }
};

// Restore weekly menu for a specific day
export const restoreWeeklyMenu = async (dayOfWeek) => {
  try {
    const response = await api.patch(`/weekly-menu/restore/${dayOfWeek}`);
    return response.data;
  } catch (error) {
    console.error(`Error restoring weekly menu for day ${dayOfWeek}:`, error);
    throw error;
  }
};

// Copy menu from one day to another
export const copyWeeklyMenu = async (fromDay, toDay) => {
  try {
    const response = await api.post("/weekly-menu/copy", { fromDay, toDay });
    return response.data;
  } catch (error) {
    console.error(`Error copying menu from day ${fromDay} to ${toDay}:`, error);
    throw error;
  }
};

// Helper function to get day names
export const getDayNames = () => [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Helper function to get today's day of week
export const getTodaysDayOfWeek = () => {
  return new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
};

// Helper function to format day name
export const formatDayName = (dayOfWeek) => {
  const days = getDayNames();
  return days[dayOfWeek] || "Unknown";
};
