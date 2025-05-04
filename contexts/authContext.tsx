import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const router = useRouter();
    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged((firebaseUser: User | null) => {
            console.log(firebaseUser)
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName,
                    image: firebaseUser.photoURL,
                });
                updateUserData(firebaseUser.uid);
                router.replace("/(tabs)")
            } else {
                setUser(null);
                router.replace('/(auth)/welcome')
            }
        });

        return () => unsubscribe();
    }, []);


    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error: any) {
            let msg = error.message;
            if (msg.includes('auth/invalid-email')) {
                msg = 'Invalid email address';
            } else if (msg.includes('auth/wrong-password')) {
                msg = 'Invalid password';
            } else if (msg.includes('auth/user-not-found')) {
                msg = 'User not found';
            }
            return { success: false, msg };
        }
    };

    const register = async (email: string, password: string, name: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Create user document in Firestore
            await setDoc(doc(firestore, 'Users', userCredential.user.uid), {
                name,
                email,
                created: new Date(),
            });

            return { success: true };
        } catch (error: any) {
            let msg = error.message;
            if (msg.includes('auth/email-already-in-use')) {
                msg = 'Email already registered';
            } else if (msg.includes('auth/invalid-email')) {
                msg = 'Invalid email address';
            } else if (msg.includes('auth/weak-password')) {
                msg = 'Password should be at least 6 characters';
            }
            return { success: false, msg };
        }
    };

    const updateUserData = async (userId: string) => {
        try {
            if (!userId) {
                console.log('Error: User ID is required');
                return;
            }
    
            const docRef = doc(firestore, 'Users', userId);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
                const data = docSnap.data();
                const userData: UserType = {
                    uid: userId,  // Use the userId parameter instead of data.uid
                    email: data?.email || auth.currentUser?.email || null,
                    name: data?.name || auth.currentUser?.displayName || null,
                    image: data?.image || auth.currentUser?.photoURL || null,
                };
    
                setUser(userData);
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'An unknown error occurred';
            console.log('Error fetching user data:', errorMessage);
        }
    }; 

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            login,
            register,
            updateUserData,
        }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = ():AuthContextType => {
    const context = useContext(AuthContext);
    if (!context){
        throw new Error('useAuth must be wrapped inside AuthProvider')
    }
    return context
}