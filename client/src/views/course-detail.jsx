import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../lib/fetch";
import { useAuth } from "../context/auth";
import { ENDPOINTS, getRouteWithParams, ROLES, ROUTES } from "../constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipLoader } from "react-spinners";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Users,
  Video,
  CheckCircle2,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const getResourceUrl = (resource) => {
  // If it's an external URL (contains http:// or https://)
  if (
    resource.url &&
    (resource.url.startsWith("http://") || resource.url.startsWith("https://"))
  ) {
    return resource.url;
  }

  // If it's a file key, construct the S3 URL
  if (resource.fileKey) {
    return `${import.meta.env.VITE_UPLOAD_BASE_URL}/${resource.fileKey}`;
  }

  // Fallback to whatever URL is stored
  return resource.url;
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resourceError, setResourceError] = useState(null);
  const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resourceAddError, setResourceAddError] = useState(null);
  const [resourceSuccess, setResourceSuccess] = useState(null);
  const [deletingResourceId, setDeletingResourceId] = useState(null);

  const startMeeting = async () => {
    try {
      const response = await authenticatedFetch(ENDPOINTS.meetings.create, {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      if (!response.ok) {
        throw new Error("Failed to start meeting");
      }
      navigate(
        getRouteWithParams(ROUTES.MEET, {
          courseId,
        })
      );
    } catch (error) {
      console.error("Error starting meeting:", error);
    }
  };

  // Fetch course details
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const response = await authenticatedFetch(
          ENDPOINTS.courses.details(courseId)
        );
        if (!response.ok) {
          throw new Error("Failed to fetch class details");
        }
        const data = await response.json();
        setClassData(data);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [courseId]);

  // Fetch course resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setResourcesLoading(true);
        const response = await authenticatedFetch(
          ENDPOINTS.courses.resources.list(courseId)
        );
        if (!response.ok) {
          throw new Error("Failed to fetch resources");
        }
        const data = await response.json();
        setResources(data);
      } catch (err) {
        console.error("Error fetching resources:", err);
        setResourceError(err.message);
      } finally {
        setResourcesLoading(false);
      }
    };

    fetchResources();
  }, [courseId]);

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";

    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    else return (bytes / 1073741824).toFixed(1) + " GB";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";

    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getFileTypeFromName = (fileName) => {
    if (!fileName) return "file";

    const extension = fileName.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return "pdf";
      case "doc":
      case "docx":
        return "doc";
      case "ppt":
      case "pptx":
        return "ppt";
      case "xls":
      case "xlsx":
        return "xls";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "image";
      case "mp4":
      case "mov":
      case "avi":
        return "video";
      default:
        return "file";
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();

    setIsUploading(true);
    setResourceAddError(null);

    try {
      let resourceData = { ...newResource };

      // If a file was selected, upload it first
      if (uploadFile) {
        // 1. Get a pre-signed URL from the server
        const uploadUrlResponse = await authenticatedFetch(
          ENDPOINTS.courses.resources.uploadUrl,
          {
            method: "POST",
            body: JSON.stringify({
              fileName: uploadFile.name,
              fileType: uploadFile.type,
              courseId: courseId,
            }),
          }
        );

        if (!uploadUrlResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl, fileKey } = await uploadUrlResponse.json();

        // 2. Upload the file directly to S3 using the pre-signed URL
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: uploadFile,
          headers: {
            "Content-Type": uploadFile.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        // 3. Create resource with file information
        resourceData = {
          ...resourceData,
          fileKey: fileKey,
          // The URL will be properly constructed on the backend
          url: fileKey, // The backend will handle the full URL
          type: getFileTypeFromName(uploadFile.name),
          size: uploadFile.size,
        };
      }

      // Create the resource in the database
      const createResponse = await authenticatedFetch(
        ENDPOINTS.courses.resources.create(courseId),
        {
          method: "POST",
          body: JSON.stringify(resourceData),
        }
      );

      if (!createResponse.ok) {
        throw new Error("Failed to create resource");
      }

      // Get the created resource and add it to the state
      const createdResource = await createResponse.json();
      setResources([...resources, createdResource]);

      // Reset form and close dialog
      setNewResource({ title: "", description: "", url: "" });
      setUploadFile(null);
      setIsAddResourceDialogOpen(false);
      setResourceSuccess("Resource added successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setResourceSuccess(null), 3000);
    } catch (err) {
      console.error("Error adding resource:", err);
      setResourceAddError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    setDeletingResourceId(resourceId);

    try {
      const response = await authenticatedFetch(
        ENDPOINTS.courses.resources.delete(courseId, resourceId),
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      // Remove the resource from the state
      setResources(
        resources.filter((resource) => resource.resourceId !== resourceId)
      );
      setResourceSuccess("Resource deleted successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setResourceSuccess(null), 3000);
    } catch (err) {
      console.error("Error deleting resource:", err);
      setResourceError(err.message);

      // Clear error after 3 seconds
      setTimeout(() => setResourceError(null), 3000);
    } finally {
      setDeletingResourceId(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);

      // Auto-fill title with file name without extension if title is empty
      if (!newResource.title) {
        const fileName = e.target.files[0].name;
        const titleWithoutExtension = fileName
          .split(".")
          .slice(0, -1)
          .join(".");
        setNewResource({
          ...newResource,
          title: titleWithoutExtension || fileName,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ClipLoader size={40} color="#0f4c81" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center">
        <div className="text-destructive text-xl mb-4">Error</div>
        <div className="text-foreground">{error}</div>
      </div>
    );
  }

  const isTeacher =
    user.role === ROLES.TEACHER && classData.teacherId === user.userId;
  const canManageResources = isTeacher || user.role === ROLES.SUPER_ADMIN;

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold campus-text-gradient">
                {classData.courseName}
              </h1>
              {classData.activeMeetingId && (
                <Badge variant="success" className="text-xs">
                  Live Now
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-2">
              Course ID: {classData.courseId}
            </p>
          </div>

          <div className="flex gap-2">
            {isTeacher && (
              <Button
                onClick={
                  classData.activeMeetingId
                    ? () =>
                        navigate(
                          getRouteWithParams(ROUTES.MEET, {
                            courseId,
                          })
                        )
                    : startMeeting
                }
                className={
                  classData.activeMeetingId
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                }
                size="sm"
              >
                {classData.activeMeetingId ? (
                  <>
                    <Video className="mr-2 h-4 w-4" /> Join Active Session
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" /> Start Session
                  </>
                )}
              </Button>
            )}

            {!isTeacher && classData.activeMeetingId && (
              <Button
                onClick={() =>
                  navigate(
                    getRouteWithParams(ROUTES.MEET, {
                      courseId,
                    })
                  )
                }
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Video className="mr-2 h-4 w-4" /> Join Live Session
              </Button>
            )}
          </div>
        </div>

        {/* Course meta information */}
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span className="font-medium mr-1">Instructor:</span>{" "}
            {classData.teacherName || "Unassigned"}
          </div>
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span className="font-medium mr-1">Students:</span>{" "}
            {classData.studentCount || 0} enrolled
          </div>
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span className="font-medium mr-1">Schedule:</span> MWF 10:00-11:30
            AM
          </div>
        </div>
      </div>

      {/* Content Tabs - Simplified to focus on live meeting */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:w-auto w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Focused on meeting status */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                Course Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classData.activeMeetingId ? (
                <div className="bg-success/10 border border-success/20 text-success-foreground p-4 rounded-md">
                  <div className="flex items-center">
                    <div className="p-1.5 bg-success/20 rounded-full mr-3">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <div className="font-medium">Live Class in Progress</div>
                      <p className="text-sm text-muted-foreground">
                        Join the current session to participate in the lecture.
                      </p>
                    </div>
                    <Button
                      className="ml-auto"
                      size="sm"
                      onClick={() =>
                        navigate(
                          getRouteWithParams(ROUTES.MEET, {
                            courseId,
                          })
                        )
                      }
                    >
                      Join Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 border border-border p-4 rounded-md">
                  <div className="flex items-center">
                    <div className="p-1.5 bg-muted rounded-full mr-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">No Active Session</div>
                      <p className="text-sm text-muted-foreground">
                        Check back later for the next scheduled session or start
                        a new one.
                      </p>
                    </div>
                    {isTeacher && (
                      <Button
                        className="ml-auto"
                        size="sm"
                        onClick={startMeeting}
                      >
                        Start Session
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students list - Simple version */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Enrolled Students</CardTitle>

              {user.role == ROLES.SUPER_ADMIN && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(
                      getRouteWithParams(ROUTES.ADMIN_MANAGE_STUDENTS, {
                        courseId,
                      })
                    )
                  }
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Students
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {classData.students && classData.students.length > 0 ? (
                <div className="divide-y">
                  {classData.enrolledStudents.map(
                    ({ id, firstName, lastName }, index) => (
                      <div key={index} className="py-3 flex items-center">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3">
                          <span className="font-medium text-sm">
                            {(firstName && lastName
                              ? firstName.charAt(0).toUpperCase() +
                                lastName.charAt(0).toUpperCase()
                              : firstName
                              ? firstName.substring(0, 2).toUpperCase()
                              : lastName
                              ? lastName.substring(0, 2).toUpperCase()
                              : id.substring(0, 2).toUpperCase()
                            )
                              .substring(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">{`${firstName} ${lastName}`}</div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No students enrolled in this course.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab - Now showing real resources */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Course Resources</CardTitle>
                {canManageResources && (
                  <Button
                    size="sm"
                    onClick={() => setIsAddResourceDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {resourceSuccess && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{resourceSuccess}</AlertDescription>
                </Alert>
              )}

              {resourceError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{resourceError}</AlertDescription>
                </Alert>
              )}

              {resourcesLoading ? (
                <div className="flex justify-center py-8">
                  <ClipLoader size={30} color="#0f4c81" />
                </div>
              ) : resources.length > 0 ? (
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <div
                      key={resource.resourceId}
                      className="flex items-center p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 bg-primary/10 rounded-full mr-3">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium">{resource.title}</h3>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {resource.description}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {resource.type && `${resource.type.toUpperCase()} • `}
                          {resource.size &&
                            `${formatFileSize(resource.size)} • `}
                          Added {formatDate(resource.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(getResourceUrl(resource), "_blank")
                          }
                        >
                          Download
                        </Button>

                        {canManageResources && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            onClick={() =>
                              handleDeleteResource(resource.resourceId)
                            }
                            disabled={
                              deletingResourceId === resource.resourceId
                            }
                          >
                            {deletingResourceId === resource.resourceId ? (
                              <ClipLoader size={16} color="#ef4444" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No resources available for this course.
                  {canManageResources && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddResourceDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Resource
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Resource Dialog */}
      <Dialog
        open={isAddResourceDialogOpen}
        onOpenChange={setIsAddResourceDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Course Resource</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddResource} className="space-y-4">
            {resourceAddError && (
              <Alert variant="destructive">
                <AlertDescription>{resourceAddError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newResource.title}
                onChange={(e) =>
                  setNewResource({ ...newResource, title: e.target.value })
                }
                placeholder="Resource title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newResource.description}
                onChange={(e) =>
                  setNewResource({
                    ...newResource,
                    description: e.target.value,
                  })
                }
                placeholder="Describe this resource"
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Choose an option</Label>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div
                  className={`border rounded-md p-4 ${
                    !uploadFile ? "bg-muted/50" : ""
                  }`}
                >
                  <Label htmlFor="file" className="block mb-2 font-medium">
                    Upload a file
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="mb-2"
                  />
                  {uploadFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {uploadFile.name} (
                      {formatFileSize(uploadFile.size)})
                    </p>
                  )}
                </div>

                <div
                  className={`border rounded-md p-4 ${
                    uploadFile ? "bg-muted/50" : ""
                  }`}
                >
                  <Label htmlFor="url" className="block mb-2 font-medium">
                    Or provide a URL
                  </Label>
                  <Input
                    id="url"
                    value={newResource.url}
                    onChange={(e) =>
                      setNewResource({ ...newResource, url: e.target.value })
                    }
                    placeholder="https://"
                    disabled={!!uploadFile}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddResourceDialogOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isUploading ||
                  (!uploadFile && !newResource.url) ||
                  !newResource.title
                }
              >
                {isUploading ? (
                  <>
                    <ClipLoader size={16} color="#fff" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Add Resource"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;
