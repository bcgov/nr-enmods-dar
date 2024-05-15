import { List, ListItem, ListItemText } from '@mui/material'
import { Link } from 'react-router-dom'

const topics = [
  { name: 'Web policy and content standards', link: '/web-policy' },
  { name: 'Web Style Guide', link: '/web-style-guide' },
  { name: 'CMS Lite manual', link: '/cms-lite' },
  { name: 'Enhanced Search Manual', link: '/enhanced-search' },
]

const Sidebar = () => {
  return (
    <List component="nav" aria-label="secondary mailbox folders">
      {topics.map((topic, index) => (
        <ListItem button key={index} component={Link} to={topic.link}>
          <ListItemText primary={topic.name} />
        </ListItem>
      ))}
    </List>
  )
}

export default Sidebar
