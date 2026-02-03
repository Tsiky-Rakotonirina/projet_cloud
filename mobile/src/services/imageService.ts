import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "@/services/firebase/firebase";

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
  blob?: Blob;
}

export interface UploadedImage {
  url: string;
  name: string;
  path: string;
}

const MAX_IMAGES = 3;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.7;

/**
 * Compresse une image avant upload
 */
export const compressImage = async (file: File | Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculer les nouvelles dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Image compressée: ${(blob.size / 1024).toFixed(2)} KB`);
              resolve(blob);
            } else {
              reject(new Error('Échec de la compression'));
            }
          },
          'image/jpeg',
          QUALITY
        );
      };
      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload une image vers Firebase Storage
 */
export const uploadImage = async (
  file: File | Blob,
  signalementId: string,
  index: number
): Promise<UploadedImage> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  // Compresser l'image
  const compressedBlob = await compressImage(file);

  // Générer un nom unique pour l'image
  const timestamp = Date.now();
  const fileName = `${signalementId}_${timestamp}_${index}.jpg`;
  const path = `signalements/${signalementId}/${fileName}`;

  // Créer la référence dans Firebase Storage
  const storageRef = ref(storage, path);

  // Upload l'image
  const snapshot = await uploadBytes(storageRef, compressedBlob, {
    contentType: 'image/jpeg',
  });

  // Récupérer l'URL de téléchargement
  const url = await getDownloadURL(snapshot.ref);

  console.log(`Image uploadée: ${path}`);

  return {
    url,
    name: fileName,
    path,
  };
};

/**
 * Upload plusieurs images pour un signalement
 */
export const uploadSignalementImages = async (
  files: (File | Blob)[],
  signalementId: string
): Promise<UploadedImage[]> => {
  if (files.length > MAX_IMAGES) {
    throw new Error(`Maximum ${MAX_IMAGES} images autorisées`);
  }

  const uploadPromises = files.map((file, index) =>
    uploadImage(file, signalementId, index)
  );

  const results = await Promise.all(uploadPromises);
  console.log(`${results.length} images uploadées pour le signalement ${signalementId}`);

  return results;
};

/**
 * Convertit un Data URL en Blob
 */
export const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Ouvre le sélecteur de fichiers pour choisir des images
 */
export const selectImagesFromGallery = (): Promise<File[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (files && files.length > 0) {
        const fileArray = Array.from(files).slice(0, MAX_IMAGES);
        resolve(fileArray);
      } else {
        resolve([]);
      }
    };

    input.onerror = () => reject(new Error('Erreur lors de la sélection'));
    input.click();
  });
};

/**
 * Prend une photo avec la caméra (utilise l'input file avec capture)
 */
export const takePhoto = (): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Utilise la caméra arrière

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      
      if (files && files.length > 0) {
        resolve(files[0]);
      } else {
        resolve(null);
      }
    };

    input.onerror = () => reject(new Error('Erreur lors de la capture'));
    input.click();
  });
};

export const MAX_IMAGES_ALLOWED = MAX_IMAGES;
