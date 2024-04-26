import _kc from '@/keycloak'

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
    <div className='d-flex flex-column flex-shrink-0 comp-side-bar'
      style={{
        width: '20%'

      }}>
      <ul className="nav nav-pills flex-column mb-auto comp-nav-item-list" style={styles.listStyle}>
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
