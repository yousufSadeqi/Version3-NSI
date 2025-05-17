import axios, { AxiosError } from 'axios';
import { ENDPOINTS, testServerConnection, API_BASE_URL } from '../config/api';
import * as FileSystem from 'expo-file-system';

export interface ReceiptProcessingResult {
  success: boolean;
  data?: {
    amount: number;
    date: string;
    description: string;
    category?: string;
    merchant?: string;
    items?: Array<{ name: string; price: number }>;
    raw_text?: string;
  };
  error?: string;
  serverStatus?: 'online' | 'offline';
  diagnosticInfo?: any;
}

export const processReceipt = async (imageUri: string): Promise<ReceiptProcessingResult> => {
  try {
    let processedImageUri = imageUri;

    if (imageUri.startsWith('file://')) {
      try {
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpeg';
        processedImageUri = `data:image/${fileExtension};base64,${base64Image}`;
      } catch (fileError) {
        return {
          success: false,
          error: 'Error reading local image file',
          serverStatus: 'offline',
          diagnosticInfo: fileError,
        };
      }
    }

    if (
      imageUri &&
      !imageUri.startsWith('http://') &&
      !imageUri.startsWith('https://') &&
      !imageUri.startsWith('file://') &&
      !imageUri.startsWith('data:')
    ) {
      processedImageUri = 'https://' + imageUri;
    }

    const isServerConnected = await testServerConnection();
    if (!isServerConnected) {
      return {
        success: false,
        error: 'Server is offline or unreachable',
        serverStatus: 'offline',
      };
    }

    const startTime = new Date().getTime();

    const response = await axios.post(
      ENDPOINTS.PROCESS_RECEIPT,
      { image_url: processedImageUri },
      {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const endTime = new Date().getTime();
    const processingTime = (endTime - startTime) / 1000;

    const result = response.data as ReceiptProcessingResult;

    if (typeof result.success !== 'boolean') {
      return {
        success: false,
        error: 'Invalid server response format',
        diagnosticInfo: response.data,
      };
    }

    if (result.success && !result.data) {
      return {
        success: false,
        error: 'Server returned success but no data',
        serverStatus: 'online',
        diagnosticInfo: response.data,
      };
    }

    if (result.success && result.data) {
      let cleanedData = {
        ...result.data,
        merchant: result.data.merchant || 'Unknown Merchant',
        amount: typeof result.data.amount === 'number' ? result.data.amount : 0,
        date: result.data.date || new Date().toISOString().split('T')[0],
        description: '',
        category: result.data.category || 'other',
        items: Array.isArray(result.data.items) ? result.data.items : [],
      };

      // this is not essential anymore but I can use it cause in frontend I don't have enough space to show all the items
      // so I am gonna take the descript that I already made in the backend(python) here I don't use items
      if (!cleanedData.description) {
        const { merchant, amount, date, items } = cleanedData;

        let description = `Receipt from ${merchant}`;

        if (amount > 0) {
          description += ` for $${amount.toFixed(2)}`;
        }

        if (date) {
          description += ` on ${date}`;
        }

        cleanedData.description = description;
      }


      if (cleanedData.amount === 0 && processingTime >= 15) {
        return {
          success: false,
          error: 'Receipt amount could not be determined. Please try again with a clearer image.',
          serverStatus: 'online',
          diagnosticInfo: {
            processingTime,
            originalResponse: result,
          },
        };
      }

      result.data = cleanedData;
    }

    return result;
  } catch (error) {
    let errorMessage = 'Failed to process receipt';
    let diagnosticInfo = {};

    if (error instanceof AxiosError) {
      if (error.response) {
        errorMessage = `Server error (${error.response.status}): ${error.message}`;
        diagnosticInfo = {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        };
      } else if (error.request) {
        errorMessage = 'No response from server - check network connection';
        diagnosticInfo = {
          request: error.request,
          message: error.message,
          serverUrl: API_BASE_URL,
        };
      }

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Receipt processing timed out. Please try again with a clearer image.';
      }
    } else {
      errorMessage = `Network request failed: ${String(error)}`;
    }

    return {
      success: false,
      error: errorMessage,
      serverStatus: 'offline',
      diagnosticInfo,
    };
  }
};

const ReceiptService = {
  processReceipt,
};

export default ReceiptService;
