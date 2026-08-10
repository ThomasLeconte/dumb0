import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import PostgresqlService from "./back/postgresql.service";
import {SqliteService} from "./back/sqlite.service";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
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
  SqliteService.init();
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
  const {eventName, args} = JSON.parse(data)
  let result;
  console.log(args)

  switch (eventName) {
    case 'get-datasources':
      result = await SqliteService.getDatasources();
      break;
    case 'create-datasource':
      result = await SqliteService.createDatasource(args);
      break;
    case 'delete-datasource':
      result = await SqliteService.deleteDatasource(args);
      break;
    case 'update-datasource':
      result = await SqliteService.updateDatasource(argss);
      break;
    case 'get-tables':
      result = await PostgresqlService.getTables(args);
      break;
    case 'get-table-stats':
      result = await PostgresqlService.getTableStats(args);
      break;
    case 'get-datasource-stats':
      result = await PostgresqlService.getDatasourceStats(args);
      break;
    default: throw new Error(`Unknown event ${eventName}!`)
  }

  return result;
}
