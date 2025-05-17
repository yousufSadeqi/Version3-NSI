// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import {initializeAuth, getReactNativePersistence} from 'firebase/auth'
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVnctAitRB1hlNkL7qG_XhME8jbURJ3T8",
  authDomain: "expensify-1fa96.firebaseapp.com",
  projectId: "expensify-1fa96",
  storageBucket: "expensify-1fa96.firebasestorage.app",
  messagingSenderId: "356549599050",
  appId: "1:356549599050:web:fd8367f7561d7b9df8ebb3",
  measurementId: "G-J0YED5Q6Y6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


//auth
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
})

//datbase
export const firestore = getFirestore(app);
export const storage = getStorage(app);