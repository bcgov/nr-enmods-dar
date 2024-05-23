import _kc from '@/keycloak'
import SideBarItem from '@/types/sidebar-item';
import React, { FC, useState } from "react";
import { Link } from 'react-router-dom';


export const SideBar: FC = () => {

  const [activeId, setActiveId] = useState<number>();

  const sidebarItems: Array<SideBarItem> = [
    {
      id: "dashboard-link",
      name: "Dashboard",
      route: "/"
    }, 
    
    {
      id: "search-link",
      name: "Search",
      route: "/search"
    }, 
    
    {
      id: "admin-link",
      name: "Admin Panel",
      route: "/admin"
    }
  ]

  const renderSideBar = (idx: number, item: SideBarItem): JSX.Element => {
    const {id, name, route} = item;

    return (
      <li key={`sb-open-${idx}`} onClick={() => setActiveId(idx)}>
        {activeId === idx ? "Active" : "Inactive"}
        <Link to={`${route}`} id={`${id}`}>
          <span className='comp-nav-item-name'>
            {name}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <div className='d-flex flex-column flex-shrink-0 comp-side-bar'>
      <ul className='nav nav-pills flex-column mb-auto comp-nav-item-list'>
        {sidebarItems.map((item, idx) =>{
          return renderSideBar(idx, item);
        })}
      </ul>
    </div>
  )
}
