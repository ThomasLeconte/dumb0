// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'

// ✅ Exposer uniquement les méthodes nécessaires via contextBridge
// Cela empêche le rendu d'accéder directement à ipcRenderer ou aux APIs Electron/Node
contextBridge.exposeInMainWorld('ipc', {
    send: (eventName, args) => {
        return ipcRenderer.invoke('send', JSON.stringify({ eventName, args }));
    },
    test: (string) => ipcRenderer.send('test', string)
});

// ❌ NE PAS exposer ipcRenderer directement dans window
// window["ipcRenderer"] = require('electron').ipcRenderer;
