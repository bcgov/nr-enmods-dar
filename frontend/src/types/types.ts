/**
 * Type of data returned by CSS user api
 */
export type IdirUserInfo = {
  username: string
  email: string
  firstName: string
  lastName: string
  attributes: {
    idir_user_guid: string[]
    idir_username: string[]
    display_name: string[]
  }
}

/**
 * Type used for displaying users on Admin page
 */
export type UserInfo = {
  username: string
  email: string
  name: string
  firstName: string
  lastName: string
  company: string
  idirUsername: string
  role: string[]
}
