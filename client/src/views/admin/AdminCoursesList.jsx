import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { authenticatedFetch } from "../../utils/fetch";
import { useNavigate } from "react-router-dom";
import ClassCard from "../../components/ClassCard";
import { ENDPOINTS } from "../../constants";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { ClipLoader } from "react-spinners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked } from "lucide-react";

export const AdminCoursesList = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(ENDPOINTS.classes.list);
        const data = await response.json();
        setClasses(data);
      } catch (err) {
        setError("Failed to load classes");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex justify-center items-center py-12">
          <ClipLoader size={30} color="#0f4c81" />
        </div>
      </AdminDashboardLayout>
    );
  }

  if (error) {
    return (
      <AdminDashboardLayout>
        <div className="text-center py-8 text-destructive">{error}</div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold campus-text-gradient">
            University Courses
          </h1>
          {user?.role === "SUPER_ADMIN" && (
            <Button onClick={() => navigate("/admin/create-course")}>
              <BookMarked className="mr-2 h-4 w-4" />
              Create New Course
            </Button>
          )}
        </div>

        {classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.classId}
                classItem={classItem}
                userRole={user.role}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Courses Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              No courses are currently available.
              {user?.role === "SUPER_ADMIN" && (
                <div className="mt-4">
                  <Button onClick={() => navigate("/admin/create-course")}>
                    Create Your First Course
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCoursesList;
