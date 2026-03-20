// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Mark from "@/views/Mark";
import Upload from "@/views/Upload";
import Edit from "@/views/Edit";
import Contributions from "@/views/Contributions";
import Login from "@/views/Login";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="w-full grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/mark"
              element={
                <ProtectedRoute>
                  <Mark />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit"
              element={
                <ProtectedRoute>
                  <Edit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributions"
              element={
                <ProtectedRoute>
                  <Contributions />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/mark" replace />} />
            <Route path="*" element={<Navigate to="/mark" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
