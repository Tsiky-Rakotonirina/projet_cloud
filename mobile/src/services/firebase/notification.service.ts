import { getToken } from "firebase/messaging";
import { messaging } from "@/services/firebase/firebase";

export const initNotifications = async () => {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    console.log("Notifications refusées");
    return;
  }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_CLOUD_MESSAGING_API_KEY,
  });

  console.log("FCM TOKEN GLOBAL :", token);
};
