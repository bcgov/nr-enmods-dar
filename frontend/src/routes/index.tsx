import { Routes, Route } from 'react-router-dom'
import NotFound from '@/components/NotFound'
import Dashboard from '@/components/Dashboard'
import AdminPage from '@/components/AdminPage'
import { ProtectedRoutes } from './protected-routes'
import Roles from "../roles";
import SideBar from '@/components/SideBar'

export default function AppRoutes() {
  return (
  <>
    <SideBar/>
    <Routes>
      <Route element = {< ProtectedRoutes roles={[Roles.ENMODS_ADMIN]} />}>
        
        <Route 
          path="/" 
          element={<Dashboard />} 
        />

        <Route 
          path="/admin" 
          element={<AdminPage />} 
        />

      </Route>

      <Route element = {< ProtectedRoutes roles={[Roles.ENMODS_USER]} />}>
        <Route 
          path="/" 
          element={<NotFound />}
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
  )
}
