import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import PostgresqlService from "./back/postgresql.service";
import {SqliteService} from "./back/sqlite.service";
import {QueryService} from "./back/query.service";
import {IpcRoutes} from "./commons/ipc-routes";
import {AiService} from "./back/ai.service";
import {ParametersService} from "./back/parameters.service";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow;

const windowMap = new Map<number, Electron.WebContents>();

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'DUMBØ',
    width: 1000,
    height: 800,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.webContents.openDevTools();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(`../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  try {
    CryptoService.init();
  } catch (err) {
    console.error('\u274c ERREUR CRITIQUE: Impossible d\'initialiser le chiffrement.', err);
    await dialog.showErrorBox(
      'Erreur de s\u00e9curit\u00e9',
      'Impossible d\'initialiser le chiffrement des donn\u00e9es sensibles. ' +
      'V\u00e9rifiez les permissions d\'écriture dans votre dossier utilisateur.'
    );
    app.quit();
    return;
  }

  try {
    SqliteService.init();
  } catch (err) {
    console.error('\u274c ERREUR CRITIQUE:', err);

    await dialog.showErrorBox(
      'Erreur de stockage',
      'Impossible de créer le dossier de stockage des données. ' +
      'Vérifiez les permissions d\'écriture dans votre profil utilisateur.'
    );
    app.quit();
    return;
  }

  ipcMain.handle('send', async (event, args) => {
    const windowId = event.sender.id;
    if (!windowMap.has(windowId)) {
      windowMap.set(windowId, event.sender);
    }
    return handleMessageIncoming(event, args);
  });

  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

async function handleMessageIncoming(event, data) {
  const {eventName, args} = JSON.parse(data) as { eventName: IpcRoutes, args: any };
  let result;
  console.log(args)

  switch (eventName) {
    case IpcRoutes.DATASOURCE_GET_ALL:
      result = await SqliteService.getDatasources();
      break;
    case IpcRoutes.DATASOURCE_CREATE:
      result = await SqliteService.createDatasource(args);
      break;
    case IpcRoutes.DATASOURCE_DELETE:
      result = await SqliteService.deleteDatasource(args);
      break;
    case IpcRoutes.DATASOURCE_UPDATE:
      result = await SqliteService.updateDatasource(args);
      break;
    case IpcRoutes.TABLES_GET_ALL:
      result = await PostgresqlService.getTables(args);
      break;
    case IpcRoutes.TABLES_GET_STATS:
      result = await PostgresqlService.getTableStats(args);
      break;
    case IpcRoutes.DATASOURCE_GET_STATS:
      result = await PostgresqlService.getDatasourceStats(args);
      break;
    case IpcRoutes.DATASOURCE_EXECUTE_QUERY:
      result = await QueryService.executeQuery(args);
      break;
    case IpcRoutes.DATASOURCE_GET_QUERY_HISTORY:
      result = await QueryService.getQueryHistory(args);
      break;
    case IpcRoutes.DATASOURCE_DELETE_QUERY_HISTORY:
      result = await QueryService.deleteQueryHistory(args);
      break;
    case IpcRoutes.DATASOURCE_GET_SAVED_QUERIES:
      result = await QueryService.getSavedQueries(args);
      break;
    case IpcRoutes.DATASOURCE_CREATE_SAVED_QUERY:
      result = await QueryService.saveQuery(args);
      break;
    case IpcRoutes.DATASOURCE_UPDATE_SAVED_QUERY:
      result = await QueryService.saveQuery(args);
      break;
    case IpcRoutes.DATASOURCE_DELETE_SAVED_QUERY:
      result = await QueryService.deleteQuery(args);
      break;
    case IpcRoutes.DATASOURCE_ASK_AI_QUERY:
      result = await AiService.analyzeQuery(args);
      break;
    case IpcRoutes.PARAMETERS_GET_ALL:
      result = await ParametersService.getAll();
      break;
    case IpcRoutes.PARAMETERS_UPDATE_ITEM:
      result = await ParametersService.updateParameterByCode(args);
      break;
    case IpcRoutes.PARAMETERS_GET_AVAILABLE_COUNTRIES:
      result = await ParametersService.getAvailableCountries();
      break;
    // Streaming AI
    case IpcRoutes.DATASOURCE_ASK_AI_QUERY_STREAM_START:
      result = await handleAiStreamStart(event, args);
      break;
    case IpcRoutes.DATASOURCE_ASK_AI_QUERY_STREAM_CANCEL:
      result = await handleAiStreamCancel(args);
      break;
    case IpcRoutes.APP_SET_TITLE:
      updateTitle(args);
      break;
    default: throw new Error(`Unknown event ${eventName}!`)
  }

  return result;
}

/**
 * Gère le démarrage d'un stream AI
 */
async function handleAiStreamStart(event, args: { query: string; datasourceId?: string; requestId: string }): Promise<{ requestId: string }> {
  const { query, datasourceId, requestId } = args;

  // Démarrer le stream via AiService
  AiService.startStream(
      requestId,
      { query, datasourceId },
      (chunk) => {
          // Envoyer le chunk à toutes les fenêtres
          for (const [windowId, webContents] of Array.from(windowMap.entries())) {
              webContents.send(`ai-stream-chunk-${requestId}`, { chunk });
          }
      }
  ).then(() => {
      // Envoyer un événement de fin à toutes les fenêtres
      for (const [windowId, webContents] of Array.from(windowMap.entries())) {
          webContents.send(`ai-stream-end-${requestId}`);
      }
  }).catch((error) => {
      // Envoyer un événement d'erreur à toutes les fenêtres
      for (const [windowId, webContents] of Array.from(windowMap.entries())) {
          webContents.send(`ai-stream-error-${requestId}`, {
              error: error instanceof Error ? error.message : String(error)
          });
      }
  });

  return { requestId };
}

/**
 * Gère l'annulation d'un stream AI
 */
async function handleAiStreamCancel(args: { requestId: string }): Promise<void> {
  const { requestId } = args;
  AiService.cancelStream(requestId);
}

function updateTitle(args: any) {
  const {title} = args;
  mainWindow.setTitle(title);
}
