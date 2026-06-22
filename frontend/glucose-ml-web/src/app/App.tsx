import { Analytics } from "@vercel/analytics/react";
import HomePage from "../features/home/HomePage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DatasetDetail from "../features/dataset-detail/DatasetDetail";
import ComparePage from "../features/compare/ComparePage";
import BackgroundPage from "../features/background/BackgroundPage";
import AboutPage from "../features/about/AboutPage";
import RouteScrollManager from "./RouteScrollManager";

// Main app with routing
const App = () => {
  return (
    <BrowserRouter>
      <RouteScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/background" element={<BackgroundPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/dataset/:id" element={<DatasetDetail />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
};

export default App;
