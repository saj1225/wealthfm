import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Landing from "./pages/Landing.jsx";
import Mortgage from "./pages/Mortgage.jsx";
import Fire from "./pages/Fire.jsx";
import Trade from "./pages/Trade.jsx";
import NotFound from "./pages/NotFound.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/mortgage" element={<Mortgage />} />
        <Route path="/fire" element={<Fire />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>
);
