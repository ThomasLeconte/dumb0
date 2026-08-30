// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipc', {
    send: (eventName, args) => {
        return ipcRenderer.invoke('send', JSON.stringify({ eventName, args }));
    },
    test: (string) => ipcRenderer.send('test', string)
});

// Exposer les méthodes pour le streaming AI
contextBridge.exposeInMainWorld('electronAPI', {
    send: (eventName, args) => {
        return ipcRenderer.invoke('send', JSON.stringify({ eventName, args }));
    },
    // Méthodes pour écouter les événements de streaming
    onAiStreamChunk: (requestId, callback) => {
        ipcRenderer.on(`ai-stream-chunk-${requestId}`, (_, { chunk }) => {
            callback(chunk);
        });
    },
    onAiStreamEnd: (requestId, callback) => {
        ipcRenderer.on(`ai-stream-end-${requestId}`, callback);
    },
    onAiStreamError: (requestId, callback) => {
        ipcRenderer.on(`ai-stream-error-${requestId}`, (_, { error }) => {
            callback(error);
        });
    },
    // Méthodes pour se désabonner
    offAiStreamChunk: (requestId, callback) => {
        ipcRenderer.off(`ai-stream-chunk-${requestId}`, callback);
    },
    offAiStreamEnd: (requestId, callback) => {
        ipcRenderer.off(`ai-stream-end-${requestId}`, callback);
    },
    offAiStreamError: (requestId, callback) => {
        ipcRenderer.off(`ai-stream-error-${requestId}`, callback);
    },
});
