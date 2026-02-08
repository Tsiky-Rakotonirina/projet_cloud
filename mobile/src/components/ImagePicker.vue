<template>
  <div class="image-picker">
    <div class="picker-header">
      <div class="picker-title">
        <i class="fas fa-camera"></i>
        <span class="picker-label">Photos ({{ images.length }}/{{ maxImages }})</span>
      </div>
      <span class="picker-hint">Ajoutez jusqu'à {{ maxImages }} photos</span>
    </div>

    <!-- Images sélectionnées -->
    <div v-if="images.length > 0" class="images-preview">
      <div 
        v-for="(image, index) in images" 
        :key="index" 
        class="image-item"
      >
        <img :src="image.preview" :alt="`Photo ${index + 1}`" class="image-preview" />
        <button class="btn-remove" @click="removeImage(index)" type="button">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Boutons d'ajout -->
    <div v-if="images.length < maxImages" class="add-buttons">
      <button class="btn-add btn-camera" @click="handleTakePhoto" :disabled="isLoading" type="button">
        <i class="fas fa-camera"></i>
        <span>Prendre une photo</span>
      </button>
      <button class="btn-add btn-gallery" @click="handleSelectGallery" :disabled="isLoading" type="button">
        <i class="fas fa-folder-open"></i>
        <span>Choisir depuis galerie</span>
      </button>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="loader">
      <div class="loader-spinner"></div>
      <span>Traitement de l'image...</span>
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
  background: #F8FAFC;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #E2E8F0;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E2E8F0;
}

.picker-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.picker-title i {
  font-size: 18px;
  color: #274c77;
}

.picker-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.picker-hint {
  font-size: 12px;
  color: #6B7280;
  font-style: italic;
}

.images-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.image-item {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #E2E8F0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  background: rgba(239, 68, 68, 0.95);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-remove:hover {
  background: #EF4444;
  transform: scale(1.1);
}

.btn-remove i {
  font-size: 11px;
}

.add-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 14px 20px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add i {
  font-size: 18px;
}

.btn-add span {
  font-size: 14px;
  font-weight: 600;
}

.btn-camera {
  background: linear-gradient(135deg, #274c77 0%, #1d3a5c 100%);
  color: #FFFFFF;
}

.btn-camera:hover:not(:disabled) {
  background: linear-gradient(135deg, #355a87 0%, #274c77 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(39, 76, 119, 0.3);
}

.btn-gallery {
  background: rgba(39, 76, 119, 0.08);
  color: #274c77;
  border: 1px solid rgba(39, 76, 119, 0.2);
}

.btn-gallery:hover:not(:disabled) {
  background: rgba(39, 76, 119, 0.15);
  border-color: #274c77;
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  color: #6B7280;
  font-size: 14px;
}

.loader-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(39, 76, 119, 0.2);
  border-top-color: #274c77;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
