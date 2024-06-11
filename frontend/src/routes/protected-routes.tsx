import { FC } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Roles from '../roles'

export const ProtectedRoutes: FC<{ roles: Array<Roles> }> = ({ roles }) => {
  let auth = { token: true } // Replace this with your actual authentication logic

  return auth.token ? <Outlet /> : <Navigate to="/not-authorized" />
}
