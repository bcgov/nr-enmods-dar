import config from '../config'
import * as api from './api'

// Test route TODO: delete this
export async function testEmail(): Promise<void> {
  const testEmailUrl: string = `${config.API_BASE_URL}/notifications/send-email`
  const getParameters = api.generateApiParameters(testEmailUrl)
  const response: any = await api.get(getParameters)
  console.log(response)
}

// Test route TODO: delete this
export async function updateNotification(
  email: string,
  username: string,
  enabled: boolean,
): Promise<void> {
  const updateNotificationUrl: string = `${config.API_BASE_URL}/notifications/update-notification`
  const postParameters = api.generateApiParameters(updateNotificationUrl, {
    email: email,
    username: username,
    enabled: enabled,
  })
  const response: any = await api.post(postParameters)
  console.log(response)
}

export async function getNotificationStatus(
  email: string,
  username: string,
): Promise<boolean> {
  const getNotificationStatusUrl: string = `${config.API_BASE_URL}/notifications/get-notification-status`
  const postParameters = api.generateApiParameters(getNotificationStatusUrl, {
    email: email,
    username: username,
  })
  const response: any = await api.post(postParameters)
  console.log(response)
  return response
}

export async function unsubscribeNotifications(guid: string) {
  const unsubscribeUrl: string = `${config.API_BASE_URL}/notifications/unsubscribe`
  const postParameters = api.generateApiParameters(unsubscribeUrl, {
    guid: guid,
  })
  const response: any = await api.post(postParameters)
  console.log(response)
  return response
}
