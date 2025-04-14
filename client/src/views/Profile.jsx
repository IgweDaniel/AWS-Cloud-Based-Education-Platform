import { useState, useEffect } from "react";
import { useAuth } from "../context/auth";
import DashboardLayout from "../components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
import { authenticatedFetch } from "@/utils/fetch";
import { ENDPOINTS } from "@/constants/endpoint";

export const Profile = () => {
  const { user, setUserSession } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", content: "" });
  const [userStats, setUserStats] = useState({
    student: {
      enrolledCourses: 0,
      completedCourses: 0,
      gpa: 0,
    },
    teacher: {
      coursesTeaching: 0,
      totalStudents: 0,
      facultySince: new Date().getFullYear(),
    },
  });
  const [loading, setLoading] = useState(false);

  // Format join date from user profile data or current date as fallback
  const formatJoinDate = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return new Date().toLocaleDateString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Load user statistics based on role
  useEffect(() => {
    if (!user) return;

    const fetchUserStats = async () => {
      setLoading(true);
      try {
        // Different endpoints based on user role
        if (user.role === "STUDENT") {
          // In a real app, you would fetch actual student data
          // For demo purposes, we're just using mock data for now
          setUserStats((prev) => ({
            ...prev,
            student: {
              enrolledCourses: 3,
              completedCourses: 7,
              gpa: 3.7,
            },
          }));
        } else if (user.role === "TEACHER") {
          // In a real app, fetch actual teacher data
          setUserStats((prev) => ({
            ...prev,
            teacher: {
              coursesTeaching: 4,
              totalStudents: 124,
              facultySince: 2022,
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Updated handleSubmit with profile update logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, you would update the profile via API
      // For example:
      // await authenticatedFetch(ENDPOINTS.users.updateProfile, {
      //   method: "PUT",
      //   body: JSON.stringify({
      //     firstName: formData.firstName,
      //     lastName: formData.lastName
      //   })
      // });

      // For now, just simulate success and refresh user session
      setMessage({
        type: "success",
        content: "Profile updated successfully",
      });

      // Refresh user session to get updated data
      await setUserSession();

      setIsEditing(false);
    } catch (err) {
      setMessage({
        type: "error",
        content: err.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);

      // Clear message after delay
      setTimeout(() => {
        setMessage({ type: "", content: "" });
      }, 3000);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800 border-red-300";
      case "TEACHER":
        return "bg-green-100 text-green-800 border-green-300";
      case "STUDENT":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-4xl mx-auto">
        {message.content && (
          <Alert
            className={
              message.type === "success"
                ? "bg-green-50 text-green-800 border-green-200 mb-6"
                : "bg-red-50 text-red-800 border-red-200 mb-6"
            }
          >
            <AlertDescription>{message.content}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center pb-2">
              <div className="h-24 w-24 rounded-full bg-primary mx-auto flex items-center justify-center text-primary-foreground text-4xl font-medium mb-4">
                {user?.firstName?.[0]}
              </div>
              <CardTitle className="text-xl">
                {user?.firstName} {user?.lastName}
              </CardTitle>
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 border"
                style={{ backgroundColor: getRoleBadgeColor(user?.role) }}
              >
                {user?.role?.replace("_", " ")}
              </div>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-1 mt-2">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
              <p className="flex items-center justify-center gap-1 mt-2">
                <Calendar className="h-4 w-4" />
                Joined {formatJoinDate()}
              </p>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>
                View and update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Account Role</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50">
                    <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                    {user?.role?.replace("_", " ")}
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: user?.firstName || "",
                        lastName: user?.lastName || "",
                        email: user?.email || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleSubmit}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </CardFooter>
          </Card>

          {/* Additional cards based on user role */}
          {user?.role === "STUDENT" && (
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Enrolled Courses</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {userStats.student.enrolledCourses}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Completed Courses</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {userStats.student.completedCourses}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center mb-2">
                      <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Current GPA</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {userStats.student.gpa}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {user?.role === "TEACHER" && (
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Teaching Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center mb-2">
                      <BookOpen className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Courses Teaching</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {userStats.teacher.coursesTeaching}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Total Students</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {userStats.teacher.totalStudents}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Faculty Since</h3>
                    </div>
                    <p className="text-2xl font-bold">
                      {userStats.teacher.facultySince}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
