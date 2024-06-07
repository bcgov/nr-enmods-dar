import { List, ListItemButton, ListItemText } from '@mui/material'
import { Link } from 'react-router-dom'

const topics = [
  { name: 'BC Home', link: '/' },
  { name: 'Ministry of Environment', link: '/' },
  { name: 'EDT', link: '/' },
  { name: 'Submit', link: '/' },
  { name: 'Dashboard', link: '/' },
  { name: 'Web User - FTP User Links', link: '/' },
  { name: 'EMS', link: '/' },
  { name: 'Admin', link: '/admin' },
]

const Sidebar = () => {
  return (
    <List component="nav" aria-label="secondary mailbox folders">
      {topics.map((topic, index) => (
        <ListItemButton key={index} component={Link} to={topic.link}>
          <ListItemText primary={topic.name} />
        </ListItemButton>
      ))}
    </List>
  )
}

export default Sidebar
