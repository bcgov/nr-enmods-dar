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

/**
 * Used for displaying user notification status on Admin page
 */
export type NotificationInfo = {
  id: string
  email: string
  create_user_id: string
  create_utc_timestamp: string
  update_user_id: string
  update_utc_timestamp: string
}

export type FileStatusCode = {
  items: FileStatusCode[]
  submissionStatusCode: string
  description: string
  displayOrder: number
  activeInd: boolean
  createUserId: string
  createTimestamp: Date
  updateUserId: string
  updateTimestamp: Date
}

export type FileInfo = {
  submissionID: string
  filename: string
  submissionDate: Date
  submitterUserID: string
  submissionStatusCode: string
  submitterAgencyName: string
  sampleCount: number
  resultCount: number
  activeInd: boolean
  errorLog: string
  organizationGUID: string
  createUserId: string
  createTimestamp: Date
  updateUserId: string
  updateTimestamp: Date
}
