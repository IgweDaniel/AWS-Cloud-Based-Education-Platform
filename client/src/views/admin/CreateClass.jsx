import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../utils/fetch";
import { ENDPOINTS } from "@/constants";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, BookOpenCheck, Info } from "lucide-react";
import { ClipLoader } from "react-spinners";

// Form schema with validation rules
const formSchema = z.object({
  className: z.string().min(3, "Course name must be at least 3 characters"),
  department: z.string().min(1, "Department is required"),
  credits: z.string().min(1, "Credits are required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  schedule: z.string().min(1, "Schedule is required"),
});

export const CreateClass = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      className: "",
      department: "",
      credits: "",
      description: "",
      schedule: "",
    },
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await authenticatedFetch(ENDPOINTS.users.list);
        const users = await response.json();
        const filteredTeachers = users.filter(
          (user) => user.role === "TEACHER"
        );
        setTeachers(filteredTeachers);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };

    fetchTeachers();
  }, []);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");

      const response = await authenticatedFetch(ENDPOINTS.classes.create, {
        method: "POST",
        body: JSON.stringify({ courseName: data.className }),
      });

      if (!response.ok) {
        throw new Error("Failed to create class");
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/admin/courses");
      }, 1500);
    } catch (err) {
      setError(err.message || "An error occurred while creating the class");
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    "Computer Science",
    "Business",
    "Engineering",
    "Liberal Arts",
    "Mathematics",
    "Sciences",
    "Fine Arts",
    "Social Sciences",
  ];

  const creditOptions = ["1", "2", "3", "4", "5"];

  const scheduleOptions = [
    "Monday/Wednesday/Friday",
    "Tuesday/Thursday",
    "Monday/Wednesday",
    "Wednesday/Friday",
    "Weekends",
    "Online/Asynchronous",
  ];

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 campus-text-gradient">
            Create New Course
          </h1>
          <p className="text-muted-foreground">
            Add a new course to the university catalog
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>
                  Enter the details for the new university course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    {error && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
                        <AlertDescription>
                          Course created successfully! Redirecting...
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="className"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Introduction to Computer Science"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="credits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Hours</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select credits" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {creditOptions.map((credit) => (
                                  <SelectItem key={credit} value={credit}>
                                    {credit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="schedule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Schedule Pattern</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select schedule" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {scheduleOptions.map((schedule) => (
                                  <SelectItem key={schedule} value={schedule}>
                                    {schedule}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Description</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Provide a brief description of the course content and objectives..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="mr-2"
                        onClick={() => navigate("/admin/courses")}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <ClipLoader
                              size={18}
                              color="#fff"
                              className="mr-2"
                            />
                            Creating...
                          </>
                        ) : (
                          "Create Course"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="mr-2 h-5 w-5" /> Help & Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1 flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-primary" />
                    Course Naming
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use clear, descriptive names that reflect the content and
                    level of the course.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-1 flex items-center">
                    <BookOpenCheck className="mr-2 h-4 w-4 text-primary" />
                    Descriptions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Include learning objectives, topics covered, and any
                    prerequisites.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg mt-6">
                  <h3 className="font-medium mb-1">Next Steps</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    After creating the course:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start">
                      <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs mr-2 mt-0.5">
                        1
                      </span>
                      <span>Assign a faculty member</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs mr-2 mt-0.5">
                        2
                      </span>
                      <span>Set up course materials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs mr-2 mt-0.5">
                        3
                      </span>
                      <span>Open for student enrollment</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default CreateClass;
