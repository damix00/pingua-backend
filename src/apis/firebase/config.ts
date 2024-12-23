import admin from "firebase-admin";
import path from "path";

// Initialize Firebase Admin SDK
export default async function initFirebase() {
    admin.initializeApp({
        credential: admin.credential.cert(
            path.join(__dirname, "../../../", "secrets", "firebase_admin.json")
        ),
    });
}
