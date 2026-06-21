import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "register": {
        "almost_done": "Almost Done! 🎉",
        "location_enable_msg": "Your account has been created successfully! Now let's enable location access to help you connect with nearby blood requests and donors.",
        "registration_complete": "Registration Complete!",
        "account_created_success": "Your account has been successfully created",
        "create_account": "Create an Account",
        "join_network": "Join the Blood Donor Network",
        "full_name": "Full Name",
        "email_address": "Email Address",
        "password": "Password",
        "blood_group": "Blood Group",
        "select_blood_group": "Select Blood Group",
        "location": "Location",
        "account_type": "Account Type",
        "register_as_donor": "I want to register as a donor",
        "register_as_hospital": "I am registering on behalf of a hospital",
        "hospital_information": "Hospital Information",
        "already_have_account": "Already have an account?",
        "sign_in_here": "Sign in here",
        "with_location_access": " with location access",
        "helping_save_lives": "helping save lives by donating blood",
        "finding_blood_donors": "finding blood donors in your area",
        "redirecting": "Redirecting to login...",
        "john_doe": "John Doe",
        "john_example": "john@example.com",
        "city_area": "City, Area",
        "hospital_name": "Hospital Name",
        "hospital_address": "Hospital Full Address",
        "hospital_license": "Hospital License Number",
        "creating_account": "Creating Account..."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
