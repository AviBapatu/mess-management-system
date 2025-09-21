import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Users, BarChart3, Shield } from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "User Management",
      description: "Secure user authentication with role-based access control",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics Dashboard",
      description:
        "Comprehensive analytics for revenue tracking and popular items",
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Transaction Tracking",
      description: "Complete meal history and transaction management",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Admin Portal",
      description:
        "Full administrative control over menu items and user transactions",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="text-2xl font-bold text-gray-900">
              Mess Management System
            </div>
            <div className="space-x-4">
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Streamline Your
            <span className="text-blue-600"> Mess Management</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            A comprehensive solution for managing meal transactions, tracking
            revenue, and providing insights with user and admin portals.
          </p>
          <div className="mt-10 space-x-4">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Powerful Features
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to manage your mess operations efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join our platform and streamline your mess management today
          </p>
          <div className="mt-8">
            <Link to="/signup">
              <Button size="lg" variant="secondary">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Mess Management System. Built with React and Node.js.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
