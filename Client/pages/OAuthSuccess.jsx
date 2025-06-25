import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

const OAuthSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      // Fetch user data and store in context
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api
        .get("/user/me")
        .then((res) => {
          const userData = res.data.user;
          loginWithToken(token, userData);

          // Check if user needs to complete profile (from OAuth with default values)
          if (userData.bloodGroup === "O+" && userData.location === "Unknown") {
            navigate("/complete-profile");
          } else {
            navigate("/dashboard");
          }
        })
        .catch(() => {
          // If user fetch fails, still store token and navigate
          localStorage.setItem("token", token);
          navigate("/complete-profile");
        });
    } else {
      navigate("/login");
    }
  }, [navigate, loginWithToken]);

  return <p>Logging you in...</p>;
};

export default OAuthSuccess;
