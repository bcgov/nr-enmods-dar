import type { UserInfo } from '@/types/types'
import config from '../config'
import * as api from './api'

export async function getUsers(): Promise<UserInfo[]> {
  const adminDataUrl: string = `${config.API_BASE_URL}/admin`
  const getParameters = api.generateApiParameters(adminDataUrl)
  const adminData: UserInfo[] = await api.get(getParameters)
  return adminData
}
