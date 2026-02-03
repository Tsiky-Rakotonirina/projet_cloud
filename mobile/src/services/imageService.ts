import { auth } from "@/services/firebase/firebase";

export interface UploadedImage {
  base64: string;  // Image en base64
  name: string;
  size: number;    // Taille en KB
}

const MAX_IMAGES = 3;
// Taille max plus petite pour Firestore (document max 1MB)
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const QUALITY = 0.6;  // Qualité réduite pour garder des fichiers petits

/**
 * Compresse une image et retourne le base64
 */
export const compressImageToBase64 = async (file: File | Blob): Promise<{ base64: string; size: number }> => {
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

        // Convertir en base64
        const base64 = canvas.toDataURL('image/jpeg', QUALITY);
        const sizeKB = Math.round((base64.length * 3) / 4 / 1024); // Estimation taille
        
        console.log(`Image compressée: ${sizeKB} KB (${width}x${height})`);
        resolve({ base64, size: sizeKB });
      };
      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
};

/**
 * Prépare les images pour Firestore (compression + base64)
 */
export const prepareImagesForFirestore = async (
  files: (File | Blob)[]
): Promise<UploadedImage[]> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Utilisateur non connecté");
  }

  if (files.length > MAX_IMAGES) {
    throw new Error(`Maximum ${MAX_IMAGES} images autorisées`);
  }

  const results: UploadedImage[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const timestamp = Date.now();
    const fileName = `img_${timestamp}_${i}.jpg`;
    
    const { base64, size } = await compressImageToBase64(file);
    
    results.push({
      base64,
      name: fileName,
      size
    });
  }

  // Vérifier la taille totale (Firestore limite à ~1MB par document)
  const totalSize = results.reduce((acc, img) => acc + img.size, 0);
  if (totalSize > 900) { // 900KB max pour laisser de la marge
    throw new Error(`Images trop volumineuses (${totalSize}KB). Essayez avec des images plus petites.`);
  }

  console.log(`${results.length} images préparées (${totalSize}KB total)`);
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
