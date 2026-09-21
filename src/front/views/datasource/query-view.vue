<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useDatasourcesStore} from "../../stores/datasource-store";
import {Button, Card, Column, DataTable, Divider, SplitButton, Toast, useToast} from "primevue";
import {Clipboard, Cog, History, List, Play, Save, Sparkles, Spinner, Trash} from "@primeicons/vue";
import SidebarAside from "primevue/sidebaraside";
import SidebarGroupContent from "primevue/sidebargroupcontent";
import SidebarMenu from "primevue/sidebargroupcontent";
import SidebarMain from "primevue/sidebarmain";
import SidebarMenuItem from "primevue/sidebarmenuitem";
import Sidebar from "primevue/sidebar";
import SidebarPanel from "primevue/sidebarpanel";
import SidebarGroup from "primevue/sidebargroup";
import SidebarSpacer from "primevue/sidebarspacer";
import SidebarLayout from "primevue/sidebarlayout";
import SidebarGroupLabel from "primevue/sidebargrouplabel";
import SidebarContent from "primevue/sidebarcontent";
import {CodeEditor, EditorOptions} from 'monaco-editor-vue3';
import {DatasourceQueryDto} from "../../../commons/data/dto/datasource-query-dto";
import UpsertQueryDialog from "../../components/upsert-query-dialog.vue";
import AiSettingsDialog from "../../components/ai-settings-dialog.vue";
import {useSettingsStore} from "../../stores/settings-store";
import {ParametersEnum} from "../../../commons/data/dto/parameters-enum";

const datasourceStore = useDatasourcesStore();
const settingsStore = useSettingsStore();
const toast = useToast();

const query = ref("");
const results = ref<{ fields: string[]; rows: any[]; executionTime: number; rowCount: number } | null>(null);
const error = ref<string | null>(null);
const selectedHistoryQuery = ref<string | null>(null);
const showHistory = ref(false);
const isLoading = ref(false);
const createQueryDialog = ref(false);
const aiSettingsDialog = ref(false);
const editorOptions = ref({
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
  dimension: {
    height: 200
  }
} as EditorOptions)

const datasource = computed(() => datasourceStore.datasourceChoosen);
const history = computed(() => {
  if(!datasourceStore.queryHistory) return [];
  return datasourceStore.queryHistory;
})
const savedQueries = computed(() => {
  if(!datasourceStore.savedQueries) return [];
  return datasourceStore.savedQueries;
})
// Propriétés réactives pour l'AI (via le store)
const aiResponse = computed(() => datasourceStore.aiResponse);
const isAnalyzing = computed(() => datasourceStore.isAnalyzing);
const aiStreamError = computed(() => datasourceStore.aiStreamError);

function showAiSettings() {
  aiSettingsDialog.value = true;
}

function executeQuery() {
  if (!query.value.trim() || !datasource.value) return;

  isLoading.value = true;
  error.value = null;
  results.value = null;

  datasourceStore.executeQuery(query.value)
      .then(async (res) => {
        if (res.success) {
          results.value = {
            fields: res.fields,
            rows: res.rows,
            executionTime: res.executionTime,
            rowCount: res.rowCount,
          };

          await loadHistory();

          toast.add({
            severity: "success",
            summary: "Query executed successfully",
            detail: `${res.rowCount} rows returned in ${res.executionTime}ms`,
            life: 3000,
          });
        } else {
          error.value = res.error || "Unknown error";
          if (res.code) {
            error.value += ` (${res.code})`;
          }
          toast.add({
            severity: "error",
            summary: "Query failed",
            detail: error.value,
            life: 5000,
          });
        }
      })
      .catch((err) => {
        error.value = err.message;
        toast.add({
          severity: "error",
          summary: "Error",
          detail: err.message,
          life: 5000,
        });
      })
      .finally(() => isLoading.value = false);
}

function loadHistory() {
  if (!datasource.value) return;

  datasourceStore.getQueryHistory(20)
      .catch((err) => {
        console.error("Failed to load history:", err);
        toast.add({
          severity: "error",
          summary: "Failed to load history",
          detail: err.message,
          life: 3000,
        });
      });
}

function loadQueryFromHistory(queryText: string) {
  query.value = queryText;
  showHistory.value = false;
  selectedHistoryQuery.value = queryText;
}

function deleteHistoryItem(id: number) {
  datasourceStore.deleteQueryHistoryItem(id)
      .catch((err) => {
        toast.add({
          severity: "error",
          summary: "Failed to delete history item",
          detail: err.message,
          life: 3000,
        });
      })
}

function copyToClipboard() {
  if (!results.value) return;

  // Créer un CSV simple
  const csv = [
    results.value.fields.join(","),
    ...results.value.rows.map(row =>
      results.value?.fields.map(field => {
        const value = row[field];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(",")
    ),
  ].join("\n");

  navigator.clipboard.writeText(csv);
  toast.add({
    severity: "success",
    summary: "Copied to clipboard",
    detail: `${results.value.rowCount} rows copied as CSV`,
    life: 2000,
  });
}

function clearResults() {
  results.value = null;
  error.value = null;
}

function clearQuery() {
  query.value = "";
}

function formatQuery(item: DatasourceQueryDto) {
  const max = 30;
  return item.query.substring(0, max) + (item.query.length > max ? '...' : '')
}

function formatDate(date: string) {
  let _date = new Date(date);
  return _date.toLocaleDateString() + ' - ' + _date.toLocaleTimeString();
}

function analyzeQuery() {
  const aiApiKeyParameter = settingsStore.getByCode(ParametersEnum.AI_API_KEY);
  if(!aiApiKeyParameter || aiApiKeyParameter.value === '') {
    console.log('no api key')
    toast.add({
      severity: 'error',
      group: 'top-right',
      summary: "Error",
      detail: `No API key provided in settings!`,
      life: 3000,
    });
  } else {
    datasourceStore.startAiAnalysisStream(query.value);
  }
}

function cancelAnalysis() {
  datasourceStore.cancelAiAnalysisStream();
}

onMounted(() => {
  if (datasource.value) {
    loadHistory();
    datasourceStore.getSavedQueries();
  }
}
);
</script>

<template>
  <SidebarLayout v-if="datasource" class="dba-sidebar-layout">
    <Sidebar variant="floating" class="dba-sidebar">
      <SidebarSpacer />
      <SidebarAside>
        <SidebarPanel>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel><List class="mr-2" />Saved queries</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <template v-if="!savedQueries || savedQueries.length === 0">
                    <span class="text-gray-400 text-xs text-center ml-4">Any query retrieved...</span>
                  </template>
                  <Button
                      class="w-full"
                      v-else
                      v-for="(item, index) in savedQueries" :key="index"
                      severity="secondary"
                      text
                      @click="loadQueryFromHistory(item.query)">
                    <span class="text-start w-full">{{item.name}}</span>
                  </Button>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel><History class="mr-2" />Query history</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="(item, index) in history" :key="index">
                    <Button severity="secondary" text class="flex justify-start items-start flex-col h-16 w-full" @click="loadQueryFromHistory(item.query)">
                      <div class="truncate w-full text-start">
                        {{ formatQuery(item) }}
                      </div>
                      <span class="w-full text-start text-xs text-gray-400">{{formatDate(item.executed_at)}}</span>
                    </Button>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </SidebarPanel>
      </SidebarAside>
    </Sidebar>
    <SidebarMain class="dba-sidebar-aside-content mt-2 mr-2 bg-transparent! overflow-auto">
      <!-- Éditeur de requêtes -->
      <div class="flex-1 flex flex-col gap-4 my-4 min-h-0">
        <div class="flex justify-between items-center">
          <span class="text-lg title font-medium flex items-center gap-2">
            SQL Executor
          </span>
          <Button severity="contrast" @click="showAiSettings"><Cog />Settings</Button>
        </div>

        <div class="flex gap-2 sql-editor">
          <CodeEditor
              v-model:value="query"
              language="sql"
              theme="vs-light"
              :options="editorOptions"
          />
        </div>

        <!-- Boutons d'action -->
        <div class="flex gap-2">
          <Button
              @click="executeQuery"
              :loading="isLoading"
              :disabled="!query.trim() || !datasource || isAnalyzing"
              severity="success"
              class="flex-1 sm:flex-none"
          >
            <Play />
            Execute
          </Button>
          <Button
              @click="createQueryDialog = true"
              :loading="isLoading"
              :disabled="!query.trim() || !datasource || isAnalyzing"
              severity="info"
              class="flex-1 sm:flex-none"
          >
            <Save />
            Save
          </Button>
          <Button
              @click="analyzeQuery"
              severity="contrast"
              :disabled="!query.trim() || !datasource || isAnalyzing"
          >
            <Sparkles :spin="isAnalyzing" />Analyze
          </Button>
          <Button
              @click="cancelAnalysis"
              severity="danger"
              :disabled="!isAnalyzing"
              icon="pi pi-times"
              label="Cancel"
          />
          <Button
              @click="clearQuery"
              icon="pi pi-times"
              label="Clear"
              severity="secondary"
              :disabled="!query.trim() || isAnalyzing"
          />
        </div>

        <!-- Message d'erreur -->
        <div v-if="error" class="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800">
          <div class="flex items-center gap-2">
            <i class="pi pi-exclamation-triangle"></i>
            <span class="error-message">{{ error }}</span>
          </div>
        </div>

        <div v-if="aiResponse || isAnalyzing" class="mt-4">
          <Card class="ai-analysis-card max-h-full overflow-auto">
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
        </div>

        <!-- Résultats -->
        <div v-if="results" class="flex-1 min-h-0">
          <Card>
            <template #title>
              <div class="flex justify-between items-center">
                <div class="flex gap-2 items-baseline">
                  <span>Results</span>
                  <span class="text-sm text-gray-500">
                    {{ results.rowCount }} rows in {{ results.executionTime }}ms
                    </span>
                </div>
                <div class="flex gap-2">
                  <Button
                      @click="copyToClipboard"
                      severity="info"
                      :disabled="!results"
                  >
                    <Clipboard />
                    Copy results
                  </Button>
                  <Button
                      @click="clearResults"
                      severity="secondary"
                      :disabled="!results && !error"
                  >
                    <Trash />
                    Clear results
                  </Button>
                </div>
              </div>
            </template>
            <template #content>
              <Divider />
              <DataTable
                  :value="results.rows"
                  stripedRows
                  class="mt-4 max-h-full"
                  scrollable
                  resizableColumns
              >
                <Column v-for="field in results.fields" :key="field" :field="field" :header="field" :sortable="true">
                  <template #body="{ data }">
                    <span class="result-cell">{{ data[field] }}</span>
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>
        </div>

        <!-- Message vide -->
        <div v-if="!results && !error && !isLoading" class="flex-1 flex flex-col justify-center items-center text-gray-400 py-2">
          <i class="pi pi-database text-4xl"></i>
          <span class="text-lg">Enter a SQL query and click Execute</span>
          <span class="text-sm">Press Ctrl+Enter or Cmd+Enter to execute</span>
        </div>
      </div>
    </SidebarMain>
  </SidebarLayout>
  <Toast position="top-right" group="top-right"/>
  <UpsertQueryDialog v-if="createQueryDialog" v-model="createQueryDialog" :initial-query="query" />
  <AiSettingsDialog v-if="aiSettingsDialog" v-model="aiSettingsDialog" />
</template>

<style scoped>
.dba-sidebar-layout {
  min-height: 0 !important;
  background: transparent !important;
}
.dba-sidebar {
  height: 100dvh;
}

.query-input {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  white-space: pre;
  tab-size: 2;
  line-height: 1.5;
}

.sql-editor {
  border: 2px solid #e2e8ef;
  border-radius: 10px;
  box-sizing: border-box;
  overflow: hidden;
}

.error-message {
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.result-cell {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

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
