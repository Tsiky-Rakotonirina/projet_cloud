<template>
  <div class="image-picker">
    <div class="picker-header">
      <label class="picker-label">
        <i class="fas fa-camera"></i>
        Photos ({{ images.length }}/{{ maxImages }})
      </label>
      <span class="picker-hint">Ajoutez jusqu'à {{ maxImages }} photos</span>
    </div>

    <!-- Grille des images -->
    <div class="images-grid">
      <!-- Images sélectionnées -->
      <div 
        v-for="(image, index) in images" 
        :key="index" 
        class="image-item"
      >
        <img :src="image.preview" :alt="`Photo ${index + 1}`" class="image-preview" />
        <button class="btn-remove" @click="removeImage(index)">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Boutons d'ajout si pas au max -->
      <div v-if="images.length < maxImages" class="add-buttons">
        <button class="btn-add" @click="handleTakePhoto" :disabled="isLoading">
          <i class="fas fa-camera"></i>
          <span>Photo</span>
        </button>
        <button class="btn-add btn-gallery" @click="handleSelectGallery" :disabled="isLoading">
          <i class="fas fa-images"></i>
          <span>Galerie</span>
        </button>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="loader">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Traitement...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { takePhoto, selectImagesFromGallery, MAX_IMAGES_ALLOWED } from '@/services/imageService';

interface ImageItem {
  file: File | Blob;
  preview: string;
}

const props = defineProps<{
  modelValue: (File | Blob)[];
  maxImages?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: (File | Blob)[]): void;
}>();

const maxImages = computed(() => props.maxImages || MAX_IMAGES_ALLOWED);
const isLoading = ref(false);

const images = ref<ImageItem[]>([]);

// Créer une prévisualisation pour un fichier
const createPreview = (file: File | Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
};

// Mettre à jour le modèle parent
const updateModelValue = () => {
  emit('update:modelValue', images.value.map(img => img.file));
};

// Prendre une photo
const handleTakePhoto = async () => {
  if (images.value.length >= maxImages.value) return;
  
  isLoading.value = true;
  try {
    const photo = await takePhoto();
    if (photo) {
      const preview = await createPreview(photo);
      images.value.push({ file: photo, preview });
      updateModelValue();
    }
  } catch (error) {
    console.error('Erreur lors de la prise de photo:', error);
  } finally {
    isLoading.value = false;
  }
};

// Sélectionner depuis la galerie
const handleSelectGallery = async () => {
  if (images.value.length >= maxImages.value) return;
  
  isLoading.value = true;
  try {
    const remaining = maxImages.value - images.value.length;
    const files = await selectImagesFromGallery();
    
    // Limiter au nombre restant
    const filesToAdd = files.slice(0, remaining);
    
    for (const file of filesToAdd) {
      const preview = await createPreview(file);
      images.value.push({ file, preview });
    }
    
    updateModelValue();
  } catch (error) {
    console.error('Erreur lors de la sélection:', error);
  } finally {
    isLoading.value = false;
  }
};

// Supprimer une image
const removeImage = (index: number) => {
  images.value.splice(index, 1);
  updateModelValue();
};

// Réinitialiser les images
const reset = () => {
  images.value = [];
  updateModelValue();
};

// Exposer la méthode reset pour le parent
defineExpose({ reset });
</script>

<style scoped>
.image-picker {
  margin-bottom: 20px;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.picker-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.picker-label i {
  color: #87BCDE;
}

.picker-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(135, 188, 222, 0.3);
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #EF4444;
  transform: scale(1.1);
}

.btn-remove i {
  font-size: 12px;
}

.add-buttons {
  display: flex;
  gap: 8px;
}

.btn-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  border: 2px dashed rgba(135, 188, 222, 0.4);
  background: rgba(135, 188, 222, 0.1);
  color: #87BCDE;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover:not(:disabled) {
  border-color: #87BCDE;
  background: rgba(135, 188, 222, 0.2);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add i {
  font-size: 24px;
}

.btn-add span {
  font-size: 12px;
  font-weight: 500;
}

.btn-gallery {
  border-color: rgba(128, 94, 115, 0.4);
  background: rgba(128, 94, 115, 0.1);
  color: #805E73;
}

.btn-gallery:hover:not(:disabled) {
  border-color: #805E73;
  background: rgba(128, 94, 115, 0.2);
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.loader i {
  color: #87BCDE;
}
</style>
