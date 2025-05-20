import type { SFTPUserInfo } from "@/types/types";
import config from "../config";
import * as api from "./api";

export async function getSftpUsers(): Promise<SFTPUserInfo[]> {
  const sftpUserDataUrl: string = `${config.API_BASE_URL}/sftp`;
  const getParameters = api.generateApiParameters(sftpUserDataUrl);
  const sftpUserData: SFTPUserInfo[] = await api.get(getParameters);
  console.log(sftpUserData);
  return sftpUserData;
}
