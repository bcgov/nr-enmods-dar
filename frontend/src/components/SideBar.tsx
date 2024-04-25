import apiService from '@/service/api-service'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import type { AxiosResponse } from '~/axios'
// import config from '../config'
import _kc from '@/keycloak'
import UserService from '@/service/user-service'
import { Link } from 'react-router-dom'
import { style, width } from '@mui/system'

export default function SideBar() {

  const styles={

    listStyle: {
      listStyleType:'none'
    },

    activeNav: {
      backgroundColor: `rgb(246, 249, 252)`,
      borderColor: `rgb(26, 90, 150)`,
      color: `rgb(26, 90, 150)`,
      fontWeight: `700`,
    }
  }

  return (
    <div className='sidebarPanel'
      style={{
        width: '10%'

      }}>
      <ul style={styles.listStyle}>
        <li style={styles.activeNav}>
          <a href="/">Dashboard</a>
        </li>
        <li>
          <a href="/admin" className="active">Admin Page</a>
        </li>
       
        
      </ul>
    </div>
  )
}
