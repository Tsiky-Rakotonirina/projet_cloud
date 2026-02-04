import { createApp, h } from 'vue';
import type { Problem } from '@/types/entities';
import ProblemPopupContent from '@/components/ProblemPopupContent.vue';

export const createPopupContent = (problem: Problem): string => {
  // Créer un conteneur temporaire
  const container = document.createElement('div');
  
  // Créer une instance Vue et la monter
  const app = createApp({
    render: () => h(ProblemPopupContent, { problem })
  });
  
  app.mount(container);
  
  // Retourner le HTML généré
  return container.innerHTML;
};
