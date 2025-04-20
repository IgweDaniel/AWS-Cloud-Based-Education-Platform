import { useState, useEffect } from "react";
import { useAuth } from "../context/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckCircle,
} from "lucide-react";
import { ClipLoader } from "react-spinners";

export const Profile = () => {
  const { user } = useAuth();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <ClipLoader size={30} color="#0f4c81" />
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto">
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

        {/* Account Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">First Name</p>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {user?.firstName}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Last Name</p>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {user?.lastName}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Email</p>
                <div className="p-2 border rounded-md bg-muted/50">
                  {user?.email}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Account Role</p>
                <div className="flex items-center p-2 border rounded-md bg-muted/50">
                  <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                  {user?.role?.replace("_", " ")}
                </div>
              </div>
            </div>
          </CardContent>
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
                  <p className="text-2xl font-bold">{userStats.student.gpa}</p>
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
  );
};

export default Profile;
