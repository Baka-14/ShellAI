import { Routes, Route, Navigate } from "react-router-dom";
import TerpApp from "./terp/TerpApp.jsx";
import AdminApp from "./admin/AdminApp.jsx";
import UniversityAnalytics from "./university/UniversityAnalytics.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TerpApp />} />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="/universityAnalytics" element={<UniversityAnalytics />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
