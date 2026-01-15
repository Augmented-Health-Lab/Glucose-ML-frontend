import HomePage from "./components/HomePage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DatasetDetail from "./components/dataset_detail/DatasetDetail";

// Main app with routing
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dataset/:id" element={<DatasetDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
