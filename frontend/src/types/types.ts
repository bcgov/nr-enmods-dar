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