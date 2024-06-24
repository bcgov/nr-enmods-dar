import { FileInfo, FileStatusCode } from '@/types/types';
import * as api from './api';
import config from '@/config';

export const getFileStatusCodes = async (): Promise<FileStatusCode> => {
    const url = `${config.API_BASE_URL}/v1/file_status_codes`;
    const getParameters = api.generateApiParameters(url)
    const fileStatusCodes: FileStatusCode = await api.get<FileStatusCode>(getParameters)
    return fileStatusCodes;
}