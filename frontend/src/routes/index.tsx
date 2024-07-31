import { Routes, Route } from 'react-router-dom'
import { ProtectedRoutes } from './protected-routes'
import Roles from '../roles'
import NotFound from '@/pages/NotFound'
import Dashboard from '@/pages/Dashboard'
import AdminPage from '@/pages/AdminPage'
import FileUpload from '@/pages/FileUpload'
import OptionsPage from '@/pages/OptionsPage'

export default function AppRoutes() {
  return (
    <>
      <Routes>
        <Route element={<ProtectedRoutes roles={[Roles.ENMODS_ADMIN]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/" element={<FileUpload />} />
        </Route>

        <Route element={<ProtectedRoutes roles={[Roles.ENMODS_USER]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submit" element={<FileUpload />} />
          <Route path="/options" element={<OptionsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
