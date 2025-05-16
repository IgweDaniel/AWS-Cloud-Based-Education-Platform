import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Login from "./login";
import { useAuth } from "../context/auth";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  Users,
  Monitor,
  Calendar,
  Award,
  ArrowRight,
  Globe,
  Check,
  BarChart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case "TEACHER":
          navigate("/teacher-dashboard");
          break;
        case "STUDENT":
          navigate("/student-dashboard");
          break;
        case "SUPER_ADMIN":
          navigate("/admin-dashboard");
          break;
        default:
          navigate("/classes");
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is logged in, they'll be redirected by the useEffect above
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="campus-hero bg-gradient-to-br from-primary/20 via-background to-background">
        <div className="container mx-auto px-4 lg:px-8 pt-8 pb-20">
          {/* Navigation */}
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center">
              <GraduationCap className="h-10 w-10 text-primary mr-2" />
              <span className="text-xl font-bold campus-text-gradient">
                Campus Connect
              </span>
            </div>
            <div>
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => navigate("/about")}
              >
                About
              </Button>
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => navigate("/contact")}
              >
                Contact
              </Button>
              <Button onClick={() => navigate("/login")}>Sign In</Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Virtual Learning Platform</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Your Complete{" "}
                <span className="campus-text-gradient">
                  University Experience
                </span>
                , Now Online
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                Access courses, collaborate with classmates, and engage with
                professors in a unified digital campus environment designed for
                modern education.
              </p>
              <div className="space-x-4">
                <Button size="lg" onClick={() => navigate("/login")}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/tour")}
                >
                  Take a Tour
                </Button>
              </div>
            </div>
            <div className="hidden lg:flex justify-end">
              <div className="relative">
                <div className="w-[500px] h-[400px] rounded-xl bg-card shadow-2xl overflow-hidden border">
                  {/* Mockup screenshot of the platform */}
                  <div className="p-4 bg-primary text-primary-foreground flex items-center">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-sm font-medium">
                      Campus Connect Dashboard
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="h-24 rounded bg-muted/70 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-primary/60" />
                      </div>
                      <div className="h-24 rounded bg-muted/70 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-primary/60" />
                      </div>
                    </div>
                    <div className="h-12 mb-4 rounded bg-muted/50"></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-28 rounded bg-muted/40"></div>
                      <div className="h-28 rounded bg-muted/40"></div>
                      <div className="h-28 rounded bg-muted/40"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-36 h-36 rounded-full bg-primary/20 blur-2xl"></div>
                <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full bg-primary/10 blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need In One Platform
            </h2>
            <p className="text-muted-foreground text-lg">
              Our comprehensive education platform brings the entire university
              experience online, making learning more accessible, collaborative,
              and engaging.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                  <Monitor className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Live Virtual Classrooms
                </h3>
                <p className="text-muted-foreground">
                  Participate in real-time lectures, discussions, and
                  presentations with high-quality video and audio streaming.
                </p>
                <div className="mt-6 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>HD video conferencing</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>Interactive whiteboard</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>Session recordings</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Comprehensive Course Management
                </h3>
                <p className="text-muted-foreground">
                  Easily organize, access, and track all your course materials,
                  assignments, and grades in one central location.
                </p>
                <div className="mt-6 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>Digital syllabus</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>Assignment tracking</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>Automated grading</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Student-Faculty Collaboration
                </h3>
                <p className="text-muted-foreground">
                  Foster meaningful academic connections through direct
                  communication channels between students and professors.
                </p>
                <div className="mt-6 pt-4 border-t">
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>Discussion forums</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>Virtual office hours</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span>Group projects space</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Login />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-6">
                Access Your Campus Account
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Sign in to access your personalized dashboard, course materials,
                and connect with your academic community.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Student Access</h4>
                    <p className="text-sm text-muted-foreground">
                      View courses, assignments, and grades
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Faculty Portal</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage courses and student progress
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                    <BarChart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Administration Dashboard</h4>
                    <p className="text-sm text-muted-foreground">
                      Oversee institutional operations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Accessibility
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Updates
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Tutorials
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Support Center
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <GraduationCap className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold">Campus Connect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Campus Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
