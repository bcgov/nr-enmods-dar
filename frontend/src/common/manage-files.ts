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

export const getFile = async (formData: FormData): Promise<FileInfo> => {
    const url = `${config.API_BASE_URL}/v1/file_submissions`;
    const getParameters = api.generateApiParameters(url, formData)
    for (var pair of formData.entries()) {
        console.log(pair[0]+ ', ' + pair[1]); 
    }
    const response: FileInfo = await api.get<FileInfo>(getParameters)
    return response;
}