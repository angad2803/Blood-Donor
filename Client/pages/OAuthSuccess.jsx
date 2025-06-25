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
          loginWithToken(token, res.data.user);
          navigate("/dashboard");
        })
        .catch(() => {
          // If user fetch fails, still store token and navigate
          localStorage.setItem("token", token);
          navigate("/dashboard");
        });
    } else {
      navigate("/login");
    }
  }, [navigate, loginWithToken]);

  return <p>Logging you in...</p>;
};

export default OAuthSuccess;
