import { createContext, useContext, useState, useEffect } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const hubListenerCancelToken = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          setLoading(false);
          setUser(payload.data);

          console.log({ payload: payload });

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
          logger.info("custom state returned from CognitoHosted UI");
          break;
      }
    });

    return () => {
      hubListenerCancelToken();
    };
  }, []);

  async function checkUser() {
    try {
      const userData = await getCurrentUser();

      setUser(userData);
    } catch (err) {
      setUser(null);
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

export const useAuth = () => useContext(AuthContext);
