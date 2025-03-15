import { createContext, useContext, useState, useEffect } from "react";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useLocation } from "react-router-dom";
const AuthContext = createContext({});

// eslint-disable-next-line react/prop-types
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  useEffect(() => {
    checkUser();

    const hubListenerCancelToken = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          setUser(payload.data);
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
  }, [location.pathname]);

  async function checkUser() {
    try {
      const userData = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      // console.log({ attributes });
      setUser({ ...userData, role: attributes["custom:role"] });
    } catch (err) {
      setUser(null);
      console.error(err);
    }
    setLoading(false);
  }

  const value = {
    user,
    loading,
    logout: signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* {!loading && children} */}
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
