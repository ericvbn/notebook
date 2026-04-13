const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// 使用当前工作目录作为数据存储目录
const appDataPath = process.cwd();
const dataDir = path.join(appDataPath, 'data');
const indexFile = path.join(dataDir, 'index.json');

// 设置应用的用户数据目录
app.setPath('userData', dataDir);

// 全局变量
let mainWindow;

// 创建窗口函数
function createWindow() {
  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 确保索引文件存在
  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, JSON.stringify([]));
  }

  // 创建主窗口
  mainWindow = new BrowserWindow({
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
          click: () => {
            console.log('发送 new-note 事件');
            mainWindow.webContents.send('new-note');
          }
        },
        {          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [{ name: 'Markdown 文件', extensions: ['md'] }]
            }).then(result => {
              if (!result.canceled) {
                // 使用 path 模块处理文件路径，确保编码与系统一致
                const filePath = path.resolve(result.filePaths[0]);
                console.log('filePath:', filePath); 
                
                try {
                  // 读取文件内容
                  const content = fs.readFileSync(filePath, 'utf8');
                  console.log('content:', content);
                  // 发送文件路径和内容到渲染进程
                  console.log('发送 open-file 事件');
                  mainWindow.webContents.send('open-file', { filePath, content });
                } catch (error) {
                  console.error('读取文件失败:', error);
                  dialog.showMessageBox({
                    type: 'error',
                    title: '错误',
                    message: '读取文件失败',
                    detail: error.message
                  });
                }
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
                console.log('发送 open-folder 事件');
                mainWindow.webContents.send('open-folder', result.filePaths[0]);
              }
            });
          }
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            console.log('发送 save-note 事件');
            mainWindow.webContents.send('save-note');
          }
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            dialog.showSaveDialog({
              filters: [{ name: 'Markdown 文件', extensions: ['md'] }]
            }).then(result => {
              if (!result.canceled) {
                console.log('发送 save-as 事件');
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
}

// 生成 HTML 内容
function generateHtml(content, title) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  <div data-tag="${title}">${content}</div>
</body>
</html>`;
}

// 确保应用就绪
app.whenReady().then(() => {
  createWindow();

  // 应用启动时读取 newNote 目录
  const newNoteDir = path.join(dataDir, 'newNote');
  if (fs.existsSync(newNoteDir)) {
    try {
      // 读取目录中的文件
      const files = fs.readdirSync(newNoteDir);
      // 过滤出 Markdown 文件
      const mdFiles = files.filter(file => file.endsWith('.md'));
      // 构建文件路径数组
      const filePaths = mdFiles.map(file => path.join(newNoteDir, file));
      console.log('读取 newNote 目录成功:', newNoteDir, filePaths);
      // 发送文件列表到渲染进程
      setTimeout(() => {
        mainWindow.webContents.send('folder-files', filePaths);
      }, 1000); // 延迟发送，确保窗口已完全加载
    } catch (error) {
      console.error('读取 newNote 目录失败:', error);
    }
  }

  // 处理渲染进程请求打开文件
  ipcMain.on('request-open-file', () => {
    dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown 文件', extensions: ['md'] }]
    }).then(result => {
      if (!result.canceled) {
        const filePath = path.resolve(result.filePaths[0]);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          mainWindow.webContents.send('open-file', { filePath, content });
        } catch (error) {
          console.error('读取文件失败:', error);
        }
      }
    });
  });

  // 处理渲染进程请求打开文件夹
  ipcMain.on('request-open-folder', () => {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }).then(result => {
      if (!result.canceled) {
        mainWindow.webContents.send('open-folder', result.filePaths[0]);
      }
    });
  });

  // 处理保存 HTML 文件的请求
  ipcMain.on('save-html-file', (event, data) => {
    const { filePath, content } = data;
    try {
      // 确保 data 目录存在
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // 解析文件路径，如果是相对路径，就相对于 data 目录
      let fullPath;
      if (path.isAbsolute(filePath)) {
        fullPath = filePath;
      } else {
        // 如果 filePath 以 'data/' 开头，就使用绝对路径
        if (filePath.startsWith('data/')) {
          fullPath = path.join(appDataPath, filePath);
        } else {
          fullPath = path.join(dataDir, filePath);
        }
      }
      
      fs.writeFileSync(fullPath, content);
      console.log('HTML 文件保存成功:', fullPath);
    } catch (error) {
      console.error('保存 HTML 文件失败:', error);
    }
  });

  // 处理读取文件夹的请求
  ipcMain.on('read-folder', (event, folderPath) => {
    try {
      // 读取文件夹中的文件
      const files = fs.readdirSync(folderPath);
      // 过滤出 Markdown 文件
      const mdFiles = files.filter(file => file.endsWith('.md'));
      // 构建文件路径数组
      const filePaths = mdFiles.map(file => path.join(folderPath, file));
      console.log('读取文件夹成功:', folderPath, filePaths);
      // 发送文件列表到渲染进程
      event.sender.send('folder-files', filePaths);
    } catch (error) {
      console.error('读取文件夹失败:', error);
    }
  });

  // 处理读取文件的请求
  ipcMain.on('read-file', (event, filePath) => {
    try {
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf8');
      console.log('读取文件成功:', filePath);
      // 发送文件内容到渲染进程
      event.sender.send('open-file', { filePath, content });
    } catch (error) {
      console.error('读取文件失败:', error);
    }
  });

  // 处理保存笔记文件的请求
  ipcMain.on('save-note-file', (event, data) => {
    const { filePath, content, title } = data;
    try {
      // 解析文件路径
      let fullPath;
      if (path.isAbsolute(filePath)) {
        fullPath = filePath;
      } else {
        // 如果是相对路径，相对于应用数据目录
        fullPath = path.join(appDataPath, filePath);
      }
      
      // 确保文件所在目录存在
      const dirPath = path.dirname(fullPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // 保存 Markdown 文件
      fs.writeFileSync(fullPath, content);
      console.log('Markdown 文件保存成功:', fullPath);
      
      // 生成并保存 HTML 文件
      const htmlContent = generateHtml(content, title);
      const htmlPath = path.join(dataDir, `${path.basename(fullPath, '.md')}.html`);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log('HTML 文件保存成功:', htmlPath);
      
      // 成功时不弹出对话框，只在控制台输出
    } catch (error) {
      console.error('保存文件失败:', error);
      dialog.showMessageBox({
        type: 'error',
        title: '保存失败',
        message: '保存笔记失败',
        detail: error.message
      });
    }
  });

  // 处理请求保存文件的请求
  ipcMain.on('request-save-file', (event) => {
    // 创建 newNote 目录
    const newNoteDir = path.join(dataDir, 'newNote');
    if (!fs.existsSync(newNoteDir)) {
      fs.mkdirSync(newNoteDir, { recursive: true });
    }
    
    // 显示保存对话框，默认路径为 newNote 目录
    dialog.showSaveDialog({
      defaultPath: path.join(newNoteDir, '新笔记.md'),
      filters: [{ name: 'Markdown 文件', extensions: ['md'] }]
    }).then(result => {
      if (!result.canceled) {
        event.sender.send('save-as', result.filePath);
      }
    });
  });

  // 处理应用激活
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 处理应用关闭
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
