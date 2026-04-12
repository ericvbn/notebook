const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// 使用当前工作目录作为数据存储目录
const appDataPath = process.cwd();
const dataDir = path.join(appDataPath, 'data');
const indexFile = path.join(dataDir, 'index.json');

// 设置应用的用户数据目录
app.setPath('userData', dataDir);

// 确保应用就绪
app.whenReady().then(() => {
  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 确保索引文件存在
  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, JSON.stringify([]));
  }

  // 创建主窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true
    }
  });

  // 加载主页面
  mainWindow.loadFile('index.html');

  // 创建菜单栏
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('new-note')
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [{ name: 'Markdown 文件', extensions: ['md'] }]
            }).then(result => {
              if (!result.canceled) {
                mainWindow.webContents.send('open-file', result.filePaths[0]);
              }
            });
          }
        },
        {
          label: '打开文件夹',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            dialog.showOpenDialog({
              properties: ['openDirectory']
            }).then(result => {
              if (!result.canceled) {
                mainWindow.webContents.send('open-folder', result.filePaths[0]);
              }
            });
          }
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('save-note')
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            dialog.showSaveDialog({
              filters: [{ name: 'Markdown 文件', extensions: ['md'] }]
            }).then(result => {
              if (!result.canceled) {
                mainWindow.webContents.send('save-as', result.filePath);
              }
            });
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '查看',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '开发者工具', accelerator: 'CmdOrCtrl+I', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'toggleFullScreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // 处理应用激活
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 处理应用关闭
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
