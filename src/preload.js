// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'

window["ipcRenderer"] = require('electron').ipcRenderer;

contextBridge.exposeInMainWorld('ipc', {
    send: async (eventName, data) => {
        const result = await ipcRenderer.invoke('send', JSON.stringify({eventName, data}));
        return result;
    },
    test: (string) => ipcRenderer.send('test', string)
})
