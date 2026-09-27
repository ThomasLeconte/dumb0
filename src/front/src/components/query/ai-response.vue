<script setup lang="ts">
import {Sparkles, Spinner} from "@primeicons/vue";
import {Card, Divider} from "primevue";
import {computed} from "vue";
import {useDatasourcesStore} from "@/stores/datasource-store.ts";

const datasourceStore = useDatasourcesStore();

// Propriétés réactives pour l'AI (via le store)
const aiResponse = computed(() => datasourceStore.aiResponse);
const isAnalyzing = computed(() => datasourceStore.isAnalyzing);
const aiStreamError = computed(() => datasourceStore.aiStreamError);
</script>

<template>
  <Card v-if="aiResponse || isAnalyzing" class="ai-analysis-card max-h-full overflow-auto">
    <template #title>
      <div class="flex items-center gap-2">
        <Sparkles class="ai-icon" :spin="isAnalyzing" />
        <span class="text-lg font-medium">AI Analysis</span>
      </div>
    </template>
    <template #content>
      <Divider class="ai-divider" />
      <div class="ai-content">
        <Spinner v-if="isAnalyzing" spin :size="48" class="ai-spinner" />
        <div v-if="aiResponse" class="ai-response" v-html="aiResponse"></div>
        <div v-if="aiStreamError" class="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          {{ aiStreamError }}
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
/* AI Analysis Styles */
.ai-analysis-card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.ai-analysis-card :deep(.p-card-content) {
  padding: 0 !important;
}

.ai-analysis-card :deep(.p-card-body) {
  padding: 1.5rem !important;
}

.ai-icon {
  color: #8b5cf6;
  font-size: 1.25rem;
}

.ai-divider {
  margin: 0.5rem 0 1.5rem 0 !important;
  border-color: #e2e8f0 !important;
}

.ai-content {
  position: relative;
  min-height: 100px;
}

.ai-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #8b5cf6;
}

.ai-response {
  line-height: 1.7;
  color: #374151;
}

/* Markdown styling */
.ai-response :deep(h1),
.ai-response :deep(h2),
.ai-response :deep(h3),
.ai-response :deep(h4),
.ai-response :deep(h5),
.ai-response :deep(h6) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #1f2937;
  font-weight: 600;
}

.ai-response :deep(h1) { font-size: 1.75rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
.ai-response :deep(h2) { font-size: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; }
.ai-response :deep(h3) { font-size: 1.25rem; }
.ai-response :deep(h4) { font-size: 1.125rem; }
.ai-response :deep(h5) { font-size: 1rem; }
.ai-response :deep(h6) { font-size: 0.875rem; color: #6b7280; }

.ai-response :deep(p) {
  margin: 0.75rem 0;
  text-align: justify;
}

.ai-response :deep(ul),
.ai-response :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.ai-response :deep(li) {
  margin: 0.25rem 0;
}

.ai-response :deep(li p) {
  margin: 0.25rem 0;
}

.ai-response :deep(blockquote) {
  border-left: 4px solid #8b5cf6;
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: #6b7280;
  font-style: italic;
  background-color: #f9fafb;
}

.ai-response :deep(pre) {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75rem 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

.ai-response :deep(code) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: #8b5cf6;
}

.ai-response :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #e2e8f0;
}

.ai-response :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
  font-size: 0.875rem;
}

.ai-response :deep(th),
.ai-response :deep(td) {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.ai-response :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.ai-response :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

.ai-response :deep(tr:hover) {
  background-color: #f3f4f6;
}

.ai-response :deep(a) {
  color: #8b5cf6;
  text-decoration: underline;
}

.ai-response :deep(a:hover) {
  color: #7c3aed;
}

.ai-response :deep(hr) {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1.5rem 0;
}

.ai-response :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

/* Strong and emphasis */
.ai-response :deep(strong) {
  color: #1f2937;
  font-weight: 600;
}

.ai-response :deep(em) {
  font-style: italic;
  color: #4b5563;
}

/* Lists styling */
.ai-response :deep(ul) {
  list-style-type: disc;
}

.ai-response :deep(ol) {
  list-style-type: decimal;
}

/* Dark mode support */
.dark .ai-response :deep(pre) {
  background-color: #1f2937;
  color: #d1d5db;
}

.dark .ai-response :deep(code) {
  background-color: #374151;
  color: #a78bfa;
}

.dark .ai-response :deep(table) {
  border-color: #374151;
}

.dark .ai-response :deep(th),
.dark .ai-response :deep(td) {
  border-color: #374151;
}

.dark .ai-response :deep(th) {
  background-color: #1f2937;
}

.dark .ai-response :deep(tr:nth-child(even)) {
  background-color: #1f2937;
}

.dark .ai-response :deep(tr:hover) {
  background-color: #374151;
}

.dark .ai-response :deep(blockquote) {
  border-left-color: #a78bfa;
  background-color: #1f2937;
  color: #9ca3af;
}

.dark .ai-response :deep(h1),
.dark .ai-response :deep(h2),
.dark .ai-response :deep(h3),
.dark .ai-response :deep(h4),
.dark .ai-response :deep(h5),
.dark .ai-response :deep(h6) {
  color: #f9fafb;
}

.dark .ai-response :deep(p) {
  color: #d1d5db;
}

.dark .ai-response :deep(hr) {
  border-top-color: #374151;
}
</style>