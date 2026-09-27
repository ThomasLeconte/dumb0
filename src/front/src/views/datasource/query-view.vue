<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import * as monaco from "monaco-editor";
import {useTablesStore} from "@/stores/tables-store.ts";
import {useDatasourcesStore} from "@/stores/datasource-store.ts";
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
import {DatasourceQueryDto} from "../../../../commons/data/dto/datasource-query-dto.ts";
import UpsertQueryDialog from "../../components/upsert-query-dialog.vue";
import AiSettingsDialog from "../../components/ai-settings-dialog.vue";
import {useSettingsStore} from "@/stores/settings-store.ts";
import {ParametersEnum} from "../../../../commons/data/dto/parameters-enum.ts";
import {usePostHog} from "@/composables/use-posthog.ts";
import {useRouter} from "vue-router";
import AiResponse from "@/components/query/ai-response.vue";

const datasourceStore = useDatasourcesStore();
const tablesStore = useTablesStore();
const settingsStore = useSettingsStore();
const toast = useToast();
const {posthog} = usePostHog();
const router = useRouter();

let sqlCompletionProvider: monaco.IDisposable | null = null;

function registerSqlCompletion() {
  sqlCompletionProvider = monaco.languages.registerCompletionItemProvider("sql", {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const tableSuggestions = tablesStore.tables.map((table) => ({
        label: table,
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: table,
        detail: "Table",
        range: range,
      }));

      const sqlKeywords = ['SELECT', 'JOIN', 'FROM', 'HAVING', 'GROUP BY', 'ORDER BY', 'DISTINCT', 'COUNT', 'IN'];

      const sqlSuggestions = sqlKeywords.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Enum,
        insertText: keyword,
        detail: "Keyword",
        range: range,
      }));

      return { suggestions: [...tableSuggestions, ...sqlSuggestions] };
    },
  });
}

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

onMounted(() => {
  if(!datasourceStore.datasourceChoosen) router.push({name: 'home'});
  if (datasource.value) {
    loadHistory();
    datasourceStore.getSavedQueries();
    registerSqlCompletion();
  }
});

onUnmounted(() => {
  sqlCompletionProvider?.dispose();
  sqlCompletionProvider = null;
});

const datasource = computed(() => datasourceStore.datasourceChoosen);
const history = computed(() => {
  if(!datasourceStore.queryHistory) return [];
  return datasourceStore.queryHistory;
})
const savedQueries = computed(() => {
  if(!datasourceStore.savedQueries) return [];
  return datasourceStore.savedQueries;
})
const isAnalyzing = computed(() => datasourceStore.isAnalyzing);

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
  if(!aiApiKeyParameter || !aiApiKeyParameter.value || aiApiKeyParameter.value === '') {
    console.log('no api key')
    toast.add({
      severity: 'error',
      group: 'top-right',
      summary: "Error",
      detail: `No API key provided in settings!`,
      life: 5000,
    });
  } else {
    posthog.capture('analyze_query');
    datasourceStore.startAiAnalysisStream(query.value);
  }
}

function cancelAnalysis() {
  posthog.capture('cancel_analyze_query');
  datasourceStore.cancelAiAnalysisStream();
}
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
                      class="w-full ph-no-capture"
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

        <div class="mt-4">
          <AiResponse />
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
        <div v-if="!results && !error && !isAnalyzing && !isLoading" class="flex-1 flex flex-col justify-center items-center text-gray-400 py-2">
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
</style>
