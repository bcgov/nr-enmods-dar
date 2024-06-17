import { FileInfo } from '@/types/types';
import * as api from './api';
import config from '@/config';

export const insertFile = async (formData: FormData): Promise<void> => {
    const url = `${config.API_BASE_URL}/v1/file_submissions`;
    const postParameters = api.generateApiParameters(url, formData)
    for (var pair of formData.entries()) {
        console.log(pair[0]+ ', ' + pair[1]); 
    }
    await api.post<{ message: string }>(postParameters)
}