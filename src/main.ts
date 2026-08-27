import {app, BrowserWindow, dialog, ipcMain, safeStorage} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import PostgresqlService from "./back/postgresql.service";
import {SqliteService} from "./back/sqlite.service";
import {QueryService} from "./back/query.service";
import {IpcRoutes} from "./commons/ipc-routes";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'DBA-APP',
    width: 1000,
    height: 800,
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
  // Vrifier si le chiffrement est disponible (ncessaire pour scuriser les mots de passe)
  if (!safeStorage.isEncryptionAvailable()) {
    console.error(
      '\u274c ERREUR CRITIQUE: Le chiffrement des donnes sensibles n\'est pas disponible sur cette machine.'
    );

    // Afficher une bote de dialogue d'erreur avant de quitter
    await dialog.showErrorBox(
      'Erreur de scurit',
      'Le chiffrement des donnes sensibles n\'est pas disponible sur cette machine. ' +
      'L\'application ne peut pas dmarrer sans cette protection. ' +
      'Veuillez vrifier que votre systme d\'exploitation est  jour.'
    );
    app.quit();
    return;
  }

  // Initialiser SQLiteService (va vrifier/creer le dossier de donnes)
  try {
    SqliteService.init();
  } catch (err) {
    console.error('\u274c ERREUR CRITIQUE:', err);

    // Afficher une bote de dialogue d'erreur pour le dossier de donnes
    await dialog.showErrorBox(
      'Erreur de stockage',
      'Impossible de crer le dossier de stockage des donnes. ' +
      'Vrifiez les permissions d\'\u001e9criture dans votre profil utilisateur.'
    );
    app.quit();
    return;
  }

  ipcMain.handle('send', async (event, args) => {
    return handleMessageIncoming(event, args);
  })

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
      result = await QueryService.saveQuery(args);
      break;
    case IpcRoutes.APP_SET_TITLE:
      updateTitle(args);
      break;
    default: throw new Error(`Unknown event ${eventName}!`)
  }

  return result;
}

function updateTitle(args: any) {
  const {title} = args;
  mainWindow.setTitle(title);
}
