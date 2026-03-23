import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

function AdminDashboard()   { return <h1 style={{color:"#333"}}>Admin Dashboard 🚧</h1>; }
function StudentDashboard() { return <h1 style={{color:"#333"}}>Staff Dashboard 🚧</h1>; }

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.role !== allowedRole) return <Navigate to="/" />;
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/"                   element={<Login />} />
      <Route path="/forgot-password"    element={<ForgotPassword />} />
      <Route path="/reset-password"     element={<ResetPassword />} />
      <Route path="/admin/dashboard"    element={
        <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
      }/>
      <Route path="/staff/dashboard"    element={
        <ProtectedRoute allowedRole="user"><StudentDashboard /></ProtectedRoute>
      }/>
    </Routes>
  );
}