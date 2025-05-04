import { auth, firestore } from "@/config/firebase";
import { ResponseType, UserDataType } from "@/types";
import { updateDoc, doc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { uploadFileToCloudinary } from "./ImageService";

export const updateUser = async (
    uid: string, 
    updatedData: UserDataType
): Promise<ResponseType> => { 
    try {
        if (!uid) {
            return { success: false, msg: 'User ID is required' };
        }

        let imageUrl = updatedData.image;

        // Check if image is a file URI (not a URL)
        if (updatedData.image && !updatedData.image.startsWith('http')) {
            console.log('Uploading image to Cloudinary...');
            const uploadResult = await uploadFileToCloudinary({
                uri: updatedData.image,
                type: 'image/jpeg'
            }, 'profile_pictures');

            console.log('Upload result:', uploadResult);

            if (!uploadResult.success) {
                return { 
                    success: false, 
                    msg: uploadResult.msg || 'Failed to upload image'
                };
            }

            imageUrl = uploadResult.data;
        }

        // Update user document with new data
        const userRef = doc(firestore, 'Users', uid);
        const dataToUpdate = {
            ...updatedData,
            image: imageUrl,
            updated: new Date()
        };

        console.log('Updating user document with:', dataToUpdate);
        await updateDoc(userRef, dataToUpdate);

        // Update Auth Profile
        const currentUser = auth.currentUser;
        if (currentUser) {
            await updateProfile(currentUser, {
                displayName: updatedData.name,
                photoURL: updatedData.image || null
            });
        }

        return { success: true, msg: 'Updated successfully' };
    } catch (error: any) {
        console.error('Update user error:', error);
        return { success: false, msg: error.message || 'Failed to update user' };  
    }
}; 
