import { useState } from "react";
import { fetchUserAttributes, getCurrentUser, signIn } from "aws-amplify/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

import { Alert, AlertDescription } from "./ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { ClipLoader } from "react-spinners";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/context/auth";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(2),
});

const Login = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const { user, setUserSession } = useAuth();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      await signIn({
        username: form.getValues("email"),
        password: form.getValues("password"),
      });

      await setUserSession();
      console.log("naviagting to /dashboard");
      navigate("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <Card className="w-full max-w-md !p-[30px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="doe@mail.com" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} type="password" />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className=" mt-4">
              <Button type="submit" className="" size="lg" disabled={loading}>
                {loading ? <ClipLoader size={20} color="#fff" /> : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
