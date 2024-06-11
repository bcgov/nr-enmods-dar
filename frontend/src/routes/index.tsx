import { Routes, Route } from 'react-router-dom'
import Roles from '../roles'
import NotFound from '@/pages/NotFound'
import Dashboard from '@/pages/Dashboard'
import Admin from '@/pages/Admin'
import HomePage from '@/pages/HomePage'
import FileUpload from '@/pages/FileUpload'
import { ProtectedRoutes } from './protected-routes'

export default function AppRoutes() {
  return (
    <>
    <Routes>
      <Route element={<ProtectedRoutes roles={[Roles.ENMODS_ADMIN]} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/submit" element={<FileUpload />} />

      </Route>

      <Route element={<ProtectedRoutes roles={[Roles.ENMODS_USER]} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/submit" element={<FileUpload />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
  )
}
