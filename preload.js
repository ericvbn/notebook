const { contextBridge, ipcRenderer } = require('electron');

// 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 接收主进程消息
  onNewNote: (callback) => ipcRenderer.on('new-note', (event) => callback()),
  onOpenFile: (callback) => ipcRenderer.on('open-file', (event, data) => callback(data)),
  onOpenFolder: (callback) => ipcRenderer.on('open-folder', (event, folderPath) => callback(folderPath)),
  onSaveNote: (callback) => ipcRenderer.on('save-note', (event) => callback()),
  onSaveAs: (callback) => ipcRenderer.on('save-as', (event, filePath) => callback(filePath)),
  onFolderFiles: (callback) => ipcRenderer.on('folder-files', (event, files) => callback(files)),
  
  // 发送消息给主进程
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  saveHtmlFile: (filePath, content) => ipcRenderer.send('save-html-file', { filePath, content }),
  readFolder: (folderPath) => ipcRenderer.send('read-folder', folderPath),
  readFile: (filePath) => ipcRenderer.send('read-file', filePath)
});
