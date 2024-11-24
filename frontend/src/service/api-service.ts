import type { AxiosInstance } from 'axios'
import axios from 'axios'
import { AUTH_TOKEN } from './user-service'
import config from '@/config';
// import config from '../config';

// const { KEYCLOAK_URL } = config;

// interface ApiRequestParameter<T = {}>{
//   url: string, 
//   requiresAuthentication?: boolean;
//   params?: T;
// }

const { KEYCLOAK_URL } = config;

class APIService {
  private readonly client: AxiosInstance

  
  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN)}`
      },
    })
    this.client.interceptors.response.use(
      (config) => {
        console.info(
          `received response status: ${config.status} , data: ${config.data}`,
        )
        return config
      },
      (error) => {
        // Handle errors
        if (error.response && error.response.status === 401) {
          console.warn('Unauthorized! Redirecting to login.');
          window.location = KEYCLOAK_URL; // Redirect to Keycloak login
        } else {
          console.error('API error:', error);
        }
        return Promise.reject(error); 
      },
    )
  }

  public getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

export default new APIService()
