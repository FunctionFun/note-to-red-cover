import { App, PluginSettingTab, Setting, setIcon, Notice } from 'obsidian';
import RedPlugin from '../main'; // 修改插件名以匹配类名
import { CreateFontModal } from './CreateFontModal';
import { ConfirmModal } from './ConfirmModal'; // 添加确认模态框导入

export class RedSettingTab extends PluginSettingTab {
    plugin: RedPlugin; // 修改插件类型以匹配类名
    private expandedSections: Set<string> = new Set();
    private refreshButton: HTMLButtonElement | null = null;
    private debounceTimers: Map<string, number> = new Map();

    // 防抖函数
    private debounce(key: string, func: () => void, delay: number = 500): void {
        // 清除之前的定时器
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key)!);
        }
        // 设置新的定时器
        const timerId = window.setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        this.debounceTimers.set(key, timerId);
    }

    constructor(app: App, plugin: RedPlugin) { // 修改插件类型以匹配类名
        super(app, plugin);
        this.plugin = plugin;
    }

    private createSection(containerEl: HTMLElement, title: string, renderContent: (contentEl: HTMLElement) => void) {
        const section = containerEl.createDiv('settings-section');
        const header = section.createDiv('settings-section-header');
        
        const toggle = header.createSpan('settings-section-toggle');
        setIcon(toggle, 'chevron-right');
        
        header.createEl('h4', { text: title });
        
        const content = section.createDiv('settings-section-content');
        renderContent(content);
        
        header.addEventListener('click', () => {
            const isExpanded = !section.hasClass('is-expanded');
            section.toggleClass('is-expanded', isExpanded);
            setIcon(toggle, isExpanded ? 'chevron-down' : 'chevron-right');
            if (isExpanded) {
                this.expandedSections.add(title);
            } else {
                this.expandedSections.delete(title);
            }
        });
        
        if (this.expandedSections.has(title) || (!containerEl.querySelector('.settings-section'))) {
            section.addClass('is-expanded');
            setIcon(toggle, 'chevron-down');
            this.expandedSections.add(title);
        }
        
        return section;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('red-settings');
        
        // 为设置面板容器设置相对定位，以便按钮可以绝对定位在其中
        containerEl.style.position = 'relative';

        // 创建标题容器
        const headerContainer = containerEl.createDiv('header-container');
        
        // 为标题容器设置相对定位，以便按钮可以绝对定位在其中
        headerContainer.style.position = 'relative';
        headerContainer.style.display = 'flex';
        headerContainer.style.justifyContent = 'space-between';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.width = '100%';
        headerContainer.style.marginBottom = '20px';
        
        // 创建标题
        headerContainer.createEl('h2', { text: 'Note to RED 设置' });
        

        
        // 先移除旧的刷新按钮（如果存在）
        if (this.refreshButton) {
            this.refreshButton.remove();
            this.refreshButton = null;
        }
        
        // 创建新的刷新按钮
        const refreshButton = document.createElement('button');
        refreshButton.className = 'refresh-button';
        refreshButton.title = '刷新插件设置';
        
        // 设置按钮内容
        refreshButton.textContent = '刷新';
        
        // 添加图标
        const iconSpan = document.createElement('span');
        setIcon(iconSpan, 'refresh-cw');
        refreshButton.insertBefore(iconSpan, refreshButton.firstChild);
        
        // 图标间距
        iconSpan.style.marginRight = '4px';
        
        // 设置按钮样式 - 使用absolute定位并添加到标题容器，确保在设置面板右上角
        refreshButton.style.position = 'absolute';
        refreshButton.style.top = '0';
        refreshButton.style.right = '0';
        refreshButton.style.zIndex = '100'; // 确保在标题容器上层
        refreshButton.style.padding = '6px 12px';
        refreshButton.style.borderRadius = '4px';
        refreshButton.style.border = '2px solid #8A5CF5'; // 更新为用户提供的颜色
        refreshButton.style.backgroundColor = '#8A5CF5'; // 更新为用户提供的颜色
        refreshButton.style.color = 'white';
        refreshButton.style.cursor = 'pointer';
        refreshButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        refreshButton.style.fontWeight = 'bold';
        refreshButton.style.fontSize = '14px';
        refreshButton.style.display = 'flex';
        refreshButton.style.alignItems = 'center';
        refreshButton.style.textAlign = 'center';
        refreshButton.style.lineHeight = '1';
        refreshButton.style.overflow = 'visible';
        refreshButton.style.visibility = 'visible';
        refreshButton.style.opacity = '1';
        refreshButton.style.pointerEvents = 'auto';
        refreshButton.style.userSelect = 'none';
        refreshButton.style.minWidth = '60px';
        
        // 创建一个专门的按钮容器，使用sticky定位确保在滚动时保持可见
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'sticky';
        buttonContainer.style.top = '10px';
        buttonContainer.style.left = '0';
        buttonContainer.style.width = '100%';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.zIndex = '100';
        buttonContainer.style.marginBottom = '20px';
        
        // 将按钮添加到容器中，按钮不需要再使用absolute定位
        refreshButton.style.position = 'static';
        buttonContainer.appendChild(refreshButton);
        
        // 将按钮容器添加到设置面板容器的最顶部
        containerEl.insertBefore(buttonContainer, containerEl.firstChild);
        
        // 保存按钮引用
        this.refreshButton = refreshButton;
        
        // 刷新按钮点击事件处理
        refreshButton.addEventListener('click', async () => {
            // 重新加载设置
            await this.plugin.settingsManager.loadSettings();
            // 刷新视图
            this.display();
            new Notice('插件所有修改已生效');
        });

        this.createSection(containerEl, '作者信息', el => this.renderAuthorSettings(el));
        this.createSection(containerEl, '排版管理', el => this.renderTypographySettings(el));
        this.createSection(containerEl, '水印设置', el => this.renderWatermarkSettings(el));

    }



    private renderTypographySettings(containerEl: HTMLElement): void {
        // 排版管理区域
        const typographySection = containerEl.createDiv('red-settings-subsection');
        const typographyHeader = typographySection.createDiv('red-settings-subsection-header');
        const typographyToggle = typographyHeader.createSpan('red-settings-subsection-toggle');
        setIcon(typographyToggle, 'chevron-right');
        
        typographyHeader.createEl('h3', { text: '排版设置' });
        
        const typographyContent = typographySection.createDiv('red-settings-subsection-content');
        
        // 折叠/展开逻辑
        typographyHeader.addEventListener('click', () => {
            const isExpanded = !typographySection.hasClass('is-expanded');
            typographySection.toggleClass('is-expanded', isExpanded);
            setIcon(typographyToggle, isExpanded ? 'chevron-down' : 'chevron-right');
        });

        // 基于分割线分割内容设置
        new Setting(typographyContent)
            .setName('基于分割线分割内容')
            .setDesc('启用后，使用分割线(---)将内容分割为多个页面：')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSettings().useHorizontalRuleSplit)
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSettings({
                        useHorizontalRuleSplit: value
                    });
                    new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                })
            );

        // 添加页脚显示设置
        new Setting(typographyContent)
            .setName('是否显示页脚')
            .setDesc('控制是否在主题中显示页脚部分')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSettings().showFooter !== false)
                .onChange(async (value: boolean) => {
                    await this.plugin.settingsManager.updateSettings({
                        showFooter: value
                    });
                    new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                })
            );

        // 字体管理区域
        const fontSection = containerEl.createDiv('red-settings-subsection');
        const fontHeader = fontSection.createDiv('red-settings-subsection-header');
        const fontToggle = fontHeader.createSpan('red-settings-subsection-toggle');
        setIcon(fontToggle, 'chevron-right');
        
        fontHeader.createEl('h3', { text: '字体管理' });
        
        const fontContent = fontSection.createDiv('red-settings-subsection-content');
        
        // 折叠/展开逻辑
        fontHeader.addEventListener('click', () => {
            const isExpanded = !fontSection.hasClass('is-expanded');
            fontSection.toggleClass('is-expanded', isExpanded);
            setIcon(fontToggle, isExpanded ? 'chevron-down' : 'chevron-right');
        });

        // 字体列表
        const fontList = fontContent.createDiv('font-management');
        this.plugin.settingsManager.getFontOptions().forEach(font => {
            const fontItem = fontList.createDiv('font-item');
            const setting = new Setting(fontItem)
                .setName(font.label)
                .setDesc(font.value);

            // 只为非预设字体添加编辑和删除按钮
            if (!font.isPreset) {
                setting
                    .addExtraButton(btn => 
                        btn.setIcon('pencil')
                            .setTooltip('编辑')
                            .onClick(() => {
                                new CreateFontModal(
                                    this.app,
                                    async (updatedFont) => {
                                        await this.plugin.settingsManager.updateFont(font.value, updatedFont);
                                        this.display();
                                        new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                                    },
                                    font
                                ).open();
                            }))
                    .addExtraButton(btn => 
                        btn.setIcon('trash')
                            .setTooltip('删除')
                            .onClick(() => {
                                // 新增确认模态框
                                new ConfirmModal(
                                    this.app,
                                    '确认删除字体',
                                    `确定要删除「${font.label}」字体配置吗？`,
                                    async () => {
                                        await this.plugin.settingsManager.removeFont(font.value);
                                        this.display();
                                        new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                                    }
                                ).open();
                            }));
            }
        });

        // 添加新字体按钮
        new Setting(fontContent)
            .addButton(btn => btn
                .setButtonText('+ 添加字体')
                .setCta()
                .onClick(() => {
                    new CreateFontModal(
                        this.app,
                        async (newFont) => {
                            await this.plugin.settingsManager.addCustomFont(newFont);
                            this.display();
                            new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                        }
                    ).open();
                }));
    }



    private renderWatermarkSettings(containerEl: HTMLElement): void {
        const watermarkSettings = this.plugin.settingsManager.getSettings().watermarkSettings;

        // 水印开关
        new Setting(containerEl)
            .setName('启用水印')
            .setDesc('控制是否在导出图片上添加水印')
            .addToggle(toggle => toggle
                .setValue(watermarkSettings.enabled)
                .onChange(async (value: boolean) => {
                    await this.plugin.settingsManager.updateSettings({
                        watermarkSettings: {
                            ...watermarkSettings,
                            enabled: value
                        }
                    });
                    new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                })
            );

        // 水印文字
        new Setting(containerEl)
            .setName('水印文字')
            .setDesc('设置水印显示的文字内容')
            .addText(text => text
                .setValue(watermarkSettings.watermarkText)
                .setPlaceholder('请输入水印文字')
                .onChange((value: string) => {
                    this.debounce('watermarkText', async () => {
                        await this.plugin.settingsManager.updateSettings({
                            watermarkSettings: {
                                ...watermarkSettings,
                                watermarkText: value
                            }
                        });
                        new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                    });
                }));

        // 水印图片
        new Setting(containerEl)
            .setName('水印图片')
            .setDesc('设置水印图片URL（支持网络图片）')
            .addText(text => text
                .setValue(watermarkSettings.watermarkImage)
                .setPlaceholder('请输入图片URL')
                .onChange((value: string) => {
                    this.debounce('watermarkImage', async () => {
                        await this.plugin.settingsManager.updateSettings({
                            watermarkSettings: {
                                ...watermarkSettings,
                                watermarkImage: value
                            }
                        });
                        new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                    });
                }));

        // 水印透明度
        new Setting(containerEl)
            .setName('水印透明度')
            .setDesc('设置水印的透明度（0.1-1）')
            .addSlider(slider => slider
                .setLimits(0.1, 1, 0.1)
                .setValue(watermarkSettings.opacity)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    await this.plugin.settingsManager.updateSettings({
                        watermarkSettings: {
                            ...watermarkSettings,
                            opacity: value
                        }
                    });
                    new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                })
            );

        // 水印数量
        new Setting(containerEl)
            .setName('水印数量')
            .setDesc('设置水印的显示数量（1-5）')
            .addSlider(slider => slider
                .setLimits(1, 5, 1)
                .setValue(watermarkSettings.count)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    await this.plugin.settingsManager.updateSettings({
                        watermarkSettings: {
                            ...watermarkSettings,
                            count: value
                        }
                    });
                    new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                })
            );

        // 水印颜色
        new Setting(containerEl)
            .setName('水印颜色')
            .setDesc('设置水印的颜色（十六进制格式，如#333333）')
            .addText(text => text
                .setValue(watermarkSettings.watermarkColor)
                .setPlaceholder('#333333')
                .onChange((value: string) => {
                    // 验证十六进制颜色格式
                    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                    if (hexColorRegex.test(value)) {
                        this.debounce('watermarkColor', async () => {
                            await this.plugin.settingsManager.updateSettings({
                                watermarkSettings: {
                                    ...watermarkSettings,
                                    watermarkColor: value
                                }
                            });
                            new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                        });
                    } else if (value === '') {
                        // 允许空值，将使用默认颜色
                        this.debounce('watermarkColor', async () => {
                            await this.plugin.settingsManager.updateSettings({
                                watermarkSettings: {
                                    ...watermarkSettings,
                                    watermarkColor: '#333333'
                                }
                            });
                            new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                        });
                    }
                })
            );
    }

    private renderAuthorSettings(containerEl: HTMLElement): void {
        const settings = this.plugin.settingsManager.getSettings();

        // 小红书昵称
        new Setting(containerEl)
            .setName('小红书昵称')
            .setDesc('设置页脚显示的作者昵称')
            .addText(text => text
                .setValue(settings.xhsNickname)
                .setPlaceholder('请输入小红书昵称')
                .onChange((value: string) => {
                    this.debounce('author-xhsNickname', async () => {
                        await this.plugin.settingsManager.updateSettings({ xhsNickname: value });
                        new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                    });
                }));

        // 小红书账号
        new Setting(containerEl)
            .setName('小红书账号')
            .setDesc('设置页脚显示的作者账号（如@username）')
            .addText(text => text
                .setValue(settings.xhsAccount)
                .setPlaceholder('请输入小红书账号')
                .onChange((value: string) => {
                    this.debounce('author-xhsAccount', async () => {
                        await this.plugin.settingsManager.updateSettings({ xhsAccount: value });
                        new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                    });
                }));

        // 小红书简介
        new Setting(containerEl)
            .setName('小红书简介')
            .setDesc('设置页脚显示的作者简介或签名')
            .addText(text => text
                .setValue(settings.xhsBio)
                .setPlaceholder('请输入小红书简介')
                .onChange((value: string) => {
                    this.debounce('author-xhsBio', async () => {
                        await this.plugin.settingsManager.updateSettings({ xhsBio: value });
                        new Notice('设置已保存，请点击刷新按钮或重新加载插件使更改生效');
                    });
                }));
    }
}
