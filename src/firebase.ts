import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDusf64XGgK3QS904ND-dvAVxu6Bzpe_00",
  authDomain: "midespensa-65251.firebaseapp.com",
  projectId: "midespensa-65251",
  storageBucket: "midespensa-65251.firebasestorage.app",
  messagingSenderId: "1061777491959",
  appId: "1:1061777491959:web:f06e37112324d88fd890f2"
};

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
