import { FC } from 'react'
import { Navigate } from 'react-router-dom'
import Roles from '../roles'
import Dashboard from '@/pages/Dashboard'

export const ProtectedRoutes: FC<{ roles: Array<Roles> }> = () => {
  let auth = { token: true }
  return auth.token ? <Dashboard /> : <Navigate to="/not-authorized" />
}
