<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useDatasourcesStore} from "../../stores/datasource-store";
import {Button, Card, Column, DataTable, Divider, Textarea, useToast} from "primevue";
import {Clipboard, List, Play, Save, History, Trash, Spinner, Sparkles} from "@primeicons/vue";
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
import MarkdownIt from "markdown-it";

const datasourceStore = useDatasourcesStore();
const toast = useToast();

const query = ref("");
const results = ref<{ fields: string[]; rows: any[]; executionTime: number; rowCount: number } | null>(null);
const error = ref<string | null>(null);
const selectedHistoryQuery = ref<string | null>(null);
const aiResponse = ref('');
const isLoading = ref(false);
const isAnalyzing = ref(false);
const showHistory = ref(false);
const createQueryDialog = ref(false);
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

          // Recharger l'historique
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
      results.value.fields.map(field => {
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
  isAnalyzing.value = true;
  datasourceStore.analyzeQuery(query.value)
      .then((res) => {
        const md = new MarkdownIt();
        const message = res.choices[0].message;
        aiResponse.value = md.render(message.content);
      })
      .catch((err) => console.error(err))
      .finally(() => isAnalyzing.value = false)
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
    <SidebarMain class="dba-sidebar-aside-content mt-2 mr-2 bg-transparent!">
      <!-- Éditeur de requêtes -->
      <div class="flex-1 flex flex-col gap-4 mt-4 min-h-0">
        <div class="flex justify-between items-center">
          <span class="text-lg title font-medium flex items-center gap-2">
            SQL Executor
          </span>
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
          <Card>
            <template #title>
              <span class="text-lg title">AI analyze</span>
            </template>
            <template #content>
              <Divider />
              <Spinner v-if="isAnalyzing" spin :size="64" />
              <span v-if="aiResponse" v-html="aiResponse"></span>
            </template>
          </Card>
        </div>

        <!-- Résultats -->
        <div v-if="results" class="flex-1 min-h-0">
          <Card class="h-full">
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
                  class="mt-4"
                  scrollable
                  scrollHeight="flex"
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

  <UpsertQueryDialog v-if="createQueryDialog" v-model="createQueryDialog" :initial-query="query" />
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
  border: 1px solid #a5a5a5;
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
</style>
