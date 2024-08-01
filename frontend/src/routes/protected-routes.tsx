import type { FC } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type Roles from '../roles'

export const ProtectedRoutes: FC<{ roles: Array<Roles> }> = () => {
  const auth = { token: true } // Replace this with your actual authentication logic

  return auth.token ? <Outlet /> : <Navigate to="/not-authorized" />
}
