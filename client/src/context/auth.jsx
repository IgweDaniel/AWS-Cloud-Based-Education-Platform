import { createContext, useContext, useState, useEffect } from "react";
import {
  fetchUserAttributes,
  getCurrentUser,
  fetchAuthSession,
} from "aws-amplify/auth";
import { signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useLocation } from "react-router-dom";
import { HashLoader } from "react-spinners";
const AuthContext = createContext({});

// eslint-disable-next-line react/prop-types
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const location = useLocation();
  useEffect(() => {
    // checkUser();
    CheckSignedIn();
    const hubListenerCancelToken = Hub.listen("auth", async ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          // setUser(payload.data);
          // await checkUser();
          setSignedIn(true);
          console.log("user have been signedIn successfully.");
          break;
        case "signedOut":
          setUser(null);

          console.log("user have been signedOut successfully.");
          break;
        case "tokenRefresh":
          console.log("auth tokens have been refreshed.");
          break;
        case "tokenRefresh_failure":
          console.log("failure while refreshing auth tokens.");
          break;
        case "signInWithRedirect":
          console.log("signInWithRedirect API has successfully been resolved.");
          break;
        case "signInWithRedirect_failure":
          console.log(
            "failure while trying to resolve signInWithRedirect API."
          );
          break;

        case "customOAuthState":
          console.log("custom state returned from CognitoHosted UI");
          break;
      }
    });

    return () => {
      hubListenerCancelToken();
    };
  }, []);

  useEffect(() => {
    if (signedIn) {
      checkUser();
    }
  }, [signedIn]);

  async function CheckSignedIn() {
    try {
      await fetchAuthSession();
      setSignedIn(true);
    } catch (err) {
      console.error(err);
      setSignedIn(false);
      setLoading(false);
    }
  }
  async function checkUser() {
    try {
      await setUserSession();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function setUserSession() {
    try {
      const [userData, attributes] = await Promise.all([
        getCurrentUser(),
        fetchUserAttributes(),
      ]);

      // Extract common attributes from Cognito
      const userProfile = {
        ...userData,
        role: attributes["custom:role"],
        email: attributes.email,
        firstName: attributes.given_name || "",
        lastName: attributes.family_name || "",
        emailVerified: attributes.email_verified === "true",
        sub: attributes.sub,
        // Add creation date if available
        createdAt: attributes.created_at
          ? new Date(attributes.created_at)
          : new Date(),
        // Store all raw attributes for potential future use
        attributes: attributes,
      };

      setUser(userProfile);
      return userProfile;
    } catch (err) {
      setUser(null);
      throw err;
    }
  }

  const value = {
    user,
    loading,
    logout: signOut,
    setUserSession,
  };
  console.log({ user });

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-[#202124] text-white p-8 flex items-center justify-center">
          <HashLoader color="#FFF" size={30} />
        </div>
      ) : (
        children
      )}
      {/* {children} */}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
