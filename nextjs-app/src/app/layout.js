import { AuthProvider } from "../context/AuthContext";
import { ToastContainer } from "react-toastify";
import SessionManager from "../components/SessionManager";
import ErrorBoundary from "../components/ErrorBoundary";
import NextAuthProvider from "../components/NextAuthProvider";
import "./globals.css";
import "../styles/gsap-animations.css";
import "../styles/swiper-carousel.css";
import "../styles/glassmorphism.css";
import "../styles/carousel.css";
import "react-toastify/dist/ReactToastify.css";

export const metadata = {
  title: "Blood Donor App",
  description: "Connect blood donors with those in need",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <NextAuthProvider>
            <AuthProvider>
              <SessionManager />
              {children}
              <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </AuthProvider>
          </NextAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
