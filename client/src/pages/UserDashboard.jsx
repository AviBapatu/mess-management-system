import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { transactionService } from "../services/transactionService";
import { getTodaysMenu } from "../services/weeklyMenuService";
import useAuthStore from "../store/authStore";

const UserDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todaysMenu, setTodaysMenu] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const { user, logout } = useAuthStore();

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await transactionService.getUserTransactions(user.id, {
        page,
        limit: pagination.limit,
      });

      setTransactions(response.data);
      setPagination(response.pagination);
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

  const fetchTodaysMenu = async () => {
    try {
      const response = await getTodaysMenu();
      setTodaysMenu(response.data);
    } catch (error) {
      // No menu for today, that's okay
      setTodaysMenu(null);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
      fetchTodaysMenu();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const handlePageChange = (page) => {
    fetchTransactions(page);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your meal history...</p>
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
                Welcome, {user?.name}
              </h1>
              <p className="text-gray-600">
                View your meal history and transactions
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <Card>
            <CardContent className="p-6 text-center">
              <CardDescription>Total Transactions</CardDescription>
              <CardTitle className="text-2xl mt-2">
                {pagination.total}
              </CardTitle>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CardDescription>Total Spent</CardDescription>
              <CardTitle className="text-2xl mt-2">
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + t.total, 0)
                )}
              </CardTitle>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CardDescription>Average Transaction</CardDescription>
              <CardTitle className="text-2xl mt-2">
                {formatCurrency(
                  transactions.length > 0
                    ? transactions.reduce((sum, t) => sum + t.total, 0) /
                        transactions.length
                    : 0
                )}
              </CardTitle>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CardDescription>Account Status</CardDescription>
              <CardTitle className="text-lg mt-2">
                <Badge variant="secondary" className="capitalize">
                  {user?.role}
                </Badge>
              </CardTitle>
            </CardContent>
          </Card>
        </div>

        {/* Today's Menu */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Today's Menu</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysMenu ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["breakfast", "lunch", "dinner"].map((mealType) => (
                  <div key={mealType} className="space-y-3">
                    <h3 className="text-lg font-medium capitalize text-center">
                      {mealType}
                    </h3>
                    {todaysMenu.meals[mealType]?.isActive &&
                    todaysMenu.meals[mealType]?.items?.length > 0 ? (
                      <div className="space-y-2">
                        {todaysMenu.meals[mealType].items
                          .filter((item) => item.isAvailable)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 border rounded-lg"
                            >
                              <span className="font-medium">
                                {item.menuItemId?.name || "Unknown item"}
                              </span>
                              <span className="text-green-600 font-semibold">
                                {formatCurrency(item.menuItemId?.price || 0)}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-gray-500">
                        <p>No items available</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No menu set for today</p>
                <p className="text-sm text-gray-400 mt-2">
                  Check back later or contact the mess administration
                </p>
              </div>
            )}
            {todaysMenu?.specialNotes && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  Special Notes
                </h4>
                <p className="text-blue-700">{todaysMenu.specialNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Meal History</CardTitle>
            <CardDescription>Your complete transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Your meal transactions will appear here
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Date</TableHead>
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
                          <div className="space-y-1">
                            {transaction.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{item.name}</span>
                                {item.quantity > 1 && (
                                  <span className="text-gray-500 ml-1">
                                    × {item.quantity}
                                  </span>
                                )}
                                <span className="text-gray-500 ml-2">
                                  {formatCurrency(item.price)}
                                </span>
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

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600">
                      Showing {(pagination.current - 1) * pagination.limit + 1}{" "}
                      to{" "}
                      {Math.min(
                        pagination.current * pagination.limit,
                        pagination.total
                      )}{" "}
                      of {pagination.total} transactions
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.current === 1}
                        onClick={() => handlePageChange(pagination.current - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.current === pagination.pages}
                        onClick={() => handlePageChange(pagination.current + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
