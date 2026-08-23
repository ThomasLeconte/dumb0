// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipc', {
    send: (eventName, args) => {
        return ipcRenderer.invoke('send', JSON.stringify({ eventName, args }));
    },
    test: (string) => ipcRenderer.send('test', string)
});
