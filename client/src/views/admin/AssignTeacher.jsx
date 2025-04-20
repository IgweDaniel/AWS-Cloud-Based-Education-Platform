import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/fetch";
import { ENDPOINTS } from "../../constants/endpoint";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCheck, School } from "lucide-react";
import { ClipLoader } from "react-spinners";

const AssignTeacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersResponse, classesResponse] = await Promise.all([
          authenticatedFetch(`${ENDPOINTS.users.list}?role=TEACHER`),
          authenticatedFetch(ENDPOINTS.classes.list),
        ]);

        const teachersData = await teachersResponse.json();
        const classesData = await classesResponse.json();

        setTeachers(teachersData);
        setClasses(classesData);
      } catch (error) {
        console.log("Failed to load data:", error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await authenticatedFetch(
        `${ENDPOINTS.classes.update}/${selectedClass}`,
        {
          method: "PUT",
          body: JSON.stringify({ teacherId: selectedTeacher }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign teacher");
      }

      setSuccess("Teacher successfully assigned to the course");
      setTimeout(() => {
        navigate("/admin/courses");
      }, 1500);
    } catch (error) {
      console.log("Failed to assign teacher:", error);
      setError("Failed to assign teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find((t) => t.username === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "";
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 campus-text-gradient">
            Assign Faculty to Courses
          </h1>
          <p className="text-muted-foreground">
            Designate faculty members as instructors for specific courses
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <ClipLoader size={40} color="#0f4c81" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Faculty Assignment</CardTitle>
                  <CardDescription>
                    Select a course and assign a faculty member as the
                    instructor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Select Course
                      </label>
                      <Select
                        value={selectedClass}
                        onValueChange={setSelectedClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((classItem) => (
                            <SelectItem
                              key={classItem.classId}
                              value={classItem.classId}
                            >
                              {classItem.className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Select Instructor
                      </label>
                      <Select
                        value={selectedTeacher}
                        onValueChange={setSelectedTeacher}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem
                              key={teacher.username}
                              value={teacher.username}
                            >
                              {teacher.firstName} {teacher.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/admin/courses")}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedClass || !selectedTeacher}
                  >
                    {submitting ? (
                      <>
                        <ClipLoader size={18} color="#fff" className="mr-2" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Assign Instructor
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Current Assignments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {classes.filter(
                    (c) => c.teacherId && c.teacherId !== "UNASSIGNED"
                  ).length > 0 ? (
                    <div className="space-y-4">
                      {classes
                        .filter(
                          (c) => c.teacherId && c.teacherId !== "UNASSIGNED"
                        )
                        .map((course) => (
                          <div
                            key={course.classId}
                            className="flex flex-col p-3 border rounded-md bg-muted/30"
                          >
                            <div className="font-medium">
                              {course.className}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <School className="h-3 w-3 mr-1" />
                              {course.teacherName ||
                                getTeacherName(course.teacherId)}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No courses have been assigned to faculty yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AssignTeacher;
