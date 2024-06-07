import { Breadcrumbs, Link, Typography } from '@mui/material'
import type { FC } from 'react'
import { useLocation } from 'react-router'

const styles = {
  navbar: {
    backgroundColor: '#f4f4f4',
    padding: '0.5rem 1rem',
  },
  link: {
    color: '#0277bd',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}

const paths = [
  { name: 'Home', url: '/' },
  { name: 'Admin', url: '/admin' },
]

const Navbar: FC = () => {
  const location = useLocation()
  const currentPath = location.pathname

  const breadcrumbs = paths.filter((path) => currentPath.includes(path.url))

  return (
    <Breadcrumbs aria-label="breadcrumb">
      {breadcrumbs.map((path, index) => {
        const isLast = index === paths.length - 1
        return isLast ? (
          <Typography color="textPrimary" key={index}>
            {path.name}
          </Typography>
        ) : (
          <Link
            key={index}
            color="inherit"
            href={path.url}
            style={styles.link}
            underline="hover"
          >
            {path.name}
          </Link>
        )
      })}
    </Breadcrumbs>
  )
}

export default Navbar
