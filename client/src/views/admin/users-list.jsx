import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../lib/fetch";
import { ENDPOINTS, ROLES, ROUTES } from "../../constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClipLoader } from "react-spinners";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const ALL_FILTER = "all";

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const endpoint =
          roleFilter == ALL_FILTER
            ? `${ENDPOINTS.users.list}?role=${roleFilter}`
            : ENDPOINTS.users.list;

        const response = await authenticatedFetch(endpoint);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [roleFilter]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    try {
      const response = await authenticatedFetch(ENDPOINTS.users.delete, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Remove user from the list
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeletingUser(false);
    }
  };

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-12">
        <ClipLoader size={30} color="#0f4c81" />
      </div>
    );
  if (error) return <div>{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Select onValueChange={setRoleFilter} value={roleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All Roles</SelectItem>
            <SelectItem value={ROLES.TEACHER}>Teachers</SelectItem>
            <SelectItem value={ROLES.STUDENT}>Students</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => navigate(ROUTES.ADMIN_CREATE_USER)}>
          Add New User
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.username}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getRoleBadgeColor(user.role)}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(user)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deletingUser}
        onConfirm={handleDeleteUser}
        icon={Trash2}
      />
    </div>
  );
};

const getRoleBadgeColor = (role) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return "bg-red-100 text-red-800 border-red-300";
    case ROLES.TEACHER:
      return "bg-green-100 text-green-800 border-green-300";
    case ROLES.STUDENT:
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export default UsersList;
