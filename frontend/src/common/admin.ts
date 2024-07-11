import type { UserInfo } from '@/types/types'
import config from '../config'
import * as api from './api'

export async function getUsers(): Promise<UserInfo[]> {
  const adminDataUrl: string = `${config.API_BASE_URL}/admin`
  const getParameters = api.generateApiParameters(adminDataUrl)
  const adminData: UserInfo[] = await api.get(getParameters)
  return adminData
}

// Test route TODO: delete this
export async function testEmail(): Promise<void> {
  const testEmailUrl: string = `${config.API_BASE_URL}/notifications/send-email`
  const getParameters = api.generateApiParameters(testEmailUrl)
  const response: any = await api.get(getParameters)
  console.log(response)
}

// Test route TODO: delete this
export async function addNotification(): Promise<void> {
  const testAddNotificationUrl: string = `${config.API_BASE_URL}/notifications/add-notification`
  const getParameters = api.generateApiParameters(testAddNotificationUrl)
  const response: any = await api.get(getParameters)
  console.log(response)
}

// Test route TODO: delete this
export async function updateNotification(): Promise<void> {
  const testUpdateNotificationUrl: string = `${config.API_BASE_URL}/notifications/update-notification`
  const getParameters = api.generateApiParameters(testUpdateNotificationUrl)
  const response: any = await api.get(getParameters)
  console.log(response)
}
