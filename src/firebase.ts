import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, update, remove, push, child } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://gmxlabtr-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Export firebase functions for easy access
export { ref, set, onValue, get, update, remove, push, child };
