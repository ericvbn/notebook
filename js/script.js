    // 全局变量
    let notes = [];
    let currentNote = null;
    let currentTab = null;
    let sidebarCollapsed = false;
    let selectedElement = null;

    // 打开文件
    // 全局变量，用于标识是否是从文件夹打开文件
    let isOpeningFromFolder = false;

    // 全局变量，用于存储当前选中的文本
    let selectedText = '';

    function openFile(data) {
      const { filePath, content, tags = [] } = data;
      
      console.log('filePath:', filePath); 
      console.log('content:', content);

      try {
        // 检查是否有已打开的文件，如果有，先保存它
        if (currentNote) {
          saveNote();
          // 关闭当前标签页
          const currentTab = document.querySelector(`.tab[data-id="${currentNote.id}"]`);
          if (currentTab) {
            currentTab.remove();
          }
        }
        
        // 隐藏欢迎框，显示编辑器预览容器
        document.getElementById('welcome-box').classList.add('hidden');
        document.getElementById('editor-preview-container').style.display = 'flex';
        
        // 只有在直接选择文件打开时才隐藏侧边栏
        if (!isOpeningFromFolder) {
          // 隐藏侧边栏
          const sidebar = document.getElementById('sidebar');
          sidebar.style.display = 'none';
          // 调整主内容区宽度
          const mainContent = document.querySelector('.main-content');
          mainContent.style.width = '100%';
        }
        // 重置标志
        isOpeningFromFolder = false;
        
        // 从文件路径提取文件名作为笔记标题（当作字符串处理）
        const fileName = filePath.split('\\').pop().split('/').pop().replace('.md', '');
        
        // 检查是否已经存在具有相同 filePath 的笔记
        let existingNote = notes.find(note => note.filePath === filePath);
        
        if (existingNote) {
          // 更新现有的笔记对象
          console.log('更新现有笔记:', existingNote.title);
          // 确保现有笔记有jsonPath属性
          if (!existingNote.jsonPath) {
            const jsonFileName = `${fileName}.json`;
            existingNote.jsonPath = `data/${jsonFileName}`;
          }
          // 更新标签信息
          existingNote.tags = tags;
          // 打开笔记并显示内容
          currentNote = existingNote;
          updateActiveNote();
          createTab(existingNote);
        } else {
          // 创建新的笔记对象
          const noteId = Date.now().toString();
          // 生成保存在 data 目录下的 JSON 文件路径
          const jsonFileName = `${fileName}.json`;
          const jsonPath = `data/${jsonFileName}`;
          
          const newNote = {
            id: noteId,
            title: fileName,
            filePath: filePath,
            jsonPath: jsonPath,
            tags: tags
          };
          
          // 添加到笔记列表
          notes.push(newNote);
          updateNoteList();
          
          // 打开笔记并显示内容
          currentNote = newNote;
          updateActiveNote();
          createTab(newNote);
        }
        
        // 加载文件内容到编辑器
      document.getElementById('editor').value = content;
      
      // 渲染预览
      renderPreview(content);
      
      // 生成对应的 JSON 文件
      const jsonContent = generateNoteData(content, fileName, currentNote.tags || []);
      // 注意：在 contextIsolation: true 的情况下，渲染进程无法直接访问 fs 模块
      // 这里需要通过与主进程通信来保存 JSON 文件
      window.electronAPI.saveNoteDataFile(currentNote.jsonPath, jsonContent);
      
      // 显示标签栏
      updateTagBar(currentNote.tags || []);
        
      } catch (error) {
        console.error('打开文件失败:', error);
        alert('打开文件失败: ' + error.message);
      }
    }

    // 打开文件夹
    function openFolder(folderPath) {
      console.log('打开文件夹:', folderPath);
      
      try {
        // 注意：在 contextIsolation: true 的情况下，渲染进程无法直接访问 fs 模块
        // 这里需要通过与主进程通信来读取文件夹中的文件
        window.electronAPI.readFolder(folderPath);
        
      } catch (error) {
        console.error('打开文件夹失败:', error);
        alert('打开文件夹失败: ' + error.message);
      }
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
      setupEventListeners();
      // 初始化应用逻辑将通过与主进程通信实现
    });

    // 更新笔记列表
    function updateNoteList() {
      const noteList = document.getElementById('note-list');
      noteList.innerHTML = '';

      notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.dataset.id = note.id;
        noteItem.innerHTML = `<div class="note-item-title">${note.title}</div>`;
        
        noteItem.addEventListener('click', () => {
          openNote(note);
        });

        noteList.appendChild(noteItem);
      });
    }

    // 创建新笔记
    function createNewNote() {
      // 隐藏欢迎框，显示编辑器预览容器
      document.getElementById('welcome-box').classList.add('hidden');
      document.getElementById('editor-preview-container').style.display = 'flex';
      
      // 隐藏侧边栏
      const sidebar = document.getElementById('sidebar');
      sidebar.style.display = 'none';
      // 调整主内容区宽度
      const mainContent = document.querySelector('.main-content');
      mainContent.style.width = '100%';
      
      const noteId = Date.now().toString();
      const noteTitle = `新笔记-${notes.length + 1}`;

      const newNote = {
        id: noteId,
        title: noteTitle,
        filePath: '',
        jsonPath: ''
      };

      notes.push(newNote);
      openNote(newNote);
      updateNoteList();
    }

    // 打开笔记
    function openNote(note) {
      // 隐藏欢迎框，显示编辑器预览容器
      document.getElementById('welcome-box').classList.add('hidden');
      document.getElementById('editor-preview-container').style.display = 'flex';
      
      currentNote = note;
      updateActiveNote();
      createTab(note);

      // 加载笔记内容
      // 通过与主进程通信来加载文件内容
      if (note.filePath) {
        window.electronAPI.readFile(note.filePath);
      } else {
        document.getElementById('editor').value = '';
        document.getElementById('preview').innerHTML = '';
      }
    }

    // 更新激活的笔记
    function updateActiveNote() {
      document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === currentNote.id) {
          item.classList.add('active');
        }
      });
    }

    // 创建标签页
    function createTab(note) {
      const tabs = document.getElementById('tabs');
      const existingTab = document.querySelector(`.tab[data-id="${note.id}"]`);

      if (existingTab) {
        // 激活现有标签页
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        existingTab.classList.add('active');
        currentTab = note.id;
      } else {
        // 创建新标签页
        const tab = document.createElement('div');
        tab.className = 'tab active';
        tab.dataset.id = note.id;
        tab.innerHTML = `<span class="tab-text">${note.title}</span> <span class="tab-close">×</span>`;

        // 激活当前标签页
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = note.id;

        // 标签页点击事件
        tab.addEventListener('click', (e) => {
          if (!e.target.classList.contains('tab-close')) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = note.id;
            openNote(note);
          }
        });

        // 关闭标签页
        tab.querySelector('.tab-close').addEventListener('click', (e) => {
          e.stopPropagation();
          
          // 显示保存确认模态框
          const saveConfirmModal = document.getElementById('save-confirm-modal');
          saveConfirmModal.style.display = 'flex';
          
          // 保存确认模态框按钮事件
          document.getElementById('save-confirm-yes').onclick = function() {
            // 保存笔记
            saveNote();
            // 关闭模态框
            saveConfirmModal.style.display = 'none';
            // 关闭标签页
            tab.remove();
            // 显示欢迎框
            currentNote = null;
            currentTab = null;
            document.getElementById('welcome-box').classList.remove('hidden');
            document.getElementById('editor-preview-container').style.display = 'none';
            // 隐藏侧边栏
            const sidebar = document.getElementById('sidebar');
            sidebar.style.display = 'none';
            // 调整主内容区宽度
            const mainContent = document.querySelector('.main-content');
            mainContent.style.width = '100%';
          };
          
          document.getElementById('save-confirm-no').onclick = function() {
            // 不保存笔记，直接关闭
            saveConfirmModal.style.display = 'none';
            tab.remove();
            // 显示欢迎框
            currentNote = null;
            currentTab = null;
            document.getElementById('welcome-box').classList.remove('hidden');
            document.getElementById('editor-preview-container').style.display = 'none';
            // 隐藏侧边栏
            const sidebar = document.getElementById('sidebar');
            sidebar.style.display = 'none';
            // 调整主内容区宽度
            const mainContent = document.querySelector('.main-content');
            mainContent.style.width = '100%';
          };
          
          document.getElementById('save-confirm-cancel').onclick = function() {
            // 取消关闭操作
            saveConfirmModal.style.display = 'none';
          };
        });

        tabs.appendChild(tab);
      }
    }

    // 保存笔记
    function saveNote() {
      if (!currentNote) return;

      const content = document.getElementById('editor').value;
      const title = currentNote.title;

      if (currentNote.filePath) {
        // 有文件路径，直接保存
        window.electronAPI.saveNoteFile(currentNote.filePath, content, title, currentNote.tags || []);
        

      } else {
        // 没有文件路径，直接保存到 data/newNote 目录
        const timestamp = Date.now();
        const fileName = `新笔记-${timestamp}.md`;
        const filePath = `data/newNote/${fileName}`;
        window.electronAPI.saveNoteFile(filePath, content, title, currentNote.tags || []);
        // 更新笔记的文件路径
        currentNote.filePath = filePath;
        // 提取文件名（不包含扩展名）
        const fileNameWithoutExt = fileName.replace('.md', '');
        currentNote.jsonPath = `data/${fileNameWithoutExt}.json`;
        // 更新笔记标题为文件名
        currentNote.title = fileNameWithoutExt;
        // 更新标签页标题
        const tab = document.querySelector(`.tab[data-id="${currentNote.id}"]`);
        if (tab) {
          // 只更新标签页标题文本，保留关闭按钮
          const tabText = tab.querySelector('.tab-text');
          if (tabText) {
            tabText.textContent = fileNameWithoutExt;
          } else {
            // 如果没有 .tab-text 元素，重新创建标签页内容并重新绑定事件
            const newTab = document.createElement('div');
            newTab.className = 'tab active';
            newTab.dataset.id = currentNote.id;
            newTab.innerHTML = `<span class="tab-text">${fileNameWithoutExt}</span> <span class="tab-close">×</span>`;
            
            // 标签页点击事件
            newTab.addEventListener('click', (e) => {
              if (!e.target.classList.contains('tab-close')) {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                newTab.classList.add('active');
                currentTab = currentNote.id;
                openNote(currentNote);
              }
            });
            
            // 关闭标签页
            newTab.querySelector('.tab-close').addEventListener('click', (e) => {
              e.stopPropagation();
              
              // 显示保存确认模态框
              const saveConfirmModal = document.getElementById('save-confirm-modal');
              saveConfirmModal.style.display = 'flex';
              
              // 保存确认模态框按钮事件
              document.getElementById('save-confirm-yes').onclick = function() {
                // 保存笔记
                saveNote();
                // 关闭模态框
                saveConfirmModal.style.display = 'none';
                // 关闭标签页
                newTab.remove();
                // 显示欢迎框
                currentNote = null;
                currentTab = null;
                document.getElementById('welcome-box').classList.remove('hidden');
                document.getElementById('editor-preview-container').style.display = 'none';
                // 显示侧边栏
                const sidebar = document.getElementById('sidebar');
                sidebar.style.display = 'block';
                // 恢复主内容区宽度
                const mainContent = document.querySelector('.main-content');
                mainContent.style.width = '';
              };
              
              document.getElementById('save-confirm-no').onclick = function() {
                // 不保存笔记，直接关闭
                saveConfirmModal.style.display = 'none';
                newTab.remove();
                // 显示欢迎框
                currentNote = null;
                currentTab = null;
                document.getElementById('welcome-box').classList.remove('hidden');
                document.getElementById('editor-preview-container').style.display = 'none';
                // 显示侧边栏
                const sidebar = document.getElementById('sidebar');
                sidebar.style.display = 'block';
                // 恢复主内容区宽度
                const mainContent = document.querySelector('.main-content');
                mainContent.style.width = '';
              };
              
              document.getElementById('save-confirm-cancel').onclick = function() {
                // 取消关闭操作
                saveConfirmModal.style.display = 'none';
              };
            });
            
            // 替换旧标签页
            tab.parentNode.replaceChild(newTab, tab);
          }
        }
        updateNoteList();
        

      }
    }

    // 生成 JSON 格式的笔记数据
    function generateNoteData(content, title, tags = []) {
      return JSON.stringify({
        title: title,
        content: content,
        tags: tags,
        lastModified: new Date().toISOString()
      });
    }
    
    // 渲染预览
    function renderPreview(content) {
      const preview = document.getElementById('preview');
      const html = marked.parse(content);
      preview.innerHTML = html;
      
      // 渲染 LaTeX 公式
      renderMathInElement(preview, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }

    // 更新标签栏
    function updateTagBar(tags) {
      const tagBar = document.getElementById('tag-bar');
      tagBar.innerHTML = '';
      
      tags.forEach((tag, index) => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `${tag.tag} <span class="tag-remove">×</span>`;
        
        // 添加删除标签的事件监听器
        tagElement.querySelector('.tag-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          removeTag(index);
        });
        
        tagBar.appendChild(tagElement);
      });
    }

    // 添加标签
    function addTag() {
      if (!currentNote) return;
      
      const editor = document.getElementById('editor');
      const selectionStart = editor.selectionStart;
      const selectionEnd = editor.selectionEnd;
      
      if (selectionStart === selectionEnd) {
        alert('请先选中文本再添加标签');
        return;
      }
      
      selectedText = editor.value.substring(selectionStart, selectionEnd);
      
      // 显示标签输入模态框
      const tagModal = document.getElementById('tag-modal');
      tagModal.style.display = 'flex';
    }

    // 删除标签
    function removeTag(index) {
      if (!currentNote || !currentNote.tags) return;
      
      currentNote.tags.splice(index, 1);
      
      // 更新标签栏
      updateTagBar(currentNote.tags);
      
      // 保存笔记
      saveNote();
    }

    // 初始化应用
    function initializeApp() {
      // 这里不进行文件系统操作，避免沙箱限制
      // 实际的文件操作将通过与主进程通信实现
      // 不自动创建新笔记，等待主进程发送 newNote 目录的文件列表
    }

    // 设置事件监听器
    function setupTagEventListeners() {
      // 标签输入模态框 - 确定按钮
      document.getElementById('tag-confirm').addEventListener('click', () => {
        const tagInput = document.getElementById('tag-input');
        const tagName = tagInput.value.trim();
        
        if (tagName && currentNote) {
          const editor = document.getElementById('editor');
          const content = editor.value;
          const selectionStart = editor.selectionStart;
          const selectionEnd = editor.selectionEnd;
          
          // 确保当前有选中的文本
          if (selectionStart !== selectionEnd) {
            const selectedText = content.substring(selectionStart, selectionEnd);
            
            // 确保笔记对象有tags属性
            if (!currentNote.tags) {
              currentNote.tags = [];
            }
            
            // 添加标签信息
            currentNote.tags.push({
              tag: tagName,
              text: selectedText,
              start: selectionStart,
              end: selectionEnd
            });
            
            // 更新标签栏
            updateTagBar(currentNote.tags);
            
            // 保存笔记
            saveNote();
          }
        }
        
        // 关闭模态框
        document.getElementById('tag-modal').style.display = 'none';
        tagInput.value = '';
      });
      
      // 标签输入模态框 - 取消按钮
      document.getElementById('tag-cancel').addEventListener('click', () => {
        // 关闭模态框
        document.getElementById('tag-modal').style.display = 'none';
        document.getElementById('tag-input').value = '';
      });
      
      // 点击模态框外部关闭模态框
      document.getElementById('tag-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('tag-modal')) {
          document.getElementById('tag-modal').style.display = 'none';
          document.getElementById('tag-input').value = '';
        }
      });
      
      // 编辑器右键菜单，添加添加标签选项
      document.addEventListener('contextmenu', (e) => {
        const editor = document.getElementById('editor');
        if (e.target === editor || editor.contains(e.target)) {
          const selectionStart = editor.selectionStart;
          const selectionEnd = editor.selectionEnd;
          
          if (selectionStart !== selectionEnd) {
            e.preventDefault();
            
            // 这里可以显示自定义右键菜单，包含添加标签选项
            // 为了简单起见，这里直接调用addTag函数
            addTag();
          }
        }
      });
    }

    // 页面加载完成后初始化
    window.onload = function() {
      initializeApp();
      setupTagEventListeners();
    };



    // 设置事件监听器
    function setupEventListeners() {
      // 编辑器变化
      const editor = document.getElementById('editor');
      editor.addEventListener('input', () => {
        const content = editor.value;
        renderPreview(content);
      });

      // 侧边栏切换
      document.getElementById('toggle-sidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const sidebarTitle = document.getElementById('sidebar-title');
        sidebarCollapsed = !sidebarCollapsed;
        
        if (sidebarCollapsed) {
          sidebar.classList.add('collapsed');
          sidebarTitle.style.display = 'none';
        } else {
          sidebar.classList.remove('collapsed');
          sidebarTitle.style.display = 'block';
        }
      });



      // 删除笔记
      document.getElementById('delete-note').addEventListener('click', () => {
        if (currentNote) {
          if (confirm('确定要删除这篇笔记吗？')) {
            // 这里需要通过与主进程通信来删除文件
            notes = notes.filter(note => note.id !== currentNote.id);
            updateNoteList();

            // 关闭标签页
            const tab = document.querySelector(`.tab[data-id="${currentNote.id}"]`);
            if (tab) {
              tab.remove();
            }

            // 打开第一篇笔记
            if (notes.length > 0) {
              openNote(notes[0]);
            } else {
              createNewNote();
            }
          }
        }
      });

      // 合成按钮
      document.getElementById('compose-button').addEventListener('click', () => {
        // 这里需要实现合成笔记的逻辑
        console.log('合成笔记');
      });

      // 欢迎框按钮
      document.getElementById('welcome-new-note').addEventListener('click', () => {
        createNewNote();
      });
      document.getElementById('welcome-open-file').addEventListener('click', () => {
        window.electronAPI.requestOpenFile();
      });
      document.getElementById('welcome-open-folder').addEventListener('click', () => {
        window.electronAPI.requestOpenFolder();
      });

      // 监听主进程消息
      if (window.electronAPI) {
        console.log('electronAPI 可用');
        window.electronAPI.onNewNote(() => {
          console.log('收到 new-note 事件');
          createNewNote();
        });
        window.electronAPI.onSaveNote(() => {
          console.log('收到 save-note 事件');
          saveNote();
        });
        window.electronAPI.onOpenFile((data) => {
          console.log('收到 open-file 事件:', data);
          try {
            openFile(data);
          } catch (error) {
            console.error('调用 openFile 函数失败:', error);
            alert('打开文件失败: ' + error.message);
          }
        });
        window.electronAPI.onOpenFolder((folderPath) => {
          console.log('收到 open-folder 事件:', folderPath);
          openFolder(folderPath);
        });
        window.electronAPI.onFolderFiles((files) => {
          console.log('收到 folder-files 事件:', files);
          // 清空现有的笔记列表
          notes = [];
          // 清空标签页
          const tabs = document.getElementById('tabs');
          tabs.innerHTML = '';
          // 清空编辑器和预览区域
          document.getElementById('editor').value = '';
          document.getElementById('preview').innerHTML = '';
          // 为每个文件创建一个笔记
          files.forEach(filePath => {
            try {
              // 从文件路径提取文件名作为笔记标题
              const fileName = filePath.split('\\').pop().split('/').pop().replace('.md', '');
              const noteId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
              
              // 创建新的笔记对象
              // 生成保存在 data 目录下的 JSON 文件路径
              const jsonFileName = `${fileName}.json`;
              const jsonPath = `data/${jsonFileName}`;
              
              const newNote = {
                id: noteId,
                title: fileName,
                filePath: filePath,
                jsonPath: jsonPath
              };
              
              // 添加到笔记列表
              notes.push(newNote);
            } catch (error) {
              console.error('处理文件失败:', error);
            }
          });
          // 更新笔记列表
          updateNoteList();
          // 打开第一篇笔记或显示欢迎框
          if (notes.length > 0) {
            // 隐藏欢迎框，显示编辑器预览容器
            document.getElementById('welcome-box').classList.add('hidden');
            document.getElementById('editor-preview-container').style.display = 'flex';
            // 显示侧边栏
            const sidebar = document.getElementById('sidebar');
            sidebar.style.display = 'block';
            // 恢复主内容区宽度
            const mainContent = document.querySelector('.main-content');
            mainContent.style.width = '';
            // 设置标志，标识是从文件夹打开文件
            isOpeningFromFolder = true;
            // 读取第一篇笔记的内容
            window.electronAPI.readFile(notes[0].filePath);
          } else {
            // 显示欢迎框，隐藏编辑器预览容器
            document.getElementById('welcome-box').classList.remove('hidden');
            document.getElementById('editor-preview-container').style.display = 'none';
            // 隐藏侧边栏
            const sidebar = document.getElementById('sidebar');
            sidebar.style.display = 'none';
            // 调整主内容区宽度
            const mainContent = document.querySelector('.main-content');
            mainContent.style.width = '100%';
          }
        });
        window.electronAPI.onSaveAs((filePath) => {
          console.log('收到 save-as 事件:', filePath);
          if (currentNote) {
            const content = document.getElementById('editor').value;
            const title = currentNote.title;
            // 保存文件
            window.electronAPI.saveNoteFile(filePath, content, title, currentNote.tags || []);
            // 更新笔记的文件路径
            currentNote.filePath = filePath;
            // 提取文件名（不包含扩展名）
        const fileName = filePath.split('\\').pop().split('/').pop().replace('.md', '');
        currentNote.jsonPath = `data/${fileName}.json`;
            // 更新笔记标题为文件名
            currentNote.title = fileName;
            // 更新标签页标题
            const tab = document.querySelector(`.tab[data-id="${currentNote.id}"]`);
            if (tab) {
              // 只更新标签页标题文本，保留关闭按钮
              const tabText = tab.querySelector('.tab-text');
              if (tabText) {
                tabText.textContent = fileName;
              } else {
                // 如果没有 .tab-text 元素，重新创建标签页内容并重新绑定事件
                const newTab = document.createElement('div');
                newTab.className = 'tab active';
                newTab.dataset.id = currentNote.id;
                newTab.innerHTML = `<span class="tab-text">${fileName}</span> <span class="tab-close">×</span>`;
                
                // 标签页点击事件
                newTab.addEventListener('click', (e) => {
                  if (!e.target.classList.contains('tab-close')) {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    newTab.classList.add('active');
                    currentTab = currentNote.id;
                    openNote(currentNote);
                  }
                });
                
                // 关闭标签页
                newTab.querySelector('.tab-close').addEventListener('click', (e) => {
                  e.stopPropagation();
                  
                  // 显示保存确认模态框
                  const saveConfirmModal = document.getElementById('save-confirm-modal');
                  saveConfirmModal.style.display = 'flex';
                  
                  // 保存确认模态框按钮事件
                  document.getElementById('save-confirm-yes').onclick = function() {
                    // 保存笔记
                    saveNote();
                    // 关闭模态框
                    saveConfirmModal.style.display = 'none';
                    // 关闭标签页
                    newTab.remove();
                    // 显示欢迎框
                    currentNote = null;
                    currentTab = null;
                    document.getElementById('welcome-box').classList.remove('hidden');
                    document.getElementById('editor-preview-container').style.display = 'none';
                    // 显示侧边栏
                    const sidebar = document.getElementById('sidebar');
                    sidebar.style.display = 'block';
                    // 恢复主内容区宽度
                    const mainContent = document.querySelector('.main-content');
                    mainContent.style.width = '';
                  };
                  
                  document.getElementById('save-confirm-no').onclick = function() {
                    // 不保存笔记，直接关闭
                    saveConfirmModal.style.display = 'none';
                    newTab.remove();
                    // 显示欢迎框
                    currentNote = null;
                    currentTab = null;
                    document.getElementById('welcome-box').classList.remove('hidden');
                    document.getElementById('editor-preview-container').style.display = 'none';
                    // 显示侧边栏
                    const sidebar = document.getElementById('sidebar');
                    sidebar.style.display = 'block';
                    // 恢复主内容区宽度
                    const mainContent = document.querySelector('.main-content');
                    mainContent.style.width = '';
                  };
                  
                  document.getElementById('save-confirm-cancel').onclick = function() {
                    // 取消关闭操作
                    saveConfirmModal.style.display = 'none';
                  };
                });
                
                // 替换旧标签页
                tab.parentNode.replaceChild(newTab, tab);
              }
            }
            updateNoteList();
          }
        });
      } else {
        console.error('electronAPI 不可用');
      }
    }