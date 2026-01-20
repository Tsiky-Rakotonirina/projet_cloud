import { GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GithubAuthProvider();

export const loginWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Connecté :", result.user);
  } catch (error) {
    console.error("Erreur GitHub auth :", error);
  }
};
