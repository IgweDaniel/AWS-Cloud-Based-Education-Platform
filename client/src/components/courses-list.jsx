import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { authenticatedFetch } from "../lib/fetch";
import { ENDPOINTS, getRouteWithParams, ROLES, ROUTES } from "../constants";

import CourseCard from "./course-card";
import { ClipLoader } from "react-spinners";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Search,
  SlidersHorizontal,
  Clock,
  Calendar,
  Users,
  GraduationCap,
  Building,
  School,
  BookMarked,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CourseList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [academicTerms, setAcademicTerms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
  });

  // Sorting options
  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "alpha", label: "Alphabetical (A-Z)" },
    { value: "popular", label: "Most Popular" },
  ];

  // Load academic metadata (terms, departments) and classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch class metadata (includes terms, departments, and stats)
        const metadataResponse = await authenticatedFetch(
          ENDPOINTS.courses.metadata
        );
        const metadata = await metadataResponse.json();

        setAcademicTerms([{ id: "all", name: "All Terms" }, ...metadata.terms]);

        setDepartments([
          { id: "all", name: "All Departments" },
          ...metadata.departments,
        ]);

        setCurrentTerm(metadata.currentTerm);
        setStats(metadata.stats);

        // Fetch classes
        const classesResponse = await authenticatedFetch(
          ENDPOINTS.courses.list
        );
        const classesData = await classesResponse.json();
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter and sort classes based on search term and filters
  const filteredClasses = classes
    .filter((classItem) => {
      // Filter by search term
      const searchMatch =
        searchTerm.trim() === "" ||
        classItem.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (classItem.description &&
          classItem.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (classItem.teacherName &&
          classItem.teacherName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      // Filter by term (all classes pass for now - would need term field in data)
      const termMatch = filter === "all" || classItem.termId === filter;

      // Filter by department (using department mapping from ClassCard)
      const departmentMatch =
        selectedDepartment === "all" ||
        classItem.departmentId === selectedDepartment;

      return searchMatch && termMatch && departmentMatch;
    })
    .sort((a, b) => {
      // Sort based on sortBy option
      if (sortBy === "alpha") {
        return a.courseName.localeCompare(b.courseName);
      } else if (sortBy === "popular") {
        return (b.studentCount || 0) - (a.studentCount || 0);
      }
      // Default to most recent
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="campus-gradient rounded-xl p-6 text-white shadow-lg mb-6">
        <div className="max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {user?.role === ROLES.STUDENT
              ? "My Enrolled Courses"
              : user?.role === ROLES.TEACHER
              ? "My Teaching Schedule"
              : "All University Courses"}
          </h1>
          <p className="text-white/80">
            {user?.role === ROLES.STUDENT
              ? "View your enrolled courses, access materials, and track your academic progress."
              : user?.role === ROLES.TEACHER
              ? "Manage your teaching schedule, course materials, and student interactions."
              : "Browse and manage all courses offered by the university."}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 pr-4 text-sm">
              <Calendar className="h-5 w-5 mr-2 text-white/70" />
              <span>{currentTerm?.name || "Academic Term"}</span>
            </div>

            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 pr-4 text-sm">
              <Clock className="h-5 w-5 mr-2 text-white/70" />
              <span>
                Week {currentTerm?.weekNumber || 0} of{" "}
                {currentTerm?.totalWeeks || 0}
              </span>
            </div>

            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-3 pr-4 text-sm">
              <GraduationCap className="h-5 w-5 mr-2 text-white/70" />
              <span>
                {user?.role === ROLES.STUDENT
                  ? `${filteredClasses.length} enrolled courses`
                  : user?.role === ROLES.TEACHER
                  ? `${filteredClasses.length} courses teaching`
                  : `${filteredClasses.length} total courses`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by name, code, or instructor..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Academic Term" />
            </SelectTrigger>
            <SelectContent>
              {academicTerms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} {term.current && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="h-10 w-10">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* University Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center pt-6">
            <div className="bg-primary/10 p-2 rounded-full mr-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Courses</p>
              <h3 className="text-2xl font-bold">
                {loading ? "-" : classes.length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center pt-6">
            <div className="bg-primary/10 p-2 rounded-full mr-4">
              <School className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Departments</p>
              <h3 className="text-2xl font-bold">
                {loading
                  ? "-"
                  : departments.length > 0
                  ? departments.length - 1
                  : 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center pt-6">
            <div className="bg-primary/10 p-2 rounded-full mr-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {user?.role === ROLES.STUDENT ? "Fellow Students" : "Students"}
              </p>
              <h3 className="text-2xl font-bold">
                {loading ? "-" : stats.totalStudents}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex items-center pt-6">
            <div className="bg-primary/10 p-2 rounded-full mr-4">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faculty Members</p>
              <h3 className="text-2xl font-bold">
                {loading ? "-" : stats.totalTeachers}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course List with Tabs */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <ClipLoader size={40} color="#0f4c81" />
          <span className="ml-4 text-lg text-muted-foreground">
            Loading courses...
          </span>
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {filteredClasses.length}{" "}
              {filteredClasses.length === 1 ? "Course" : "Courses"}
              {selectedDepartment !== "all" && (
                <Badge variant="outline" className="ml-2 bg-primary/5">
                  {departments.find((d) => d.id === selectedDepartment)?.name}
                </Badge>
              )}
              {filter !== "all" && (
                <Badge variant="outline" className="ml-2 bg-primary/5">
                  {academicTerms.find((t) => t.id === filter)?.name}
                </Badge>
              )}
            </h2>

            {user?.role === ROLES.SUPER_ADMIN && (
              <Button onClick={() => navigate(ROUTES.ADMIN_CREATE_COURSE)}>
                <BookMarked className="mr-2 h-4 w-4" />
                Create New Course
              </Button>
            )}
          </div>

          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((classItem) => (
                  <CourseCard
                    key={classItem.classId}
                    classItem={classItem}
                    userRole={user?.role}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="w-full">
              <Card>
                <div className="border-b px-4 py-3 font-medium text-sm grid grid-cols-12 gap-4">
                  <div className="col-span-5">Course Name</div>
                  <div className="col-span-3">Instructor</div>
                  <div className="col-span-2">Students</div>
                  <div className="col-span-2">Status</div>
                </div>
                {filteredClasses.map((classItem) => (
                  <div
                    key={classItem.classId}
                    className="px-4 py-3 text-sm grid grid-cols-12 gap-4 border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      navigate(
                        getRouteWithParams(ROUTES.COURSE_DETAIL, {
                          courseId: classItem.courseId,
                        })
                      )
                    }
                  >
                    <div className="col-span-5 font-medium">
                      {classItem.courseName}
                    </div>
                    <div className="col-span-3 text-muted-foreground">
                      {classItem.teacherName}
                    </div>
                    <div className="col-span-2">
                      {classItem.studentCount || 0} enrolled
                    </div>
                    <div className="col-span-2">
                      {classItem.activeMeetingId ? (
                        <Badge className="bg-green-100 text-green-800">
                          Live Now
                        </Badge>
                      ) : (
                        <Badge variant="outline">Scheduled</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-lg mb-2">No Courses Found</CardTitle>
            <CardDescription className="max-w-sm mx-auto mb-6">
              {searchTerm || filter !== "all" || selectedDepartment !== "all"
                ? "No courses match your search criteria. Try adjusting your search terms or filters."
                : user?.role === ROLES.STUDENT
                ? "You are not enrolled in any courses yet."
                : user?.role === ROLES.TEACHER
                ? "You have not been assigned any courses to teach yet."
                : "There are no courses created in the system yet."}
            </CardDescription>
            {user?.role === ROLES.STUDENT && (
              <Button onClick={() => navigate(ROUTES.COURSES)}>
                Browse Available Courses
              </Button>
            )}
            {user?.role === ROLES.TEACHER && (
              <Button onClick={() => navigate(ROUTES.DASHBOARD)}>
                Return to Dashboard
              </Button>
            )}
            {user?.role === ROLES.SUPER_ADMIN && (
              <Button onClick={() => navigate(ROUTES.ADMIN_CREATE_COURSE)}>
                Create New Course
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseList;
