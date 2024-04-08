import { FC } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Roles from "../roles";
import Dashboard from "@/components/Dashboard";

export const ProtectedRoutes: FC<{ roles: Array<Roles> }> = () => {
    let auth = { token: true }
    return auth.token ? (
        <Dashboard />
    ) : (
        <Navigate to="/not-authorized" />
    )
}