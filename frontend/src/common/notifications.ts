import type { NotificationInfo } from "@/types/types";
import config from "../config";
import * as api from "./api";

/**
 * Used on unsubscribe page to unsubscribe a user from notifications
 * @param guid
 * @returns
 */
export async function unsubscribeNotifications(guid: string) {
  const unsubscribeUrl: string = `${config.API_BASE_URL}/notifications/unsubscribe`;
  console.log(unsubscribeUrl)
  const postParameters = api.generateApiParameters(unsubscribeUrl, {
    guid: guid,
  });
  const response: any = await api.post(postParameters);
  console.log(response);
  return response;
}

/**
 * Returns notification table data for display on the Admin page
 * @returns notificationData: NotificationInfo[]
 */
export async function getNotificationData(): Promise<NotificationInfo[]> {
  const getNotificationDataUrl: string = `${config.API_BASE_URL}/notifications`;
  const getParameters = api.generateApiParameters(getNotificationDataUrl);
  const notificationData: NotificationInfo[] = await api.get(getParameters);
  return notificationData;
}

/**
 * Used to enable or disable notifications for a Ministry Contact
 * @param email
 * @param username
 * @param enabled
 */
export async function updateNotification(
  email: string,
  username: string,
  enabled: boolean,
): Promise<void> {
  const updateNotificationUrl: string = `${config.API_BASE_URL}/notifications/update-notification`;
  const postParameters = api.generateApiParameters(updateNotificationUrl, {
    email: email,
    username: username,
    enabled: enabled,
  });
  await api.post(postParameters);
}

export async function requestAccess(
  email: string,
  accountType: string,
  fullname: string,
  username: string,
  endpoint: string
) {
  const requestAccessUrl: string = `${config.API_BASE_URL}/notifications/request-access`;
  const postParameters = api.generateApiParameters(requestAccessUrl, {
    email: email,
    accountType: accountType,
    fullname: fullname,
    username: username,
    edtURL: endpoint
  });
  const response: any = await api.post(postParameters);
  return response;
}
