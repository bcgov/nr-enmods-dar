import { FileInfo } from '@/types/types';
import * as api from './api';
import config from '@/config';

export const insertFile = async (formData: FormData): Promise<String> => {
    const url = `${config.API_BASE_URL}/v1/file_submissions`;
    const postParameters = api.generateApiParameters(url, formData)
    const fileID: String = await api.post<String>(postParameters)
    return fileID;

}

export const validationRequest = async (submission_id: String): Promise<String> => {
    const url = `${config.API_BASE_URL}/v1/file_submissions/${submission_id}`;
    const getParameters = api.generateApiParameters(url)
    const response: String = await api.get<String>(getParameters)
    return response;
}

export const getFiles = async (substring: String): Promise<FileInfo> => {
    const url = `${config.API_BASE_URL}/v1/file_submissions/${substring}`;
    const getParameters = api.generateApiParameters(url)
    const response: FileInfo = await api.get<FileInfo>(getParameters)
    return response;
}

export const searchFiles = async (formData: FormData): Promise<FileInfo[]> => {
    const url = `${config.API_BASE_URL}/v1/file_submissions/search`;
    const getParameters = api.generateApiParameters(url, formData)
    const response: FileInfo[] = await api.post<FileInfo[]>(getParameters)
    return response;
}

export const downloadFile = async (fileName: String) => {
    const url = `${config.API_BASE_URL}/v1/file_submissions/${fileName}`;
    const getParameters = api.generateApiParameters(url)
    const response = await api.get(getParameters)
    return response
}