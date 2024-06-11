import config from '../config'
import * as api from './api'

export async function getUsers(): Promise<any[]> {
  const adminDataUrl: string = `${config.API_BASE_URL}/admin`
  console.log(adminDataUrl)
  const getParameters = api.generateApiParameters(adminDataUrl)
  const adminData: any[] = await api.get(getParameters)
  return adminData
}

// export const findIdirUser = async (
//   email: string,
// ): Promise<{ foundUserObject: any | null; error: string | null }> => {
//   const url = `${config.API_BASE_URL}/admin/search-users`
//   const data = { email }
//   const postParameters = api.generateApiParameters(url, data)
//   const response: { userObject: any | null; error: string | null } =
//     await api.post(postParameters)
//   return {
//     foundUserObject: response.userObject || null,
//     error: response.error || null,
//   }
// }

// export const addAdmin = async (
//   idirUsername: string,
// ): Promise<{ userObject: any; error: string }> => {
//   const url = `${config.API_BASE_URL}/admin/add-admin`
//   const data = { idirUsername }
//   const postParameters = api.generateApiParameters(url, data)
//   const response: { userObject: any; error: string } =
//     await api.post(postParameters)
//   return response
// }

// export const removeAdmin = async (
//   idirUsername: string,
// ): Promise<{ error: string | null }> => {
//   const url = `${config.API_BASE_URL}/admin/remove-admin`
//   const data = { idirUsername }
//   const postParameters = api.generateApiParameters(url, data)
//   return api.post(postParameters)
// }
