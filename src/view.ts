import { ItemView, WorkspaceLeaf, MarkdownRenderer, TFile, Notice, setIcon } from 'obsidian';
import { RedConverter } from './converter';
import { DownloadManager } from './downloadManager';

import type { SettingsManager } from './settings/settings';
import { ClipboardManager } from './clipboardManager';
import { ImgTemplateManager } from './imgTemplateManager';
import { BackgroundSettingModal } from './modals/BackgroundSettingModal';
import { BackgroundManager } from './backgroundManager';
export const VIEW_TYPE_RED = 'note-to-red';

export class RedView extends ItemView {
    // #region 属性定义
    private previewEl: HTMLElement;
    private currentFile: TFile | null = null;
    private updateTimer: number | null = null;
    private isPreviewLocked: boolean = false;
    private currentImageIndex: number = 0;
    private backgroundManager: BackgroundManager;
    private lastContainerWidth: number = 0;


    // UI 元素
    private lockButton: HTMLButtonElement;
    private copyButton: HTMLButtonElement;
    private customFontSelect: HTMLElement;
    private fontSizeSelect: HTMLInputElement;
    private navigationButtons: {
        prev: HTMLButtonElement;
        next: HTMLButtonElement;
        indicator: HTMLElement;
    } | undefined;

    // 管理器实例
    private settingsManager: SettingsManager;
    private imgTemplateManager: ImgTemplateManager;
    private downloadManager: DownloadManager;
    // #endregion

    // #region 基础视图方法
    constructor(
        leaf: WorkspaceLeaf,
        settingsManager: SettingsManager
    ) {
        super(leaf);
        this.settingsManager = settingsManager;
        this.backgroundManager = new BackgroundManager();
        this.imgTemplateManager = new ImgTemplateManager(
            this.settingsManager,
            this.updatePreview.bind(this)
        );
        this.downloadManager = new DownloadManager(this.settingsManager, this.app);


    }

    getViewType() {
        return VIEW_TYPE_RED;
    }

    getDisplayText() {
        return '小红书预览';
    }

    getIcon() {
        return 'image';
    }
    // #endregion

    // #region 视图初始化
    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.className = 'red-view-content';

        await this.initializeToolbar(container as HTMLElement);
        this.initializePreviewArea(container as HTMLElement);
        this.initializeBottomBar(container as HTMLElement);
        this.initializeEventListeners();

        // 初始化容器宽度记录
        this.lastContainerWidth = this.previewEl.clientWidth;

        // 设置右侧插件面板的默认宽度为340px
        this.app.workspace.onLayoutReady(() => {
            const leaf = this.leaf;
            const layout = this.app.workspace.getLayout();
            
            // 检查是否为右侧面板的leaf
            if (layout.right && Array.isArray(layout.right)) {
                // 设置面板宽度为340px - 直接访问当前view的容器元素
                const width = 340;
                
                // 获取当前view的容器元素并设置宽度
                const viewContainer = this.containerEl;
                if (viewContainer) {
                    // 获取父级容器，这应该是实际的面板元素
                    const parentContainer = viewContainer.parentElement;
                    if (parentContainer) {
                        parentContainer.style.width = `${width}px`;
                    }
                }
                
                // 更新容器宽度记录，确保缩放比例正确
                this.lastContainerWidth = width;
                
                // 触发一次缩放更新
                this.updatePreviewScale();
            }
        });

        const currentFile = this.app.workspace.getActiveFile();
        await this.onFileOpen(currentFile);
    }

    private async initializeToolbar(container: HTMLElement) {
        const toolbar = container.createEl('div', { cls: 'red-toolbar' });
        const controlsGroup = toolbar.createEl('div', { cls: 'red-controls-group' });

        await this.initializeLockButton(controlsGroup);
        await this.initializeFontSelect(controlsGroup);
        await this.initializeFontSizeControls(controlsGroup);
        await this.restoreSettings();
    }

    // 添加背景设置按钮初始化方法
    private async initializeBackgroundButton(parent: HTMLElement) {
        const bgButton = parent.createEl('button', {
            cls: 'red-background-button',
            attr: { 'aria-label': '设置背景图片' }
        });
        setIcon(bgButton, 'image');

        bgButton.addEventListener('click', () => {
            const currentSettings = this.settingsManager.getSettings().backgroundSettings;
            new BackgroundSettingModal(
                this.app,
                async (backgroundSettings) => {
                    await this.settingsManager.updateSettings({ backgroundSettings });
                    const imagePreview = this.previewEl.querySelector('.red-image-preview') as HTMLElement;
                    this.backgroundManager.applyBackgroundStyles(
                        imagePreview,
                        backgroundSettings
                    );
                },
                this.previewEl,
                this.backgroundManager,
                currentSettings
            ).open();
        });
    }

    private initializePreviewArea(container: HTMLElement) {
        const wrapper = container.createEl('div', { cls: 'red-preview-wrapper' });
        this.previewEl = wrapper.createEl('div', { cls: 'red-preview-container' });

        // 创建导航容器
        const navContainer = wrapper.createEl('div', { cls: 'red-nav-container' });

        const prevButton = navContainer.createEl('button', {
            cls: 'red-nav-button',
            text: '←'
        });

        const indicator = navContainer.createEl('span', {
            cls: 'red-page-indicator',
            text: '1/1'
        });

        const nextButton = navContainer.createEl('button', {
            cls: 'red-nav-button',
            text: '→'
        });

        this.navigationButtons = { prev: prevButton, next: nextButton, indicator };

        prevButton.addEventListener('click', () => this.navigateImages('prev'));
        nextButton.addEventListener('click', () => this.navigateImages('next'));
    }

    private updateNavigationState() {
        const sections = this.previewEl.querySelectorAll('.red-content-section');
        if (!this.navigationButtons) return;

        sections.forEach((section, i) => {
            (section as HTMLElement).classList.toggle('red-section-active', i === this.currentImageIndex);
        });

        this.navigationButtons.prev.classList.toggle('red-nav-hidden', this.currentImageIndex === 0);
        this.navigationButtons.next.classList.toggle('red-nav-hidden', this.currentImageIndex === sections.length - 1);
        this.navigationButtons.indicator.textContent = `${this.currentImageIndex + 1}/${sections.length}`;
        
        // 重新渲染头部内容以更新页码
        const settings = { ...this.settingsManager.getSettings() } as any;
        if (this.currentFile) {
            settings.currentFileName = this.currentFile.basename;
        }
        this.imgTemplateManager.applyTemplate(this.previewEl, settings);
    }

    private navigateImages(direction: 'prev' | 'next') {
        const sections = this.previewEl.querySelectorAll('.red-content-section');
        if (direction === 'prev' && this.currentImageIndex > 0) {
            this.currentImageIndex--;
        } else if (direction === 'next' && this.currentImageIndex < sections.length - 1) {
            this.currentImageIndex++;
        }
        this.updateNavigationState();
    }

    private initializeBottomBar(container: HTMLElement) {
        const bottomBar = container.createEl('div', { cls: 'red-bottom-bar' });
        const bottomControlsGroup = bottomBar.createEl('div', { cls: 'red-controls-group' });

        this.initializeHelpButton(bottomControlsGroup);
        this.initializeBackgroundButton(bottomControlsGroup);
        this.initializeExportButtons(bottomControlsGroup);
    }

    private resizeObserver: ResizeObserver | null = null;

    private initializeEventListeners() {
        this.registerEvent(
            this.app.workspace.on('file-open', this.onFileOpen.bind(this))
        );
        this.registerEvent(
            this.app.vault.on('modify', this.onFileModify.bind(this))
        );
        this.initializeCopyButtonListener();
        
        // 监听设置更新事件
        this.settingsManager.on('settings-updated', this.updatePreview.bind(this));
        this.register(() => {
            this.settingsManager.off('settings-updated', this.updatePreview.bind(this));
        });
        
        // 使用ResizeObserver监听预览容器大小变化，用于调整预览图片缩放
        this.resizeObserver = new ResizeObserver(this.updatePreviewScale.bind(this));
        this.resizeObserver.observe(this.previewEl);
        this.register(() => {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        });
    }
    
    /**
     * 更新预览图片的缩放比例，使固定宽度的图片适应预览窗口
     */
    private updatePreviewScale() {
        const imagePreviews = this.previewEl.querySelectorAll('.red-image-preview');
        if (imagePreviews.length === 0) return;
        
        // 获取容器的实际可用宽度
        const containerWidth = this.previewEl.clientWidth;
        
        // 只有当容器宽度真正变化时才应用缩放
        if (Math.abs(containerWidth - this.lastContainerWidth) < 1) {
            return;
        }
        
        // 更新记录的宽度
        this.lastContainerWidth = containerWidth;
        
        // 为每个图片预览区域应用缩放
        imagePreviews.forEach((imagePreview: Element) => {
            const previewElement = imagePreview as HTMLElement;
            // 图片的原始宽度是400px
            const originalWidth = 400;
            // 计算缩放比例，不超过1倍（不放大，只缩小）
            // 确保缩放比例至少为0.5，避免太小的预览效果
            const scaleFactor = Math.max(0.5, Math.min(1, containerWidth / (originalWidth + 20)));
            
            // 移除可能存在的zoom属性
            (previewElement.style as any).zoom = '';
            
            // 应用标准的CSS transform缩放效果
            previewElement.style.transform = `scale(${scaleFactor})`;
            previewElement.style.transformOrigin = 'top center';
            
            // 确保图片保持2:3的比例 (400x600)
            previewElement.style.width = `${originalWidth}px`;
            previewElement.style.height = `${originalWidth * 1.5}px`; // 计算高度以保持400x600比例
        });
    }
    // #endregion

    // #region 控件初始化
    private async initializeLockButton(parent: HTMLElement) {
        this.lockButton = parent.createEl('button', {
            cls: 'red-lock-button',
            attr: { 'aria-label': '关闭实时预览状态' }
        });
        setIcon(this.lockButton, 'lock');
        this.lockButton.addEventListener('click', () => this.togglePreviewLock());
    }





    private async initializeFontSelect(parent: HTMLElement) {
        this.customFontSelect = this.createCustomSelect(
            parent,
            'red-font-select',
            this.getFontOptions()
        );
        this.customFontSelect.id = 'font-select';

        this.customFontSelect.querySelector('.red-select')?.addEventListener('change', async (e: any) => {
            const value = e.detail.value;
            await this.settingsManager.updateSettings({ fontFamily: value });
        });
    }

    private async initializeFontSizeControls(parent: HTMLElement) {
        const fontSizeGroup = parent.createEl('div', { cls: 'red-font-size-group' });

        const decreaseButton = fontSizeGroup.createEl('button', {
            cls: 'red-font-size-btn',
            text: '-'
        });

        this.fontSizeSelect = fontSizeGroup.createEl('input', {
            cls: 'red-font-size-input',
            type: 'text',
            value: this.settingsManager.getSettings().fontSize.toString(),
            attr: {
                style: 'border: none; outline: none; background: transparent;'
            }
        });

        const increaseButton = fontSizeGroup.createEl('button', {
            cls: 'red-font-size-btn',
            text: '+'
        });

        const updateFontSize = async () => {
            const size = parseInt(this.fontSizeSelect.value);
            await this.settingsManager.updateSettings({ fontSize: size });
        };

        decreaseButton.addEventListener('click', () => {
            const currentSize = parseInt(this.fontSizeSelect.value);
            if (currentSize > 12) {
                this.fontSizeSelect.value = (currentSize - 1).toString();
                updateFontSize();
            }
        });

        increaseButton.addEventListener('click', () => {
            const currentSize = parseInt(this.fontSizeSelect.value);
            if (currentSize < 30) {
                this.fontSizeSelect.value = (currentSize + 1).toString();
                updateFontSize();
            }
        });

        this.fontSizeSelect.addEventListener('change', updateFontSize);
    }

    private initializeHelpButton(parent: HTMLElement) {
        const helpButton = parent.createEl('button', {
            cls: 'red-help-button',
            attr: { 'aria-label': '使用指南' }
        });
        setIcon(helpButton, 'help');
        parent.createEl('div', {
            cls: 'red-help-tooltip',
            text: `使用指南：
                1. 核心用法：内容将根据高度自动分割成小红书配图
                2. 内容分页：在设置中启用后，使用 --- 可将内容分割为多页
                3. 首图制作：单独调整首节字号至20-24px，使用【下载当前页】导出
                4. 长文优化：内容较多的章节可调小字号至14-16px后单独导出
                5. 批量操作：保持统一字号时，用【导出全部页】批量生成
                6. 实时编辑：解锁状态(🔓)下编辑文档即时预览效果`
        });
    }



    private initializeExportButtons(parent: HTMLElement) {
        // 单张下载按钮
        const singleDownloadButton = parent.createEl('button', {
            text: '导出单页',
            cls: 'red-export-button'
        });

        singleDownloadButton.addEventListener('click', async () => {
                if (this.previewEl) {


                    singleDownloadButton.disabled = true;
                    singleDownloadButton.setText('导出中...');

                    try {
                        await this.downloadManager.downloadSingleImage(this.previewEl);
                        singleDownloadButton.setText('导出成功');
                    } catch (error) {
                        singleDownloadButton.setText('导出失败');
                    } finally {
                        setTimeout(() => {
                            singleDownloadButton.disabled = false;
                            singleDownloadButton.setText('导出单页');
                        }, 2000);
                    }
                }
            });

        // 批量导出按钮
        this.copyButton = parent.createEl('button', {
            text: '导出全部',
            cls: 'red-export-button'
        });

        this.copyButton.addEventListener('click', async () => {
                if (this.previewEl) {
                    // 检查是否需要显示捐赠弹窗


                    this.copyButton.disabled = true;
                    this.copyButton.setText('导出中...');

                    try {
                        await this.downloadManager.downloadAllImages(this.previewEl);
                        this.copyButton.setText('导出成功');
                    } catch (error) {
                        this.copyButton.setText('导出失败');
                    } finally {
                        setTimeout(() => {
                            this.copyButton.disabled = false;
                            this.copyButton.setText('导出全部页');
                        }, 2000);
                    }
                }
            });
    }

    private initializeCopyButtonListener() {
        const copyButtonHandler = async (e: CustomEvent) => {
            const { copyButton } = e.detail;
            if (copyButton) {
                copyButton.addEventListener('click', async () => {
                    copyButton.disabled = true;
                    try {
                        // 检查是否需要显示捐赠弹窗


                        await ClipboardManager.copyImageToClipboard(this.previewEl);
                        new Notice('图片已复制到剪贴板');
                    } catch (error) {
                        new Notice('复制失败');
                        console.error('复制图片失败:', error);
                    } finally {
                        setTimeout(() => {
                            copyButton.disabled = false;
                        }, 1000);
                    }
                });
            }
        };

        this.containerEl.addEventListener('copy-button-added', copyButtonHandler as EventListener);
        this.register(() => {
            this.containerEl.removeEventListener('copy-button-added', copyButtonHandler as EventListener);
        });
    }
    // #endregion

    // #region 设置管理
    private async restoreSettings() {
        const settings = this.settingsManager.getSettings();

        if (settings.fontFamily) {
            await this.restoreFontSettings(settings.fontFamily);
        }
        if (settings.fontSize) {
            this.fontSizeSelect.value = settings.fontSize.toString();
        }
    }





    private async restoreFontSettings(fontFamily: string) {
        const fontSelect = this.customFontSelect.querySelector('.red-select-text');
        const fontDropdown = this.customFontSelect.querySelector('.red-select-dropdown');
        if (fontSelect && fontDropdown) {
            const option = this.getFontOptions();
            const selected = option.find(o => o.value === fontFamily);
            if (selected) {
                fontSelect.textContent = selected.label;
                this.customFontSelect.querySelector('.red-select')?.setAttribute('data-value', selected.value);
                fontDropdown.querySelectorAll('.red-select-item').forEach(el => {
                    if (el.getAttribute('data-value') === selected.value) {
                        el.classList.add('red-selected');
                    } else {
                        el.classList.remove('red-selected');
                    }
                });
            }
        }
    }
    // #endregion

    // #region 预览更新
    private async updatePreview() {
        if (!this.currentFile) return;
        
        // 保存当前的缩放状态
        const savedScales: {transform: string, transformOrigin: string}[] = [];
        const currentPreviewElements = this.previewEl.querySelectorAll('.red-image-preview');
        currentPreviewElements.forEach((el: Element) => {
            const previewEl = el as HTMLElement;
            savedScales.push({
                transform: previewEl.style.transform,
                transformOrigin: previewEl.style.transformOrigin
            });
        });
        
        this.previewEl.empty();

        const content = await this.app.vault.cachedRead(this.currentFile);
        await MarkdownRenderer.render(
            this.app,
            content,
            this.previewEl,
            this.currentFile.path,
            this
        );

        // 确保 Markdown 内容完全渲染完成后再处理
        requestAnimationFrame(async () => {
            
            // 临时禁用ResizeObserver，避免恢复缩放值时被覆盖
            this.resizeObserver?.disconnect();
            
            await RedConverter.formatContent(this.previewEl, this.currentFile?.path || '');
            const hasValidContent = RedConverter.hasValidContent(this.previewEl);

            if (hasValidContent) {
                // 应用当前模板
                const settings = { ...this.settingsManager.getSettings() } as any;
                if (this.currentFile) {
                    settings.currentFileName = this.currentFile.basename;
                }
                this.imgTemplateManager.applyTemplate(this.previewEl, settings);
                
                // 应用当前背景设置
                const backgroundSettings = this.settingsManager.getSettings().backgroundSettings;
                if (backgroundSettings.imageUrl) {
                    const previewContainer = this.previewEl.querySelector('.red-image-preview');
                    if (previewContainer) {
                        this.backgroundManager.applyBackgroundStyles(previewContainer as HTMLElement, backgroundSettings);
                    }
                }
            }

            // 恢复缩放值和transform-origin
            if (savedScales.length > 0) {
                const newPreviewElements = this.previewEl.querySelectorAll('.red-image-preview');
                newPreviewElements.forEach((el: Element, index: number) => {
                    if (index < savedScales.length) {
                        const previewEl = el as HTMLElement;
                        // 应用保存的缩放值，优先级高于默认值
                        previewEl.style.transform = savedScales[index].transform;
                        previewEl.style.transformOrigin = savedScales[index].transformOrigin;
                    }
                });
            }

            this.updateControlsState(hasValidContent);
            if (!hasValidContent) {
                this.copyButton.setAttribute('title', '请先添加内容');
            } else {
                this.copyButton.removeAttribute('title');
            }
            this.updateNavigationState();
            
            // 计算并设置内容区域的高度：父级容器高度 - 页脚高度
            const imagePreviews = this.previewEl.querySelectorAll('.red-image-preview');
            imagePreviews.forEach((imagePreview: Element) => {
                const previewElement = imagePreview as HTMLElement;
                const contentArea = previewElement.querySelector('.red-preview-content') as HTMLElement;
                const footerArea = previewElement.querySelector('.red-preview-footer') as HTMLElement;
                
                if (contentArea && footerArea) {
                    // 页脚元素存在，移除固定高度限制，让内容区域自适应高度
                    // 移除固定高度设置
                    contentArea.style.height = 'auto';
                    // 确保内容区域不会溢出
                    contentArea.style.overflow = 'hidden';
                    // 恢复flex属性，让内容区域占据可用空间
                    contentArea.style.flex = '1';
                }
                
                // 应用字体大小设置到.red-image-preview元素
                const settings = this.settingsManager.getSettings();
                if (settings.fontSize) {
                    previewElement.style.fontSize = `${settings.fontSize}px`;
                }
            });
            
            // 重新启用ResizeObserver，但不立即更新缩放，保持当前恢复的缩放值
            this.lastContainerWidth = this.previewEl.clientWidth;
            this.resizeObserver?.observe(this.previewEl);
        });
    }

    private updateControlsState(enabled: boolean) {
        this.lockButton.disabled = !enabled;

        const fontSelect = this.customFontSelect.querySelector('.red-select');
        if (fontSelect) {
            fontSelect.classList.toggle('disabled', !enabled);
            fontSelect.setAttribute('style', `pointer-events: ${enabled ? 'auto' : 'none'}`);
        }

        this.fontSizeSelect.disabled = !enabled;
        const fontSizeButtons = this.containerEl.querySelectorAll('.red-font-size-btn');
        fontSizeButtons.forEach(button => {
            (button as HTMLButtonElement).disabled = !enabled;
        });

        this.copyButton.disabled = !enabled;
        const singleDownloadButton = this.containerEl.querySelector('.red-export-button');
        if (singleDownloadButton) {
            (singleDownloadButton as HTMLButtonElement).disabled = !enabled;
        }
    }
    // #endregion

    // #region 文件处理
    async onFileOpen(file: TFile | null) {
        this.currentFile = file;
        this.currentImageIndex = 0;

        if (!file || file.extension !== 'md') {
            this.previewEl.empty();
            this.previewEl.createEl('div', {
                text: '只能预览 markdown 文本文档',
                cls: 'red-empty-state'
            });
            this.updateControlsState(false);
            return;
        }

        this.updateControlsState(true);
        this.isPreviewLocked = false;
        setIcon(this.lockButton, 'unlock');
        await this.updatePreview();
    }

    async onFileModify(file: TFile) {
        if (file === this.currentFile && !this.isPreviewLocked) {
            if (this.updateTimer) {
                window.clearTimeout(this.updateTimer);
            }
            this.updateTimer = window.setTimeout(() => {
                this.updatePreview();
            }, 500);
        }
    }

    private async togglePreviewLock() {
        this.isPreviewLocked = !this.isPreviewLocked;
        const lockIcon = this.isPreviewLocked ? 'lock' : 'unlock';
        const lockStatus = this.isPreviewLocked ? '开启实时预览状态' : '关闭实时预览状态';
        setIcon(this.lockButton, lockIcon);
        this.lockButton.setAttribute('aria-label', lockStatus);

        if (!this.isPreviewLocked) {
            await this.updatePreview();
        }
    }

    // #region 工具方法
    private createCustomSelect(
        parent: HTMLElement,
        className: string,
        options: { value: string; label: string }[]
    ) {
        const container = parent.createEl('div', { cls: `red-select-container ${className}` });
        const select = container.createEl('div', { cls: 'red-select' });
        const selectedText = select.createEl('span', { cls: 'red-select-text' });
        select.createEl('span', { cls: 'red-select-arrow', text: '▾' });

        const dropdown = container.createEl('div', { cls: 'red-select-dropdown' });

        options.forEach(option => {
            const item = dropdown.createEl('div', {
                cls: 'red-select-item',
                text: option.label
            });

            item.dataset.value = option.value;
            item.addEventListener('click', () => {
                dropdown.querySelectorAll('.red-select-item').forEach(el =>
                    el.classList.remove('red-selected'));
                item.classList.add('red-selected');
                selectedText.textContent = option.label;
                select.dataset.value = option.value;
                dropdown.classList.remove('red-show');
                select.dispatchEvent(new CustomEvent('change', {
                    detail: { value: option.value }
                }));
            });
        });

        if (options.length > 0) {
            selectedText.textContent = options[0].label;
            select.dataset.value = options[0].value;
            dropdown.querySelector('.red-select-item')?.classList.add('red-selected');
        }

        select.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('red-show');
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('red-show');
        });

        return container;
    }





    private getFontOptions() {
        return this.settingsManager.getFontOptions();
    }
    // #endregion


    // 检查是否需要显示捐赠弹窗

}
