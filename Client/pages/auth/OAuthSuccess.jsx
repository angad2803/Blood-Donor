import { useEffect, useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";
import { useTranslation } from "react-i18next";

const OAuthSuccess = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Fetch user data and store in context
      api.defaults.headers.common["Authorization"] = `Bearer ${tokenFromUrl}`;
      api
        .get("/user/me")
        .then(async (res) => {
          const user = res.data.user;
          setUserData(user);
          loginWithToken(tokenFromUrl, user);

          navigateBasedOnUserStatus(user);
        })
        .catch(() => {
          // If user fetch fails, still store token and navigate
          localStorage.setItem("token", tokenFromUrl);
          navigate("/complete-profile");
        });
    } else {
      navigate("/login");
    }
  }, [navigate, loginWithToken]);

  const navigateBasedOnUserStatus = (user) => {
    // Check if user needs to select account type (new OAuth users)
    if (user.needsAccountTypeSelection) {
      navigate("/account-type-selection");
    }
    // Check if user needs to complete profile (from OAuth with default values)
    else if (user.bloodGroup === "O+" && user.location === "Unknown") {
      navigate("/complete-profile");
    } else {
      navigate("/dashboard");
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">{t("oauth.setting_up_account", "Setting up your account...")}</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
