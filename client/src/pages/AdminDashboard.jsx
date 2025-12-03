import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Copy,
} from "lucide-react";
import { menuService } from "../services/menuService";
import { transactionService } from "../services/transactionService";
import { analyticsService } from "../services/analyticsService";
import {
  getFullWeekMenu,
  getMenuForDay,
  createOrUpdateWeeklyMenu,
  deleteWeeklyMenu,
  copyWeeklyMenu,
  getDayNames,
  getTodaysDayOfWeek,
  formatDayName,
} from "../services/weeklyMenuService";
import useAuthStore from "../store/authStore";
import WebcamCapture from "../components/WebcamCapture";
import { mlService } from "../services/mlService";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [menuItems, setMenuItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Menu item form state
  const [menuItemForm, setMenuItemForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    isAvailable: true,
  });
  const [editingItem, setEditingItem] = useState(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);

  // Weekly menu state
  const [weeklyMenus, setWeeklyMenus] = useState([]);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(null); // Start with null
  const [selectedWeeklyMenu, setSelectedWeeklyMenu] = useState(null);
  const [isWeeklyMenuDialogOpen, setIsWeeklyMenuDialogOpen] = useState(false);
  const [weeklyMenuForm, setWeeklyMenuForm] = useState({
    dayOfWeek: null, // No default day selected
    meals: {
      breakfast: { items: [], isActive: true },
      lunch: { items: [], isActive: true },
      dinner: { items: [], isActive: true },
    },
    specialNotes: "",
  });

  // ML Scan state
  const [mlFoodFile, setMlFoodFile] = useState(null);
  const [mlFaceFile, setMlFaceFile] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlResult, setMlResult] = useState(null);

  const { user, logout } = useAuthStore();

  // ML capture handlers
  const onFoodCaptured = (_blob, file) => setMlFoodFile(file);
  const onFaceCaptured = (_blob, file) => setMlFaceFile(file);
  const handleFoodUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setMlFoodFile(file);
  };
  const handleFaceUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setMlFaceFile(file);
  };

  async function handleMlScan() {
    if (!mlFoodFile || !mlFaceFile) {
      toast({
        title: "Missing photos",
        description: "Capture both food and face photos first",
        variant: "destructive",
      });
      return;
    }
    try {
      setMlLoading(true);
      const data = await mlService.scan({
        foodImage: mlFoodFile,
        faceImage: mlFaceFile,
      });
      setMlResult(data);
      toast({
        title: "Scan complete",
        description: `Matched ${data.matchedItems?.length || 0} items`,
      });
      // Refresh transactions tab content if open
      await fetchTransactions();
    } catch (e) {
      toast({
        title: "Scan failed",
        description: e.response?.data?.message || e.message,
        variant: "destructive",
      });
    } finally {
      setMlLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "overview") {
      fetchAnalytics();
    } else if (activeTab === "menu") {
      fetchMenuItems();
    } else if (activeTab === "transactions") {
      fetchTransactions();
    } else if (activeTab === "weekly-menu") {
      fetchWeeklyMenus();
      fetchMenuItems(); // Also fetch menu items for the dropdown
      // Keep selectedDayOfWeek as null to show "Select a day" placeholder
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await menuService.getMenuItems();
      console.log("Menu items fetched:", response.data);
      setMenuItems(response.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getAllTransactions();
      setTransactions(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemSubmit = async (e) => {
    e.preventDefault();

    try {
      const itemData = {
        ...menuItemForm,
        price: parseFloat(menuItemForm.price),
      };

      if (editingItem) {
        await menuService.updateMenuItem(editingItem._id, itemData);
        toast({
          title: "Success",
          description: "Menu item updated successfully",
        });
      } else {
        await menuService.createMenuItem(itemData);
        toast({
          title: "Success",
          description: "Menu item created successfully",
        });
      }

      setIsMenuDialogOpen(false);
      resetMenuForm();
      fetchMenuItems();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save menu item",
        variant: "destructive",
      });
    }
  };

  const handleEditMenuItem = (item) => {
    setEditingItem(item);
    setMenuItemForm({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description || "",
      isAvailable: item.isAvailable,
    });
    setIsMenuDialogOpen(true);
  };

  const handleDeleteMenuItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await menuService.deleteMenuItem(id);
        toast({
          title: "Success",
          description: "Menu item deleted successfully",
        });
        fetchMenuItems();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete menu item",
          variant: "destructive",
        });
      }
    }
  };

  const resetMenuForm = () => {
    setMenuItemForm({
      name: "",
      price: "",
      category: "",
      description: "",
      isAvailable: true,
    });
    setEditingItem(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  // Weekly Menu Functions
  const fetchWeeklyMenus = async () => {
    try {
      setLoading(true);

      // Ensure menu items are loaded first
      if (menuItems.length === 0) {
        await fetchMenuItems();
      }

      const response = await getFullWeekMenu();
      setWeeklyMenus(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch weekly menus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyMenuForDay = async (dayOfWeek) => {
    try {
      // Ensure menu items are loaded first
      if (menuItems.length === 0) {
        await fetchMenuItems();
      }

      const response = await getMenuForDay(dayOfWeek);
      console.log("Weekly menu response:", response.data);
      console.log("Menu items available:", menuItems.length);

      // Log the structure of menu items in the response
      if (response.data && response.data.meals) {
        Object.keys(response.data.meals).forEach((mealType) => {
          console.log(
            `${mealType} items:`,
            response.data.meals[mealType].items
          );
        });
      }

      setSelectedWeeklyMenu(response.data);
    } catch (error) {
      // Menu not found for day, that's ok
      setSelectedWeeklyMenu(null);
    }
  };

  const handleDaySelect = async (dayOfWeek) => {
    setSelectedDayOfWeek(dayOfWeek);
    await fetchWeeklyMenuForDay(dayOfWeek);
  };

  const handleCreateWeeklyMenu = async () => {
    // Ensure a day is selected
    if (selectedDayOfWeek === null) {
      toast({
        title: "No Day Selected",
        description: "Please select a day of the week first",
        variant: "destructive",
      });
      return;
    }

    // Ensure menu items are loaded
    if (menuItems.length === 0) {
      await fetchMenuItems();
    }

    setWeeklyMenuForm({
      dayOfWeek: selectedDayOfWeek !== null ? selectedDayOfWeek : null,
      meals: {
        breakfast: { items: [], isActive: true },
        lunch: { items: [], isActive: true },
        dinner: { items: [], isActive: true },
      },
      specialNotes: "",
    });
    setSelectedWeeklyMenu(null);
    setIsWeeklyMenuDialogOpen(true);
  };

  const handleEditWeeklyMenu = async (menu) => {
    // Ensure menu items are loaded
    if (menuItems.length === 0) {
      await fetchMenuItems();
    }

    // Convert populated menuItemId objects back to just IDs for editing
    const processedMeals = {};
    Object.keys(menu.meals).forEach((mealType) => {
      processedMeals[mealType] = {
        ...menu.meals[mealType],
        items: menu.meals[mealType].items.map((item) => ({
          ...item,
          menuItemId: item.menuItemId?._id || item.menuItemId,
        })),
      };
    });

    setWeeklyMenuForm({
      dayOfWeek: menu.dayOfWeek,
      meals: processedMeals,
      specialNotes: menu.specialNotes || "",
    });
    setSelectedWeeklyMenu(menu);
    setIsWeeklyMenuDialogOpen(true);
  };

  const handleSaveWeeklyMenu = async () => {
    try {
      await createOrUpdateWeeklyMenu(weeklyMenuForm);
      toast({
        title: "Success",
        description: `Weekly menu for ${formatDayName(
          weeklyMenuForm.dayOfWeek
        )} ${selectedWeeklyMenu ? "updated" : "created"} successfully`,
      });
      setIsWeeklyMenuDialogOpen(false);
      fetchWeeklyMenus();
      fetchWeeklyMenuForDay(selectedDayOfWeek);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save weekly menu",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWeeklyMenu = async (dayOfWeek) => {
    if (
      window.confirm(
        `Are you sure you want to delete the menu for ${formatDayName(
          dayOfWeek
        )}?`
      )
    ) {
      try {
        await deleteWeeklyMenu(dayOfWeek);
        toast({
          title: "Success",
          description: `Weekly menu for ${formatDayName(
            dayOfWeek
          )} deleted successfully`,
        });
        fetchWeeklyMenus();
        fetchWeeklyMenuForDay(selectedDayOfWeek);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete weekly menu",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopyWeeklyMenu = async (fromDay, toDay) => {
    try {
      await copyWeeklyMenu(fromDay, toDay);
      toast({
        title: "Success",
        description: `Menu copied from ${formatDayName(
          fromDay
        )} to ${formatDayName(toDay)} successfully`,
      });
      fetchWeeklyMenus();
      fetchWeeklyMenuForDay(selectedDayOfWeek);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy weekly menu",
        variant: "destructive",
      });
    }
  };

  const addItemToMeal = (mealType, menuItemId) => {
    setWeeklyMenuForm((prev) => ({
      ...prev,
      meals: {
        ...prev.meals,
        [mealType]: {
          ...prev.meals[mealType],
          items: [
            ...prev.meals[mealType].items,
            { menuItemId, isAvailable: true },
          ],
        },
      },
    }));
  };

  const removeItemFromMeal = (mealType, index) => {
    setWeeklyMenuForm((prev) => ({
      ...prev,
      meals: {
        ...prev.meals,
        [mealType]: {
          ...prev.meals[mealType],
          items: prev.meals[mealType].items.filter((_, i) => i !== index),
        },
      },
    }));
  };

  if (
    loading &&
    !analytics &&
    menuItems.length === 0 &&
    transactions.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {user?.name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
            <TabsTrigger value="weekly-menu">Weekly Menu</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="ml-scan">ML Scan</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {analytics && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2 text-center">
                      <CardTitle className="text-sm font-medium">
                        Total Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground ml-2" />
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">
                        {formatCurrency(analytics.overview.totalRevenue)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2 text-center">
                      <CardTitle className="text-sm font-medium">
                        Total Transactions
                      </CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground ml-2" />
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">
                        {analytics.overview.totalTransactions}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2 text-center">
                      <CardTitle className="text-sm font-medium">
                        Average Transaction
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground ml-2" />
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          analytics.overview.averageTransactionValue
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2 text-center">
                      <CardTitle className="text-sm font-medium">
                        Total Users
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground ml-2" />
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">
                        {analytics.overview.totalUsers}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Popular Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Popular Menu Items</CardTitle>
                      <CardDescription>Most ordered items</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.popularItems
                          .slice(0, 5)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-left">
                                  {item.name}
                                </p>
                                <p className="text-sm text-gray-500 text-left">
                                  {item.quantity} orders
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {formatCurrency(item.revenue)}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Customers</CardTitle>
                      <CardDescription>Highest spending users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.topUsers.map((user, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">
                                {user.transactionCount} transactions
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(user.totalSpent)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Menu Management</h2>
                  <p className="text-gray-600">Manage your menu items</p>
                </div>
                <Dialog
                  open={isMenuDialogOpen}
                  onOpenChange={setIsMenuDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={resetMenuForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMenuItemSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={menuItemForm.name}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={menuItemForm.price}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={menuItemForm.category}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              category: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={menuItemForm.description}
                          onChange={(e) =>
                            setMenuItemForm({
                              ...menuItemForm,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        {editingItem ? "Update Item" : "Add Item"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Name</TableHead>
                        <TableHead className="text-center">Category</TableHead>
                        <TableHead className="text-center">Price</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium text-center">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.category}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                item.isAvailable ? "default" : "secondary"
                              }
                            >
                              {item.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex space-x-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditMenuItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteMenuItem(item._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Weekly Menu Tab */}
          <TabsContent value="weekly-menu">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Day Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Day of Week</CardTitle>
                  <CardDescription>
                    Choose a day to manage weekly menu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dayOfWeek">Day of Week</Label>
                      <Select
                        value={
                          selectedDayOfWeek !== null
                            ? selectedDayOfWeek.toString()
                            : ""
                        }
                        onValueChange={(value) =>
                          handleDaySelect(parseInt(value))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDayNames().map((dayName, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {dayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedWeeklyMenu && selectedDayOfWeek !== null ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">
                            Menu for {formatDayName(selectedDayOfWeek)}
                          </h3>
                          <div className="space-x-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleEditWeeklyMenu(selectedWeeklyMenu)
                              }
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDeleteWeeklyMenu(
                                  selectedWeeklyMenu.dayOfWeek
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        {/* Display current menu */}
                        <div className="space-y-3">
                          {["breakfast", "lunch", "dinner"].map((mealType) => (
                            <div key={mealType} className="border rounded p-3">
                              <h4 className="font-medium capitalize mb-2">
                                {mealType}
                              </h4>
                              {selectedWeeklyMenu.meals[mealType]?.items
                                ?.length > 0 ? (
                                <div className="space-y-1">
                                  {selectedWeeklyMenu.meals[mealType].items.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className="text-sm text-gray-600"
                                      >
                                        •{" "}
                                        {item.menuItemId?.name ||
                                          "Unknown item"}
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No items added
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : selectedDayOfWeek !== null ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          No menu set for {formatDayName(selectedDayOfWeek)}
                        </p>
                        <Button onClick={handleCreateWeeklyMenu}>
                          <Plus className="h-4 w-4 mr-1" />
                          Create Menu
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          Please select a day to view or create a menu
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Menus Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Menus</CardTitle>
                  <CardDescription>All weekly recurring menus</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getDayNames().map((dayName, dayOfWeek) => {
                      const menu = weeklyMenus.find(
                        (m) => m.dayOfWeek === dayOfWeek
                      );
                      return (
                        <div
                          key={dayOfWeek}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <p className="font-medium">{dayName}</p>
                            <p className="text-sm text-gray-500">
                              {menu
                                ? `${Object.keys(menu.meals).filter(
                                  (meal) =>
                                    menu.meals[meal].items.length > 0
                                ).length
                                } meals planned`
                                : "No menu set"}
                            </p>
                          </div>
                          <div className="space-x-2">
                            {menu ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const fromDay = selectedDayOfWeek;
                                    if (fromDay !== dayOfWeek) {
                                      handleCopyWeeklyMenu(fromDay, dayOfWeek);
                                    }
                                  }}
                                  disabled={
                                    selectedDayOfWeek === dayOfWeek ||
                                    !selectedWeeklyMenu
                                  }
                                  title={`Copy menu from ${formatDayName(
                                    selectedDayOfWeek
                                  )} to ${dayName}`}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditWeeklyMenu(menu)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDayOfWeek(dayOfWeek);
                                  handleCreateWeeklyMenu();
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>View all user transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Date</TableHead>
                      <TableHead className="text-center">User</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell className="font-medium text-center">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          {transaction.userId?.name || "Unknown User"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            {transaction.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.name} × {item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {formatCurrency(transaction.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ML Scan Tab */}
          <TabsContent value="ml-scan">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Food Photo</CardTitle>
                  <CardDescription>
                    Use rear camera to capture the plate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WebcamCapture
                    facingMode="environment"
                    onCapture={onFoodCaptured}
                    width={512}
                    height={384}
                    guidanceText="Ensure food is clearly visible"
                  />
                  <div className="mt-3">
                    <Label className="mb-1 block">Or upload from device</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFoodUpload}
                    />
                    {mlFoodFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {mlFoodFile.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Face Photo</CardTitle>
                  <CardDescription>
                    Use front camera to capture the user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WebcamCapture
                    facingMode="user"
                    onCapture={onFaceCaptured}
                    width={512}
                    height={384}
                    guidanceText="Position your face in the frame"
                  />
                  <div className="mt-3">
                    <Label className="mb-1 block">Or upload from device</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFaceUpload}
                    />
                    {mlFaceFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {mlFaceFile.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleMlScan} disabled={mlLoading}>
                {mlLoading ? "Processing..." : "Scan & Create Transaction"}
              </Button>
            </div>

            {mlResult && (
<<<<<<< HEAD
              <div className="space-y-6">
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detected Items</CardTitle>
                      <CardDescription>Raw model output</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {(mlResult.detected || []).map((d, i) => (
                          <div key={i} className="flex justify-between">
                            <span>
                              {d.class_name} ({(d.confidence * 100).toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                        {(!mlResult.detected ||
                          mlResult.detected.length === 0) && (
                            <p className="text-gray-500">No items detected</p>
                          )}
=======
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detected Items</CardTitle>
                    <CardDescription>Raw model output</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {(mlResult.detected || []).map((d, i) => (
                        <div key={i} className="flex justify-between">
                          <span>
                            {d.class_name} ({(d.confidence * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                      {(!mlResult.detected ||
                        mlResult.detected.length === 0) && (
                          <p className="text-gray-500">No items detected</p>
                        )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Matched Menu Items</CardTitle>
                    <CardDescription>
                      Used to create the transaction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {(mlResult.matchedItems || []).map((it, i) => (
                        <div key={i} className="flex justify-between">
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span>₹{it.price}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span>₹{mlResult.total || 0}</span>
>>>>>>> 3370ff6e679a4e70eb18df43c6b61239883f5310
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Matched Menu Items</CardTitle>
                      <CardDescription>
                        Used to create the transaction
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {(mlResult.matchedItems || []).map((it, i) => (
                          <div key={i} className="flex justify-between">
                            <span>
                              {it.name} × {it.quantity}
                            </span>
                            <span>₹{it.price}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                          <span>Total</span>
                          <span>₹{mlResult.total || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-blue-800">Recognized User</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="text-lg font-bold text-gray-900">{mlResult.recognizedUser?.name || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-gray-700">{mlResult.recognizedUser?.email || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Role</p>
                          <Badge variant="outline" className="capitalize">{mlResult.recognizedUser?.role || "User"}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Weekly Menu Dialog */}
        <Dialog
          open={isWeeklyMenuDialogOpen}
          onOpenChange={setIsWeeklyMenuDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedWeeklyMenu ? "Edit Weekly Menu" : "Create Weekly Menu"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="menu-day">Day of Week</Label>
                <Select
                  value={
                    weeklyMenuForm.dayOfWeek !== null
                      ? weeklyMenuForm.dayOfWeek.toString()
                      : ""
                  }
                  onValueChange={(value) =>
                    setWeeklyMenuForm((prev) => ({
                      ...prev,
                      dayOfWeek: parseInt(value),
                    }))
                  }
                  disabled={!!selectedWeeklyMenu}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDayNames().map((dayName, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {dayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {["breakfast", "lunch", "dinner"].map((mealType) => (
                <div key={mealType} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium capitalize">
                      {mealType}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`${mealType}-active`}
                        checked={weeklyMenuForm.meals[mealType].isActive}
                        onChange={(e) =>
                          setWeeklyMenuForm((prev) => ({
                            ...prev,
                            meals: {
                              ...prev.meals,
                              [mealType]: {
                                ...prev.meals[mealType],
                                isActive: e.target.checked,
                              },
                            },
                          }))
                        }
                      />
                      <Label htmlFor={`${mealType}-active`}>Active</Label>
                    </div>
                  </div>

                  {weeklyMenuForm.meals[mealType].isActive && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                          onChange={(e) => {
                            if (e.target.value) {
                              addItemToMeal(mealType, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">Select menu item to add</option>
                          {menuItems
                            .filter((item) => item.isAvailable)
                            .map((item) => (
                              <option key={item._id} value={item._id}>
                                {item.name} - {formatCurrency(item.price)}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        {weeklyMenuForm.meals[mealType].items.map(
                          (item, index) => {
                            // Check if menuItemId is already an object (populated from server)
                            // or if it's an ID that needs to be looked up
                            const menuItem = item.menuItemId?._id
                              ? item.menuItemId
                              : menuItems.find(
                                (m) => m._id === item.menuItemId
                              );

                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 border rounded"
                              >
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={item.isAvailable}
                                    onChange={(e) => {
                                      setWeeklyMenuForm((prev) => ({
                                        ...prev,
                                        meals: {
                                          ...prev.meals,
                                          [mealType]: {
                                            ...prev.meals[mealType],
                                            items: prev.meals[
                                              mealType
                                            ].items.map((itm, i) =>
                                              i === index
                                                ? {
                                                  ...itm,
                                                  isAvailable:
                                                    e.target.checked,
                                                }
                                                : itm
                                            ),
                                          },
                                        },
                                      }));
                                    }}
                                  />
                                  <span
                                    className={
                                      item.isAvailable
                                        ? ""
                                        : "line-through text-gray-500"
                                    }
                                  >
                                    {menuItem?.name || "Unknown item"} -{" "}
                                    {formatCurrency(menuItem?.price || 0)}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    removeItemFromMeal(mealType, index)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div>
                <Label htmlFor="special-notes">Special Notes</Label>
                <textarea
                  id="special-notes"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  placeholder="Any special notes for this day's menu..."
                  value={weeklyMenuForm.specialNotes}
                  onChange={(e) =>
                    setWeeklyMenuForm((prev) => ({
                      ...prev,
                      specialNotes: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsWeeklyMenuDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveWeeklyMenu}>
                  {selectedWeeklyMenu ? "Update" : "Create"} Menu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
