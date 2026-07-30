import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShelbyClientProvider } from "@shelby-protocol/react";
import App from "./App";
import { getShelbyClient } from "./lib/shelby";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ShelbyClientProvider client={getShelbyClient()}>
        <App />
      </ShelbyClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
