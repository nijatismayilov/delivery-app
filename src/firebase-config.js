// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "@firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyB3mwDlUpE2G4pMlnPIeJHv4R7kAqmHKsM",
	authDomain: "tokyo-saga-346015.firebaseapp.com",
	projectId: "tokyo-saga-346015",
	storageBucket: "tokyo-saga-346015.appspot.com",
	messagingSenderId: "1098771352051",
	appId: "1:1098771352051:web:2eef504c6216df795caa86",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
