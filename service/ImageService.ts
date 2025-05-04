import axios from "axios";
import * as FileSystem from 'expo-file-system';
import { ResponseType } from "@/types";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@/constants";

const CLOUDINARY_CLOUD_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const uploadFileToCloudinary = async (
  imageAsset: any,
  folderName: string
): Promise<ResponseType> => {
  try {
    // Log the received image asset for debugging
    console.log('Received image asset:', imageAsset);

    if (!imageAsset?.uri) {
      throw new Error('No image URI provided');
    }

    // Get file info and type
    const fileInfo = await FileSystem.getInfoAsync(imageAsset.uri);
    console.log('File info:', fileInfo);

    if (!fileInfo.exists) {
      throw new Error('File does not exist at path: ' + imageAsset.uri);
    }

    // Create form data with proper file information
    const formData = new FormData();
    formData.append('file', {
      uri: imageAsset.uri,
      type: imageAsset.type || 'image/jpeg',
      name: imageAsset.uri.split('/').pop() || 'image.jpg',
    } as any);

    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folderName);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    console.log('Uploading to Cloudinary...', {
      url: CLOUDINARY_CLOUD_API_URL,
      preset: CLOUDINARY_UPLOAD_PRESET,
      folder: folderName
    });

    const response = await axios.post(CLOUDINARY_CLOUD_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Cloudinary response:', response.data);

    if (response.data?.secure_url) {
      return { 
        success: true, 
        data: response.data.secure_url,
        msg: 'Upload successful'
      };
    } else {
      throw new Error('No secure URL in response');
    }
  } catch (error: any) {
    console.error('Cloudinary upload error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return { 
      success: false, 
      msg: error.response?.data?.error?.message || error.message || 'Upload failed'
    };
  }
};

// This function returns the profile image URI or a default avatar
export const getProfileImage = (imageUrl: string | null) => {
  if (imageUrl) return { uri: imageUrl };
  return require("../assets/images/defaultAvatar.png");
};

// This function returns the file URI or null if invalid
export const getFilePath = (file: any) => {
  if (file && typeof file === "string") return file;
  if (file && typeof file === "object") return file.uri;

  return null;
};
