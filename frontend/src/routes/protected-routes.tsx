import { FC } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Roles from "../roles";
import Dashboard from "@/components/Dashboard";
import { Layout } from "@/components/Layout";

export const ProtectedRoutes: FC<{ roles: Array<Roles> }> = () => {
    let auth = { token: true }
    return auth.token ? (
        <Layout fixedHeader fixedSidebar>
            <Outlet />
        </Layout>
        // <Dashboard />
    ) : (
        <Navigate to="/not-authorized" />
    )
}