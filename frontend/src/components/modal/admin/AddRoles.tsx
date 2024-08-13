import { ChangeEvent, useState } from 'react'
import {
  Modal,
  Button,
  TextField,
  FormControl,
  Alert,
  CircularProgress,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { findIdirUser, updateRoles } from '@/common/admin'
import { IdirUserInfo, UserInfo } from '@/types/types'
import Roles from '@/roles'
import theme from '@/theme'

type AddRolesProps = {
  show: boolean
  existingUsers: UserInfo[]
  refreshTable: () => void
  onHide: () => void
}

const AddRoles = ({
  show,
  existingUsers,
  refreshTable,
  onHide,
}: AddRolesProps) => {
  const [email, setEmail] = useState<string>('')
  const [userObject, setUserObject] = useState<IdirUserInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [rolesToAdd, setRolesToAdd] = useState<string[]>([])

  const searchUsers = async () => {
    setShowError(false)
    setLoading(true)
    try {
      const data = await findIdirUser(email)
      if (existingUsers.some((user) => user.idirUsername === data.username)) {
        setError('User already exists.')
        setShowError(true)
      } else {
        if (data && data.username) {
          setUserObject(data)
        } else {
          setError('User not found.')
          setShowError(true)
        }
      }
    } catch (error) {
      setError('An error occurred during removal.')
      setShowError(true)
    } finally {
      setLoading(false)
    }
  }

  const addRolesHandler = async () => {
    if (userObject) {
      setShowError(false)
      setLoading(true)
      try {
        await updateRoles(userObject?.username, [], rolesToAdd)
        refreshTable()
      } catch (err) {
        setError('Failed to add role to user.')
        setShowError(true)
      } finally {
        setLoading(false)
        handleOnHide()
      }
    }
  }

  const handleRoleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    if (checked) {
      setRolesToAdd([...rolesToAdd, name])
    } else {
      setRolesToAdd(rolesToAdd.filter((role) => role !== name))
    }
  }

  const handleOnHide = () => {
    setUserObject(null)
    onHide()
  }

  return (
    <Modal
      open={show}
      onClose={handleOnHide}
      aria-labelledby="add-roles-modal"
      aria-describedby="add-roles-modal-description"
    >
      <div
        style={{
          position: 'absolute',
          width: 400,
          minHeight: 600,
          backgroundColor: 'white',
          border: '2px solid #000',
          boxShadow: theme.shadows[5],
          padding: theme.spacing(2, 4, 3),
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <h2 id="simple-modal-title">Grant Roles</h2>
        <TextField
          id="searchEmail"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          sx={{
            marginBottom: 1,
          }}
          color="primary"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={searchUsers}
          disabled={loading}
          sx={{
            marginBottom: 1,
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Search'}
        </Button>
        <TextField
          id="searchFirstName"
          label="First Name"
          value={userObject?.firstName || ''}
          fullWidth
          margin="normal"
          sx={{
            marginBottom: 1,
          }}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
          color="info"
        />
        <TextField
          id="searchLastName"
          label="Last Name"
          value={userObject?.lastName || ''}
          fullWidth
          margin="normal"
          sx={{
            marginBottom: 1,
          }}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
          color="info"
        />
        <TextField
          id="searchUsername"
          label="Username"
          value={userObject?.attributes?.idir_username[0] ?? ''}
          fullWidth
          margin="normal"
          sx={{
            marginBottom: 1,
          }}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
          color="info"
        />
        <FormControl fullWidth>
          <FormLabel component="legend" color="primary" sx={{ marginTop: 1 }}>
            Roles
          </FormLabel>
          <FormGroup>
            <FormControlLabel id='ENMODS_USER'
              control={
                <Checkbox
                  checked={rolesToAdd.includes(Roles.ENMODS_USER)}
                  onChange={handleRoleChange}
                  name={Roles.ENMODS_USER}
                  disabled={loading || !userObject}
                  color="primary"
                />
              }
              label={Roles.ENMODS_USER}
            />
            <FormControlLabel id='ENMODS_ADMIN'
              control={
                <Checkbox
                  checked={rolesToAdd.includes(Roles.ENMODS_ADMIN)}
                  onChange={handleRoleChange}
                  name={Roles.ENMODS_ADMIN}
                  disabled={loading || !userObject}
                  color="primary"
                />
              }
              label={Roles.ENMODS_ADMIN}
            />
          </FormGroup>
        </FormControl>

        {showError && <Alert severity="error">{error}</Alert>}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 'auto',
          }}
        >
          <Button
            onClick={handleOnHide}
            color="secondary"
            sx={{ marginRight: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={addRolesHandler}
            disabled={loading || !userObject || rolesToAdd.length === 0}
            style={{ marginLeft: '8px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Roles'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AddRoles
