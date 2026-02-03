import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "@/services/firebase/firebase";
import { db } from "@/services/firebase/firebase";
import type { Problem, Entreprise, ProblemeStatut, Signalement } from "@/types/entities";

