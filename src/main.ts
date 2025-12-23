import { Plugin, Notice, WorkspaceLeaf } from 'obsidian';
import { RedView, VIEW_TYPE_RED } from './view';  // 暂时改回原来的导入

import { SettingsManager } from './settings/settings';
import { RedConverter } from './converter';  // 暂时使用原来的转换器

import { RedSettingTab } from './settings/SettingTab';

export default class RedPlugin extends Plugin {
  settingsManager: SettingsManager;

  async onload() {
        // 初始化设置管理器
        this.settingsManager = new SettingsManager(this);
        await this.settingsManager.loadSettings();



        // 初始化转换器
        RedConverter.initialize(this.app, this);



        // 注册视图
        this.registerView(
            VIEW_TYPE_RED,
            (leaf) => new RedView(leaf, this.settingsManager)
        );

        // 注册文件列表项渲染钩子，添加导出标识
        this.registerEvent(
            this.app.workspace.on('file-menu', (_menu, _file) => {
                // 这里可以添加右键菜单功能，但不是我们需要的导出标识
            })
        );

        // 注册文件列表渲染钩子
        this.app.workspace.onLayoutReady(() => {
            this.addExportedIndicator();
        });

        // 监听文件打开事件，更新标识
        this.registerEvent(
            this.app.workspace.on('file-open', () => {
                this.addExportedIndicator();
            })
        );

    // 添加首次加载自动打开视图的逻辑
    // this.app.workspace.onLayoutReady(() => {
    //   this.app.workspace.on("layout-change", () => {
    //     const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_RED);
    //     if (leaves.length === 0) {
    //       const rightLeaf = this.app.workspace.getRightLeaf(false);
    //       if (rightLeaf) {
    //         rightLeaf.setViewState({
    //           type: VIEW_TYPE_RED,
    //           active: false,
    //         });
    //       }
    //     }
    //   });
    // });

    // 添加命令到命令面板
    this.addCommand({
            id: 'open-mp-preview',
            name: '打开小红书图片预览',
      callback: async () => {
        await this.activateView();
      },
    });

    // 添加一个功能按钮用于打开所有面板
    this.addRibbonIcon("image", "打开小红书图片预览", () => {
      this.activateView();
    });

    // 在插件的 onload 方法中添加：
    this.addSettingTab(new RedSettingTab(this.app, this));
  }

  async activateView() {
    // 如果视图已经存在，激活它
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_RED);  // 使用原来的视图类型
    if (leaves.length > 0) {
      this.app.workspace.revealLeaf(leaves[0] as WorkspaceLeaf);
      return;
    }

    // 创建新视图
    const rightLeaf = this.app.workspace.getRightLeaf(false);
    if (rightLeaf) {
      await rightLeaf.setViewState({
        type: VIEW_TYPE_RED,
        active: true,
      });
    } else {
            new Notice('无法创建视图面板');
    }
  }

  // 添加已导出标识到文件列表
  private addExportedIndicator() {
    // 获取所有文件浏览器视图
    const fileExplorers = this.app.workspace.getLeavesOfType('file-explorer');
    
    fileExplorers.forEach(leaf => {
      const explorerContainer = leaf.view.containerEl;
      const fileItems = explorerContainer.querySelectorAll('.nav-file');
      
      fileItems.forEach(item => {
        const filePath = item.getAttribute('data-path');
        if (!filePath) return;
        
        // 检查是否已经添加了标识
        let indicator = item.querySelector('.red-exported-indicator') as HTMLElement;
        
        // 获取已导出笔记列表
        const settings = this.settingsManager.getSettings();
        const isExported = settings.exportedNotes.includes(filePath);
        
        if (isExported) {
          // 如果是已导出的笔记，添加或显示标识
          if (!indicator) {
            indicator = document.createElement('span') as HTMLElement;
            indicator.className = 'red-exported-indicator';
            indicator.innerHTML = '✓';
            indicator.style.cssText = `
              margin-left: 5px;
              font-size: 12px;
              color: #666;
              opacity: 0.7;
            `;
            
            const fileNameEl = item.querySelector('.nav-file-title-content');
            if (fileNameEl) {
              fileNameEl.appendChild(indicator);
            }
          } else {
            indicator.style.display = 'inline';
          }
        } else {
          // 如果不是已导出的笔记，隐藏或移除标识
          if (indicator) {
            indicator.style.display = 'none';
          }
        }
      });
    });
  }
}
