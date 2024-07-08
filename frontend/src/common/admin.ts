import type { UserInfo } from '@/types/types'
import config from '../config'
import * as api from './api'

export async function getUsers(): Promise<UserInfo[]> {
  const adminDataUrl: string = `${config.API_BASE_URL}/admin`
  const getParameters = api.generateApiParameters(adminDataUrl)
  const adminData: UserInfo[] = await api.get(getParameters)
  return adminData
}

export async function testEmail(): Promise<void> {
  const testEmailUrl: string = `${config.API_BASE_URL}/email/send-email`
  const getParameters = api.generateApiParameters(testEmailUrl)
  const response: any = await api.get(getParameters)
  console.log(response)
}
