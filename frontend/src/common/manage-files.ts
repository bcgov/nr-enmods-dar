import { FileInfo } from '@/types/types';
import * as api from './api';
import config from '@/config';

export const insertFile = async (file: Blob): Promise<void> => {
    const url = `${config.API_BASE_URL}/v1/file_submissions`;
    const postParameters = api.generateApiParameters(url, file)
    console.log(file)
    await api.post<{ message: string }>(postParameters)
}