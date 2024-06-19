import type { IdirUserInfo, UserInfo } from '@/types/types'
import config from '../config'
import * as api from './api'

export async function getUsers(): Promise<UserInfo[]> {
  const adminDataUrl: string = `${config.API_BASE_URL}/admin`
  const getParameters = api.generateApiParameters(adminDataUrl)
  const adminData: UserInfo[] = await api.get(getParameters)
  return adminData
}

export async function findIdirUser(email: string): Promise<IdirUserInfo> {
  const searchEmailUrl: string = `${config.API_BASE_URL}/admin/user-email-search`
  const postParameters = api.generateApiParameters(searchEmailUrl, { email })
  const userData: IdirUserInfo = await api.post(postParameters)
  return userData
}

export async function addRoles(
  idirUsername: string,
  roles: string[],
): Promise<void> {
  const addRolesUrl: string = `${config.API_BASE_URL}/admin/add-roles`
  const postParameters = api.generateApiParameters(addRolesUrl, {
    idirUsername,
    roles,
  })
  await api.post(postParameters)
}

export async function removeRoles(
  idirUsername: string,
  roles: string[],
): Promise<void> {
  const removeRolesUrl: string = `${config.API_BASE_URL}/admin/remove-roles`
  const postParameters = api.generateApiParameters(removeRolesUrl, {
    idirUsername,
    roles,
  })
  await api.post(postParameters)
}
