import type { FC } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type Roles from "../roles";
import UserService from "@/service/user-service";

export const ProtectedRoutes: FC<{ roles: Array<Roles> }> = ({ roles }) => {
  for (let role of roles) {
    if (UserService.hasRole(role)) {
      return <Outlet />;
    }
  }
  return <Navigate to="/not-authorized" />;
};
