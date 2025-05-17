import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

// Default server IP (should match Flask server)
let defaultApiUrl = 'http://192.168.237.208:5000';

if (__DEV__) {
  if (Platform.OS === 'android') {
    defaultApiUrl = 'http://192.168.237.208:5000';
  } else if (Platform.OS === 'ios') {

    defaultApiUrl = 'http://192.168.237.208:5000';
  }
}

// Environment override
export const API_BASE_URL = process.env.API_URL || defaultApiUrl;

console.log(`Using API base URL: ${API_BASE_URL}`);

export const ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  PROCESS_RECEIPT: `${API_BASE_URL}/process-receipt`,
};

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 30000;

export const testServerConnection = async () => {
  try {
    console.log('Attempting to connect to health check at:', ENDPOINTS.HEALTH);

    const response = await axios.get(ENDPOINTS.HEALTH, {
      timeout: 10000,
    });

    console.log('Health check response:', response.data);

    if (response.data?.server_status === 'online') {
      console.log('Server is online');
      return true;
    } else {
      console.warn(' Server responded but not marked as online:', response.data);
      return false;
    }
  } catch (error) {
    console.error(' Health check failed');

    if (error instanceof AxiosError) {
      console.error('Axios error:', error.message);
      if (error.response) {
        console.error('Status code:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received. Request details:', error.request);
      }

      if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused. Is the Flask server running and reachable at', API_BASE_URL);
      }
    } else {
      console.error('Unexpected error:', error);
    }

    return false;
  }
};

