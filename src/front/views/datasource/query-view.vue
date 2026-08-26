<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDatasourcesStore } from "../../stores/datasource-store";
import {Card, Button, DataTable, Column, Textarea, Divider, Toast, useToast, Chip} from "primevue";
import {Play, History, Clipboard, Refresh, Trash, Times, Plus} from "@primeicons/vue";

const datasourceStore = useDatasourcesStore();
const toast = useToast();

const query = ref("");
const results = ref<{ fields: string[]; rows: any[]; executionTime: number; rowCount: number } | null>(null);
const error = ref<string | null>(null);
const isLoading = ref(false);
const showHistory = ref(false);
const selectedHistoryQuery = ref<string | null>(null);

const datasource = computed(() => datasourceStore.datasourceChoosen);

async function executeQuery() {
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

          // Sauvegarder dans l'historique
          await window.ipc.send("save-query-history", {
            datasourceId: datasource.value.id,
            query: query.value,
            executedAt: new Date(),
          });

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

async function loadHistory() {
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

async function loadQueryFromHistory(queryText: string) {
  query.value = queryText;
  showHistory.value = false;
  selectedHistoryQuery.value = queryText;
}

async function deleteHistoryItem(id: number) {
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

onMounted(() => {
  if (datasource.value) {
    loadHistory();
  }
});
</script>

<template>
  <div class="query-view p-3 h-full overflow-auto">
    <Toast />
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <span class="flex items-center gap-2">
          <span class="title text-2xl">SQL Query</span>
        </span>
        <div class="flex gap-2">
          <Button
              @click="showHistory = !showHistory"
              v-tooltip.bottom="'Show query history'"
              :severity="showHistory ? 'success' : 'contrast'"
              size="small"
          >
            <History />
            {{showHistory ? 'Hide' : 'Show'}} history
          </Button>
        </div>
      </div>
      <Divider />
    </div>

    <Card v-if="showHistory" class="my-4">
      <template #title>
      <div class="flex justify-between items-center">
        <span class="text-lg title font-medium">Query History</span>
        <Button
            @click="loadHistory"
            v-tooltip.bottom="'Reload history'"
            severity="secondary"
            size="small"
        >
          <Refresh />
          Refresh
        </Button>
      </div>
      </template>
      <template #content>
        <Divider />
        <div class="history-list max-h-64 overflow-y-auto">
          <div
              v-if="datasourceStore.queryHistory && datasourceStore.queryHistory.length > 0"
              v-for="item in datasourceStore.queryHistory"
              :key="item.id"
              class="history-item p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer flex justify-between items-center"
              @click="loadQueryFromHistory(item.query)"
          >
            <div class="flex-1">
              <div class="query-preview text-sm truncate">
                {{ item.query.substring(0, 100) }}{{ item.query.length > 100 ? '...' : '' }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ new Date(item.executed_at).toLocaleString() }}
              </div>
            </div>
            <Button
                @click.stop="deleteHistoryItem(item.id)"
                severity="danger"
                size="small"
                iconOnly
                outlined
            >
              <Times />
            </Button>
          </div>

          <div v-else class="flex flex-col justify-center items-center w-full h-full">
            <div class="text-lg font-light text-gray-400">No history yet...</div>
          </div>
        </div>
      </template>
    </Card>
    
    <Card class="h-full flex flex-col">
      <template #title>
        <div class="flex justify-between items-center">
          <span class="text-lg title font-medium flex items-center gap-2">
            <Play /> SQL Executor
          </span>

        </div>
      </template>
      
      <template #content>
        <Divider />
        
        <!-- Éditeur de requêtes -->
        <div class="flex-1 flex flex-col gap-4 mt-4 min-h-0">
          <div class="flex gap-2">
            <Textarea
              v-model="query"
              placeholder="SELECT * FROM your_table LIMIT 10;"
              class="flex-1 query-input"
              :rows="8"
              autoResize
              @keyup.ctrl.enter="executeQuery"
              @keyup.meta.enter="executeQuery"
            />
          </div>
          
          <!-- Boutons d'action -->
          <div class="flex gap-2">
            <Button
              @click="executeQuery"
              :loading="isLoading"
              :disabled="!query.trim() || !datasource"
              icon="pi pi-play"
              label="Execute"
              severity="success"
              class="flex-1 sm:flex-none"
            />
            <Button
              @click="clearQuery"
              icon="pi pi-times"
              label="Clear"
              severity="secondary"
              :disabled="!query.trim()"
            />
          </div>

          <!-- Message d'erreur -->
          <div v-if="error" class="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i>
              <span class="error-message">{{ error }}</span>
            </div>
          </div>

          <!-- Résultats -->
          <div v-if="results" class="flex-1 min-h-0 overflow-auto">
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
          <div v-if="!results && !error && !isLoading" class="flex-1 flex flex-col justify-center items-center text-gray-400 py-8">
            <i class="pi pi-database text-4xl mb-4"></i>
            <span class="text-lg">Enter a SQL query and click Execute</span>
            <span class="text-sm">Press Ctrl+Enter or Cmd+Enter to execute</span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>

.query-input {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  white-space: pre;
  tab-size: 2;
  line-height: 1.5;
}

.error-message {
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.history-panel {
  margin-top: auto;
}

.history-list {
  max-height: 300px;
}

.history-item {
  transition: background-color 0.2s;
  border-radius: 0.375rem;
}

.history-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.query-preview {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
