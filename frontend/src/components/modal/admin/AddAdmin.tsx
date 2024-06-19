import { useEffect, useState } from 'react'
import {
  Modal,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material'
import { addRoles, removeRoles, findIdirUser } from '@/common/admin'
import { IdirUserInfo } from '@/types/types'
import Roles from '@/roles'
import theme from '@/theme'

type AddAdminProps = { show: boolean; onHide: () => void }

const AddAdmin = ({ show, onHide }: AddAdminProps) => {
  const [email, setEmail] = useState<string>('')
  const [userObject, setUserObject] = useState<IdirUserInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [roleToAdd, setRoleToAdd] = useState<string>(Roles.ENMODS_USER)

  const searchUsers = async () => {
    setShowError(false)
    setLoading(true)
    try {
      const data = await findIdirUser(email)
      console.log(data)
      setUserObject(data)
    } catch (error) {
      console.error('Removal error:', error)
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
        // const response = await addRoles(userObject?.username, )
      } catch (err) {
        //
      }
    }
  }

  const handleRoleChange = (
    event: SelectChangeEvent<Roles.ENMODS_USER | Roles.ENMODS_ADMIN>,
  ) => {
    setRoleToAdd(event.target.value)
  }

  useEffect(() => {
    console.log(userObject)
  }, [userObject])

  return (
    <Modal
      open={show}
      onClose={onHide}
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
        />
        <Button
          variant="contained"
          color="secondary"
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
            style: {
              borderColor: 'black', // Set the border color to black
            },
            focused: {
              borderColor: 'black', // Set the border color to black when focused
            },
          }}
        />
        <FormControl fullWidth>
          <InputLabel id="searchRole-label">Role</InputLabel>
          <Select
            labelId="searchRole-label"
            id="searchRole"
            label="Role"
            value={Roles.ENMODS_USER}
            onChange={handleRoleChange}
            sx={{
              marginBottom: 1,
            }}
            disabled={loading || !userObject}
          >
            <MenuItem value={Roles.ENMODS_USER}>{Roles.ENMODS_USER}</MenuItem>
            <MenuItem value={Roles.ENMODS_ADMIN}>{Roles.ENMODS_ADMIN}</MenuItem>
          </Select>
        </FormControl>
        {showError && <Alert severity="error">{error}</Alert>}
        <div>
          <Button onClick={onHide}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={addRolesHandler}
            disabled={loading || !userObject}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Roles'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AddAdmin
