import { List, ListItemButton, ListItemText } from "@mui/material";
import { Link } from "react-router-dom";
import UserService from "../service/user-service";
import { useEffect, useState } from "react";
import Roles from "../roles";

const topics = [
  { name: "Submit", link: "/submit", adminOnly: false },
  { name: "Dashboard", link: "/dashboard", adminOnly: false },
  { name: "Web User - FTP User Links", link: "/", adminOnly: true },
  { name: "Admin", link: "/admin", adminOnly: true },
];

const Sidebar = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      const hasAdminRole = await UserService.hasRole(Roles.ENMODS_ADMIN);
      setIsAdmin(hasAdminRole);
    };
    checkAdminRole();
  }, []);

  const filteredTopics = isAdmin
    ? topics
    : topics.filter((topic) => !topic.adminOnly);

  return (
    <List component="nav" aria-label="secondary mailbox folders">
      {filteredTopics.map((topic, index) => (
        <ListItemButton key={index} component={Link} to={topic.link}>
          <ListItemText primary={topic.name} />
        </ListItemButton>
      ))}
    </List>
  );
};

export default Sidebar;
