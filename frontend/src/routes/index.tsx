import { Routes, Route } from "react-router-dom";
import { ProtectedRoutes } from "./protected-routes";
import Roles from "../roles";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import AdminPage from "@/pages/AdminPage";
import FileUpload from "@/pages/FileUpload";
import Unsubscribe from "@/pages/Unsubscribe";
import SFTPUserPage from "@/pages/SFTPUserPage";

export default function AppRoutes() {
  return (
    <>
      <Routes>
        <Route element={<ProtectedRoutes roles={[Roles.ENMODS_ADMIN]} />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/sftp" element={<SFTPUserPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoutes roles={[Roles.ENMODS_ADMIN, Roles.ENMODS_USER]} />
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submit" element={<FileUpload />} />
          <Route path="/" element={<FileUpload />} />
        </Route>

        <Route path="/unsubscribe/:uuid" element={<Unsubscribe />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
