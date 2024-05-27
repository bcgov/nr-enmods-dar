import { Routes, Route } from 'react-router-dom'
import NotFound from '@/components/NotFound'
import Dashboard from '@/components/Dashboard'
import FileUpload from '@/components/FileUpload'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<NotFound />} />
      <Route path="upload" element={<FileUpload />} />
    </Routes>
  )
}
