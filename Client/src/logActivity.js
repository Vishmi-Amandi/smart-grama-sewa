import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./modules/firebase";

export const logActivity = async (type, action, title, description = "") => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, "activity_logs"), {
      uid:       user.uid,
      type,
      action,
      title,
      description,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("logActivity error:", err);
  }
};