import { Plugin, WorkspaceLeaf } from 'obsidian';
import { RedView, VIEW_TYPE_RED } from './view';
import { SettingsManager } from './settings/settings';
import { RedConverter } from './converter';
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
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_RED);
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
      console.error('无法创建视图面板');
    }
  }


}
