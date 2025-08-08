// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdigLPnTXnMydMuhETkd-I6zUOUdZVhLQ",
  authDomain: "get-margin-transactions.firebaseapp.com",
  projectId: "get-margin-transactions",
  storageBucket: "get-margin-transactions.appspot.com",
  messagingSenderId: "658417983475",
  appId: "1:658417983475:web:6128f74cf231a656193c86",
  measurementId: "G-8Y3DHQMKJY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default { app, db };
