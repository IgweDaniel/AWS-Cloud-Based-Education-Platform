import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authenticatedFetch } from "../../lib/fetch";
import { ENDPOINTS } from "../../constants/endpoint";

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
import { UserCheck, School } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { ROUTES } from "@/constants";

const AssignTeacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersResponse, classesResponse] = await Promise.all([
          authenticatedFetch(`${ENDPOINTS.users.list}?role=TEACHER`),
          authenticatedFetch(ENDPOINTS.courses.list),
        ]);

        const teachersData = await teachersResponse.json();
        const classesData = await classesResponse.json();

        setTeachers(teachersData);
        setCourses(classesData);
      } catch (error) {
        console.log("Failed to load data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await authenticatedFetch(
        ENDPOINTS.courses.update(selectedCourse),
        {
          method: "PUT",
          body: JSON.stringify({ teacherId: selectedTeacher }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign teacher");
      }

      toast.success("Teacher successfully assigned to the course");
      setTimeout(() => {
        navigate(ROUTES.COURSES);
      }, 1500);
    } catch (error) {
      console.log("Failed to assign teacher:", error);
      toast.error("Failed to assign teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find((t) => t.username === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "";
  };

  console.log({ classes: courses });

  return (
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
                  Select a course and assign a faculty member as the instructor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Course</label>
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem
                            key={course.courseId}
                            value={course.courseId}
                          >
                            {course.courseName}
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
                  onClick={() => navigate(ROUTES.COURSES)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedCourse || !selectedTeacher}
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
                {courses.filter(
                  (c) => c.teacherId && c.teacherId !== "UNASSIGNED"
                ).length > 0 ? (
                  <div className="space-y-4">
                    {courses
                      .filter(
                        (c) => c.teacherId && c.teacherId !== "UNASSIGNED"
                      )
                      .map((course) => (
                        <div
                          key={course.classId}
                          className="flex flex-col p-3 border rounded-md bg-muted/30"
                        >
                          <div className="font-medium">{course.className}</div>
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
  );
};

export default AssignTeacher;
