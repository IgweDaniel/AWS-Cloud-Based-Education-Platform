import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, UserMinus, Users, ArrowLeft } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { getRouteWithParams, ROUTES } from "@/constants";

const ManageStudents = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [courseData, setCourseData] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [unerollingStudentId, setUnerollingStudentId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrolledResponse, availableResponse, courseResponse] =
          await Promise.all([
            authenticatedFetch(ENDPOINTS.courses.details(courseId)),
            authenticatedFetch(`${ENDPOINTS.users.list}?role=STUDENT`),
            authenticatedFetch(ENDPOINTS.courses.details(courseId)),
          ]);

        const enrolledData = await enrolledResponse.json();
        const availableData = await availableResponse.json();
        const courseDetails = await courseResponse.json();

        // console.log({ enrolledData });

        setCourseData(courseDetails);
        setStudents(enrolledData.enrolledStudents || []);
        setAvailableStudents(
          availableData.filter(
            (student) => !enrolledData.students?.includes(student.username)
          )
        );
      } catch (error) {
        console.log("Failed to load students:", error);
        setError("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!selectedStudent) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        ENDPOINTS.courses.enroll(courseId),
        {
          method: "POST",
          body: JSON.stringify({ studentId: selectedStudent }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to enroll student");
      }

      const student = await response.json();
      // Optimistic update
      setStudents([...students, student]);
      setAvailableStudents(
        availableStudents.filter((s) => s.username !== selectedStudent)
      );
      setSelectedStudent("");
      setSuccess("Student successfully enrolled");

      // Clear success message after timeout
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to enroll student:", error);
      setError("Failed to enroll student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (studentId) => {
    setIsRemoving(true);
    setError(null);
    setUnerollingStudentId(studentId);
    try {
      const response = await authenticatedFetch(
        ENDPOINTS.courses.removeStudent(courseId),
        {
          method: "DELETE",
          body: JSON.stringify({ studentId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove student");
      }

      // Optimistic update
      const idx = students.findIndex(({ id }) => id === studentId);
      let removedStudent = null;
      if (idx !== -1) {
        removedStudent = students[idx];
        setStudents([...students.slice(0, idx), ...students.slice(idx + 1)]);
      }

      if (removedStudent) {
        setAvailableStudents([...availableStudents, removedStudent]);
      }

      setSuccess("Student successfully removed");

      // Clear success message after timeout
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to remove student:", error);
      setError("Failed to remove student");
    } finally {
      setIsRemoving(false);
      setUnerollingStudentId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ClipLoader size={40} color="#0f4c81" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-2 campus-text-gradient">
        Manage Enrollment
      </h1>
      <div>
        <h2 className="text-2xl font-bold mb-2 campus-text-gradient">
          {courseData?.courseName ? `${courseData.courseName}` : "Course"}
        </h2>
        <p className="text-muted-foreground">
          Add or remove students from this course{" "}
          {courseData?.courseId ? `(ID: ${courseData.courseId})` : ""}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enroll Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Add Students
            </CardTitle>
            <CardDescription>Enroll students in this course</CardDescription>
          </CardHeader>
          <CardContent>
            {availableStudents.length > 0 ? (
              <div className="space-y-4">
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.map((student) => (
                      <SelectItem
                        key={student.username}
                        value={student.username}
                      >
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                All students are already enrolled
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleEnroll}
              disabled={!selectedStudent || submitting}
              className="w-full"
            >
              {submitting ? (
                <ClipLoader size={20} color="#fff" />
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll Student
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Enrolled Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Enrolled Students
            </CardTitle>
            <CardDescription>
              {students.length} student{students.length !== 1 ? "s" : ""} in
              this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.length > 0 ? (
                students.map(({ id: studentId, firstName, lastName }) => (
                  <div
                    key={studentId}
                    className="flex justify-between items-center p-3 border rounded-md"
                  >
                    <div>{`${firstName} ${lastName}`}</div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(studentId)}
                      disabled={isRemoving}
                    >
                      {isRemoving && unerollingStudentId == studentId ? (
                        <ClipLoader size={20} color="#fff" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No students enrolled yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() =>
            navigate(
              getRouteWithParams(ROUTES.COURSES, {
                courseId,
              })
            )
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
      </div>
    </div>
  );
};

export default ManageStudents;
