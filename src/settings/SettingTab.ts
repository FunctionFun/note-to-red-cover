import { App, PluginSettingTab, Setting, Modal, setIcon } from 'obsidian';
import RedPlugin from "../main";
import { CreateFontModal } from './CreateFontModal';
import { ConfirmModal } from './ConfirmModal';

// 定义 Theme 接口
interface Theme {
    id: string;
    name: string;
    cssCode: string;
}

// 定义 ThemeEditModal 类
class ThemeEditModal extends Modal {
    private themeName: string;
    private themeCode: string;
    private isDefault: boolean;

    constructor(
        app: App,
        private initialTheme?: Theme,
        private onSubmit?: (name: string, cssCode: string, setAsDefault: boolean) => void
    ) {
        super(app);
        this.themeName = initialTheme?.name || '新主题';
        this.themeCode = initialTheme?.cssCode || '';
        this.isDefault = false;
    }

    onOpen() {
        const { contentEl, titleEl } = this;
        titleEl.setText(this.initialTheme ? '编辑主题' : '新建主题');

        // 主题名称区域 - 标题和输入框在同一行
        const nameSection = contentEl.createEl('div', { cls: 'red-theme-edit red-theme-edit-row' });
        nameSection.createEl('h3', { text: '主题名称' });
        const nameInput = nameSection.createEl('input', {
            type: 'text',
            value: this.themeName,
            cls: 'red-theme-input'
        });

        // 设为默认主题开关
        const defaultToggleSection = contentEl.createEl('div', { cls: 'red-theme-edit' });
        new Setting(defaultToggleSection)
            .setName('设为默认主题')
            .setDesc('启用后将此主题设置为默认主题')
            .addToggle(toggle => toggle
                .setValue(this.isDefault)
                .onChange(value => {
                    this.isDefault = value;
                }));

        contentEl.createEl('div', { cls: 'red-theme-edit' }).createEl('h3', { text: 'CSS 代码' });
        const codeInput = contentEl.createEl('textarea', {
            cls: 'red-theme-code',
            text: this.themeCode,
            attr: { height: '150px' }
        });

        const buttons = contentEl.createDiv({ cls: 'red-theme-buttons' });
        buttons.createEl('button', {
            text: '确定',
            cls: 'red-theme-btn red-theme-btn-primary'
        }).addEventListener('click', () => {
            if (this.onSubmit) {
                this.onSubmit(nameInput.value, codeInput.value, this.isDefault);
            }
            this.close();
        });

        buttons.createEl('button', {
            text: '取消',
            cls: 'red-theme-btn red-theme-btn-secondary'
        }).addEventListener('click', () => this.close());
    }

    onClose() {
        this.contentEl.empty();
    }
}

export class SettingTab extends PluginSettingTab {
    plugin: RedPlugin;

    constructor(app: App, plugin: RedPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('red-settings-container');

        // 添加插件名称标题
        const pluginTitleEl = containerEl.createEl('div', { cls: 'red-plugin-title' });
        pluginTitleEl.createEl('h1', { text: 'Note to Red Cover' });

        // 创建作者信息折叠面板
        this.renderCollapsibleSection(containerEl, 'author', '作者信息', () => {
            this.renderAuthorInfo(this.currentContentEl);
        });

        // 创建主题设置折叠面板
        // this.renderCollapsibleSection(containerEl, 'theme', '主题设置', () => {
        //     this.renderThemeSettings(this.currentContentEl);
        // });

        // 创建排版设置折叠面板
        this.renderCollapsibleSection(containerEl, 'typography', '排版设置', () => {
            this.renderTypographySettings(this.currentContentEl);
        });

        // 创建水印设置折叠面板
        this.renderCollapsibleSection(containerEl, 'watermark', '水印设置', () => {
            this.renderWatermarkSettings(this.currentContentEl);
        });

        // 创建背景设置折叠面板
        // this.renderCollapsibleSection(containerEl, 'background', '背景设置', () => {
        //     this.renderBackgroundSettings(this.currentContentEl);
        // });
    }

    private currentContentEl: HTMLElement;

    private renderCollapsibleSection(
        containerEl: HTMLElement,
        sectionKey: string,
        title: string,
        renderContent: () => void
    ): void {
        const isCollapsed = this.plugin.settingsManager.isSectionCollapsed(sectionKey);
        
        // 创建折叠面板容器
        const sectionContainer = containerEl.createDiv({ cls: 'red-collapsible-section' });
        if (isCollapsed) {
            sectionContainer.addClass('is-collapsed');
        }
        
        // 创建折叠面板头部
        const headerEl = sectionContainer.createDiv({ cls: 'red-collapsible-header' });
        headerEl.setAttribute('data-section-key', sectionKey);
        
        // 创建箭头图标
        const arrowEl = headerEl.createEl('span', { cls: 'red-collapsible-arrow' });
        arrowEl.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        
        // 创建标题
        headerEl.createEl('h3', { cls: 'red-collapsible-title', text: title });
        
        // 创建内容区域
        const contentEl = sectionContainer.createDiv({ cls: 'red-collapsible-content' });
        
        // 存储当前内容元素引用
        this.currentContentEl = contentEl;
        
        // 渲染内容
        renderContent();
        
        // 添加点击事件
        headerEl.addEventListener('click', async () => {
            await this.plugin.settingsManager.toggleSectionCollapse(sectionKey);
            const newCollapsedState = this.plugin.settingsManager.isSectionCollapsed(sectionKey);
            
            // 更新面板状态类
            if (newCollapsedState) {
                sectionContainer.addClass('is-collapsed');
            } else {
                sectionContainer.removeClass('is-collapsed');
            }
        });
    }

    // private renderBackgroundSettings(containerEl: HTMLElement): void {
    //     const backgroundSection = containerEl.createDiv({ cls: 'red-setting-section' });

    //     backgroundSection.createEl('div', {
    //         cls: 'red-setting-note',
    //         text: '背景设置功能需要在预览页面中使用。请在小红书预览面板底部点击背景设置按钮(📷)来配置背景图片。'
    //     });
    // }

    private renderAuthorInfo(containerEl: HTMLElement): void {
        const authorSection = containerEl.createDiv({ cls: 'red-setting-section' });
        
        // 小红书昵称设置（作为唯一作者身份标识）
        new Setting(authorSection)
            .setName('小红书昵称')
            .setDesc('设置在封面和页脚中显示的作者身份标识')
            .addText(text => text
                .setValue(this.plugin.settingsManager.getSettings().author || '')
                .onChange(value => this.plugin.settingsManager.setAuthor(value)));
        
        // 小红书账号设置
        new Setting(authorSection)
            .setName('小红书账号')
            .setDesc('设置页脚显示的作者账号 (如@username)')
            .addText(text => text
                .setValue(this.plugin.settingsManager.getSettings().xhsAccount || '')
                .onChange(async (value) => {
                    await this.plugin.settingsManager.updateSettings({ xhsAccount: value });
                }));
        
        // 小红书简介设置
        new Setting(authorSection)
            .setName('小红书简介')
            .setDesc('设置页脚显示的作者简介或签名')
            .addTextArea(textarea => textarea
                .setValue(this.plugin.settingsManager.getSettings().xhsBio || '')
                .onChange(value => this.plugin.settingsManager.updateSettings({ xhsBio: value })));
    }

    // @ts-ignore - 主题设置功能暂时隐藏，但保留方法以备将来使用
    private renderThemeSettings(containerEl: HTMLElement): void {
        const themeSection = containerEl.createDiv({ cls: 'red-setting-section' });

        // 创建主题列表区域
        const themesContainer = themeSection.createDiv({ cls: 'red-themes-container' });

        // 创建按钮容器
        const buttonsContainer = themesContainer.createDiv({ cls: 'red-theme-buttons-container' });

        // 新增主题按钮
        buttonsContainer.createEl('button', {
            text: '+ 新增主题',
            cls: 'red-add-theme-btn'
        }).addEventListener('click', () => {
            new ThemeEditModal(this.app, undefined, (name, cssCode, setAsDefault) => {
                this.plugin.settingsManager.addTheme(name, cssCode, setAsDefault);
                this.display();
            }).open();
        });

        // 添加水平分割线
        themesContainer.createEl('div', { cls: 'red-theme-divider' });

        // 显示已保存的主题
        this.plugin.settingsManager.getThemes().forEach(theme => {
            const themeItem = themesContainer.createEl('div', {
                cls: 'red-theme-item'
            });

            // 主题名称和编辑按钮
            const themeHeader = themeItem.createEl('div', {
                cls: 'red-theme-header'
            });
            
            const themeInfo = themeHeader.createEl('div', {
                cls: 'red-theme-info'
            });
            themeInfo.createEl('span', {
                text: theme.name,
                cls: 'red-theme-name'
            });

            const editBtn = themeHeader.createEl('button', {
                text: '编辑',
                cls: 'red-edit-theme-btn'
            });
            editBtn.addEventListener('click', () => {
                new ThemeEditModal(this.app, theme, (newName, newCss, setAsDefault) => {
                    if (setAsDefault) {
                        this.plugin.settingsManager.updateThemeAndSetDefault(theme.id, newName, newCss);
                    } else {
                        this.plugin.settingsManager.updateTheme(theme.id, newName, newCss);
                    }
                    this.display();
                }).open();
            });

            // 如果是当前选中的主题，添加默认标签
            if (theme.id === this.plugin.settingsManager.getSettings().selectedThemeId) {
                themeInfo.createEl('span', {
                    text: '默认',
                    cls: 'red-theme-default-tag'
                });
            }
        });
    }

    private renderTypographySettings(containerEl: HTMLElement): void {
        const typographySection = containerEl.createDiv({ cls: 'red-setting-section' });
        
        // 排版设置子区域
        const layoutSection = typographySection.createDiv({ cls: 'red-setting-subsection' });
        layoutSection.createEl('h4', { text: '排版设置' });
        
        // 基于分割线分割内容
        new Setting(layoutSection)
            .setName('基于分割线分割内容')
            .setDesc('启用后，使用 --- 将内容分割为多个页面')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSettings().useHorizontalRuleSplit || false)
                .onChange(value => this.plugin.settingsManager.updateSettings({ useHorizontalRuleSplit: value })));
        
        // 是否显示页脚
        new Setting(layoutSection)
            .setName('是否显示页脚')
            .setDesc('控制是否在主题中显示页脚部分')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settingsManager.getSettings().showFooter || false)
                .onChange(value => this.plugin.settingsManager.updateSettings({ showFooter: value })));

        // 字体管理子区域
        const fontSection = typographySection.createDiv({ cls: 'red-setting-subsection' });
        fontSection.createEl('h4', { text: '字体管理' });
        
        // 自定义字体管理
        const fontManageContainer = fontSection.createDiv();
        new Setting(fontManageContainer)
            .setName('自定义字体')
            .addButton(btn => btn
                .setButtonText('添加新字体')
                .onClick(() => {
                    new CreateFontModal(this.app, async (font) => {
                        await this.plugin.settingsManager.addFont(font);
                        this.display();
                    }).open();
                }));

        // 字体选择
        new Setting(fontSection)
            .setName('默认字体')
            .setDesc('选择应用的默认字体')
            .addDropdown(dropdown => {
                const fonts = this.plugin.settingsManager.getFonts();
                const currentFont = this.plugin.settingsManager.getSettings().fontFamily;
                
                dropdown.addOption('', '使用系统默认字体');
                fonts.forEach(font => {
                    dropdown.addOption(font.value, font.label);
                });
                
                dropdown.setValue(currentFont || '');
                dropdown.onChange(async (value) => {
                    await this.plugin.settingsManager.updateSettings({ fontFamily: value });
                });
            });

        // 字体大小设置
        const fontSizeSetting = new Setting(fontSection)
            .setName('默认字号')
            .setDesc('设置默认的字体大小 (12-30px)');
        
        const fontSizeInput = fontSizeSetting.controlEl.createEl('input', {
            type: 'number',
            cls: 'red-font-size-input',
            value: (this.plugin.settingsManager.getSettings().fontSize || 16).toString(),
            attr: {
                min: '12',
                max: '30',
                step: '1'
            }
        });
        
        fontSizeSetting.controlEl.createEl('div', {
            cls: 'red-font-size-error',
            text: ''
        });
        
        fontSizeInput.addEventListener('input', async () => {
            const value = parseInt(fontSizeInput.value);
            const errorEl = fontSizeSetting.controlEl.querySelector('.red-font-size-error') as HTMLElement;
            
            if (isNaN(value) || value < 12 || value > 30) {
                errorEl.textContent = '请输入12-30之间的有效数值';
                errorEl.style.display = 'block';
                return;
            }
            
            errorEl.textContent = '';
            errorEl.style.display = 'none';
            await this.plugin.settingsManager.setFontSize(value);
        });
        
        fontSizeInput.addEventListener('blur', () => {
            const value = parseInt(fontSizeInput.value);
            if (isNaN(value) || value < 12 || value > 30) {
                fontSizeInput.value = (this.plugin.settingsManager.getSettings().fontSize || 16).toString();
                const errorEl = fontSizeSetting.controlEl.querySelector('.red-font-size-error') as HTMLElement;
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        });

        // 列出已有字体
        const fontListEl = fontSection.createEl('div', { cls: 'red-font-list' });
        const fonts = this.plugin.settingsManager.getFonts();
        
        // 渲染字体列表
        fonts.forEach(font => {
            const fontItem = fontListEl.createDiv({ cls: 'red-font-item' });
            
            // 字体名称和字体值
            const fontInfo = fontItem.createEl('div', { cls: 'red-font-info' });
            fontInfo.createEl('span', {
                text: font.label,
                cls: 'red-font-label'
            });
            fontInfo.createEl('span', {
                text: font.value,
                cls: 'red-font-value'
            });

            // 只有自定义字体才显示编辑和删除按钮
            if (!font.isPreset) {
                const actionButtons = fontItem.createEl('div', { cls: 'red-font-actions' });
                
                const editBtn = actionButtons.createEl('button', {
                    text: '编辑',
                    cls: 'red-font-btn red-font-edit-btn'
                });
                editBtn.addEventListener('click', () => {
                    new CreateFontModal(this.app, async (updatedFont) => {
                        await this.plugin.settingsManager.updateFont(font.value, updatedFont);
                        this.display();
                    }, font).open();
                });

                const deleteBtn = actionButtons.createEl('button', {
                    cls: 'red-font-btn red-font-delete-btn'
                });
                setIcon(deleteBtn, 'x');
                deleteBtn.addEventListener('click', () => {
                    new ConfirmModal(this.app, "确认删除", "确定要删除该字体吗？", async () => {
                        await this.plugin.settingsManager.deleteFont(font.value);
                        this.display();
                    }).open();
                });
            }
        });

        // 添加提示信息
        const hintEl = fontSection.createEl('div', { cls: 'red-font-hint' });
        hintEl.createEl('p', { text: '本插件不提供在线字体，自定义字体需要自行安装在设备中' });
    }

    private renderWatermarkSettings(containerEl: HTMLElement): void {
        const watermarkSection = containerEl.createDiv({ cls: 'red-setting-section' });

        // 获取当前水印设置
        const watermarkSettings = this.plugin.settingsManager.getSettings().watermarkSettings || {
            enabled: this.plugin.settingsManager.getSettings().showWatermark || false,
            watermarkText: '',
            watermarkImage: '',
            opacity: 0.3,
            count: 3,
            watermarkColor: '#ebebeb'
        };

        // 启用水印开关
        new Setting(watermarkSection)
            .setName('启用水印')
            .setDesc('控制是否在导出图片上添加水印')
            .addToggle(toggle => toggle
                .setValue(watermarkSettings.enabled || false)
                .onChange(async (value) => {
                    watermarkSettings.enabled = value;
                    await this.plugin.settingsManager.updateSettings({ 
                        showWatermark: value,
                        watermarkSettings 
                    });
                }));

        // 水印文字
        new Setting(watermarkSection)
            .setName('水印文字')
            .setDesc('设置水印显示的文字内容')
            .addText(text => text
                .setValue(watermarkSettings.watermarkText || '')
                .onChange(async (value) => {
                    watermarkSettings.watermarkText = value;
                    await this.plugin.settingsManager.updateSettings({ watermarkSettings });
                }));

        // 水印图片
        new Setting(watermarkSection)
            .setName('水印图片')
            .setDesc('设置水印图片URL (支持网络图片)')
            .addText(text => text
                .setValue(watermarkSettings.watermarkImage || '')
                .onChange(async (value) => {
                    watermarkSettings.watermarkImage = value;
                    await this.plugin.settingsManager.updateSettings({ watermarkSettings });
                }));

        // 水印透明度
        new Setting(watermarkSection)
            .setName('水印透明度')
            .setDesc('设置水印的透明度 (0.1-1)')
            .addSlider(slider => slider
                .setLimits(0.1, 1, 0.1)
                .setValue(watermarkSettings.opacity || 0.3)
                .onChange(async (value) => {
                    watermarkSettings.opacity = value;
                    await this.plugin.settingsManager.updateSettings({ watermarkSettings });
                }));

        // 水印数量
        new Setting(watermarkSection)
            .setName('水印数量')
            .setDesc('设置水印的显示数量 (1-5)')
            .addSlider(slider => slider
                .setLimits(1, 5, 1)
                .setValue(watermarkSettings.count || 3)
                .onChange(async (value) => {
                    watermarkSettings.count = value;
                    await this.plugin.settingsManager.updateSettings({ watermarkSettings });
                }));

        // 水印颜色
        new Setting(watermarkSection)
            .setName('水印颜色')
            .setDesc('设置水印的颜色 (十六进制格式，如#333333)')
            .addText(text => text
                .setValue(watermarkSettings.watermarkColor || '#ebebeb')
                .onChange(async (value) => {
                    watermarkSettings.watermarkColor = value;
                    await this.plugin.settingsManager.updateSettings({ watermarkSettings });
                }));

        // 水印大小
        new Setting(watermarkSection)
            .setName('水印大小')
            .setDesc('设置水印的字体大小 (10-50px)')
            .addSlider(slider => slider
                .setLimits(10, 50, 1)
                .setValue(this.plugin.settingsManager.getSettings().watermarkSize || 30)
                .onChange(async (value) => {
                    await this.plugin.settingsManager.setWatermarkSize(value);
                }));
    }
}