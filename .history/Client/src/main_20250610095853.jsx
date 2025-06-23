import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/theme";
import App from "./App.jsx";
import { AuthProvider } from "../context/AuthContext";

// Soft hospital theme
const theme = extendTheme({
  colors: {
    brand: {
      50: "#e3fdfd",
      100: "#cbf1f1",
      200: "#a6e3e9",
      300: "#71c9ce",
      400: "#39a2ae",
      500: "#297a7e",
      600: "#206568",
      700: "#174e52",
      800: "#0d383b",
      900: "#032224",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
