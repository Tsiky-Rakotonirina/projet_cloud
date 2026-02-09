<template>
  <div class="loader-container" :class="{ 'loader-overlay': variant === 'overlay' }">
    <div v-if="variant === 'pulse'" class="pulse-loader" :style="{ width: spinnerSize + 'px', height: spinnerSize + 'px' }">
      <div class="pulse-inner" :style="{ width: (spinnerSize * 0.4) + 'px', height: (spinnerSize * 0.4) + 'px' }"></div>
      <div class="pulse-ripple" :style="{ width: spinnerSize + 'px', height: spinnerSize + 'px' }"></div>
    </div>
    <div v-else class="dots-loader">
      <div 
        v-for="i in 3" 
        :key="i" 
        class="dot" 
        :style="{ 
          width: dotSize + 'px', 
          height: dotSize + 'px',
          animationDelay: ((i - 1) * 0.16) + 's'
        }"
      ></div>
    </div>
    <span v-if="text" class="loader-text" :class="{ 'text-overlay': variant === 'overlay' }">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  size?: 'small' | 'medium' | 'large';
  text?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'overlay';
}>(), {
  size: 'medium',
  text: 'Chargement...',
  variant: 'default'
});

const sizes = {
  small: { spinner: 28, dot: 6 },
  medium: { spinner: 40, dot: 8 },
  large: { spinner: 56, dot: 10 }
};

const spinnerSize = computed(() => sizes[props.size].spinner);
const dotSize = computed(() => sizes[props.size].dot);
</script>

<style scoped>
.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 60px 40px;
}

.loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  z-index: 100;
}

/* Dots loader - same as web */
.dots-loader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  border-radius: 50%;
  background: linear-gradient(135deg, #274c77, #6096ba);
  animation: bounce 1.4s ease-in-out infinite;
}

/* Pulse loader */
.pulse-loader {
  position: relative;
}

.pulse-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: linear-gradient(135deg, #274c77, #6096ba);
  animation: pulse 1.5s ease-in-out infinite;
}

.pulse-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid #274c77;
  animation: ripple 1.5s ease-out infinite;
}

/* Text */
.loader-text {
  color: #6B7280;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.text-overlay {
  color: #1a1a2e;
}

/* Animations */
@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0); 
    opacity: 0.5; 
  }
  40% { 
    transform: scale(1); 
    opacity: 1; 
  }
}

@keyframes pulse {
  0% { 
    transform: translate(-50%, -50%) scale(0.8); 
    opacity: 1; 
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.2); 
    opacity: 0.5; 
  }
  100% { 
    transform: translate(-50%, -50%) scale(0.8); 
    opacity: 1; 
  }
}

@keyframes ripple {
  0% { 
    transform: translate(-50%, -50%) scale(0.8); 
    opacity: 1; 
  }
  100% { 
    transform: translate(-50%, -50%) scale(2.4); 
    opacity: 0; 
  }
}
</style>
