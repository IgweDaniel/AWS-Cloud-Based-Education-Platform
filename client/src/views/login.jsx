import { useState } from "react";
import { signIn } from "aws-amplify/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { ClipLoader } from "react-spinners";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/context/auth";
import { GraduationCap, Info } from "lucide-react";
import { ROUTES } from "@/constants";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(2, "Password is required"),
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
      setError("");

      await signIn({
        username: form.getValues("email"),
        password: form.getValues("password"),
      });

      await setUserSession();
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background campus-hero flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold campus-text-gradient">
            CBEP University
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Virtual Learning Platform
          </p>
        </div>

        <Card className="w-full backdrop-blur-sm bg-card/90 shadow-lg border-primary/10">
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
                          <Input
                            placeholder="university@email.edu"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
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
              <CardFooter className="flex flex-col">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? <ClipLoader size={20} color="#fff" /> : "Sign In"}
                </Button>
                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <Info className="h-3 w-3 mr-1" />
                  <span>
                    Default logins: student@example.com, teacher@example.com
                    (pw: password)
                  </span>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} CBEP University. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
