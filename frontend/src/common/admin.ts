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

/**
 * Adds roles to a user given their IDIR username and an array of roles to add.
 * (currently unused)
 * @param idirUsername
 * @param roles
 */
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

/**
 * Removes roles from a user given their IDIR username and an array of roles to remove.
 * @param idirUsername
 * @param roles
 */
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

/**
 * Updates a user's roles given their IDIR username, the existing roles array, and the new roles array.
 * @param idirUsername
 * @param existingRoles
 * @param roles
 */
export async function updateRoles(
  idirUsername: string,
  existingRoles: string[],
  roles: string[],
): Promise<void> {
  const updateRolesUrl: string = `${config.API_BASE_URL}/admin/update-roles`
  const postParameters = api.generateApiParameters(updateRolesUrl, {
    idirUsername,
    existingRoles,
    roles,
  })
  await api.post(postParameters)
}
