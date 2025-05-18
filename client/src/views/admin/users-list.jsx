import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../../lib/fetch";
import { ENDPOINTS, getRouteWithParams, ROLES, ROUTES } from "../../constants";
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
import { ClipLoader } from "react-spinners";

const ALL_FILTER = "all";

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");

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
                  onClick={() =>
                    navigate(
                      getRouteWithParams(ROUTES.ADMIN_EDIT_USER, {
                        userId: user.id,
                      })
                    )
                  }
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
