/**
 * Type returned from the frontend for displaying users on Admin page
 */
export type UserInfo = {
  username: string
  email: string
  name: string
  company: string
  role: string[]
}

export type FileStatusCode = {
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
