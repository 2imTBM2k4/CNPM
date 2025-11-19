import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import StoreContextProvider from "./context/StoreContext.jsx";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StoreContextProvider>
      <PayPalScriptProvider
        options={{ "client-id": "sb" }}
      >
        <App />
      </PayPalScriptProvider>
    </StoreContextProvider>
  </BrowserRouter>
);
