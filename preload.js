const { contextBridge, ipcRenderer } = require('electron');

// 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 接收主进程消息
  onNewNote: (callback) => ipcRenderer.on('new-note', callback),
  onOpenFile: (callback) => ipcRenderer.on('open-file', callback),
  onOpenFolder: (callback) => ipcRenderer.on('open-folder', callback),
  onSaveNote: (callback) => ipcRenderer.on('save-note', callback),
  onSaveAs: (callback) => ipcRenderer.on('save-as', callback),
  
  // 发送消息给主进程
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options)
});
