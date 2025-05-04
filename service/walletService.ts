import axios from "axios";
import { WalletType, ResponseType } from "@/types";
import { uploadFileToCloudinary } from "./ImageService";
import { firestore } from "@/config/firebase";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { getFilePath } from "./ImageService";

export const createOrUpdateWallet = async (
  userId: string,
  walletData: Partial<WalletType>
): Promise<ResponseType> => {
  try {
    console.log("Starting wallet operation with data:", walletData);

    if (!userId) {
      return { success: false, msg: "User ID is required" };
    }

    if (!walletData.name?.trim()) {
      return { success: false, msg: "Wallet name is required" };
    }

    // Handle image upload if it's a new file
    let imageUrl = walletData.image;
    const filePath = getFilePath(walletData.image);
    
    // If image is explicitly set to null or undefined, it means we want to remove it
    if (walletData.image === null || walletData.image === undefined) {
      imageUrl = null;
    } 
    // If we have a new file to upload
    else if (filePath && typeof filePath === 'string' && filePath.startsWith('file://')) {
      console.log("Uploading wallet image to Cloudinary...");
      const uploadResult = await uploadFileToCloudinary({
        uri: filePath,
        type: 'image/jpeg',
      }, "wallet_icons");

      if (!uploadResult.success) {
        console.error("Wallet image upload failed:", uploadResult.msg);
        return { success: false, msg: "Failed to upload wallet icon" };
      }

      imageUrl = uploadResult.data;
      console.log("Wallet image uploaded successfully:", imageUrl);
    }

    // Prepare wallet data
    const walletToSave = {
      name: walletData.name.trim(),
      image: imageUrl, // This will be null if image was deleted
      amount: walletData.amount || 0,
      uid: userId,
      updated: new Date()
    };

    let result;
    
    if (walletData.id) {
      // Update existing wallet
      console.log("Updating existing wallet...");
      const walletRef = doc(firestore, 'Wallets', walletData.id);
      
      // Get current wallet data
      const walletDoc = await getDoc(walletRef);
      if (!walletDoc.exists()) {
        return { success: false, msg: "Wallet not found" };
      }

      // Update the document
      await updateDoc(walletRef, {
        ...walletToSave,
        // Preserve the creation date
        created: walletDoc.data().created
      });

      result = {
        success: true,
        msg: "Wallet updated successfully",
        data: { id: walletData.id, ...walletToSave, created: walletDoc.data().created }
      };
    } else {
      // Create new wallet
      console.log("Creating new wallet document in Firestore...");
      const walletsRef = collection(firestore, 'Wallets');
      const newWalletRef = await addDoc(walletsRef, {
        ...walletToSave,
        created: new Date()
      });

      result = {
        success: true,
        msg: "Wallet created successfully",
        data: { id: newWalletRef.id, ...walletToSave }
      };
    }

    console.log("Wallet operation completed successfully");
    return result;

  } catch (error: any) {
    console.error("Wallet operation error:", error);
    return {
      success: false,
      msg: error.message || "Failed to save wallet"
    };
  }
};
