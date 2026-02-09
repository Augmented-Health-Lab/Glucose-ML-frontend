import HomePage from "./components/HomePage";
import AppLayout from "./components/AppLayout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DatasetDetail from "./components/dataset_detail/DatasetDetail";

// Main app with routing
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dataset/:id" element={<DatasetDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
