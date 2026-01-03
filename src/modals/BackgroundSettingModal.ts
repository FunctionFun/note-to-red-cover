import { App, Modal, Setting } from 'obsidian';
import { BackgroundManager } from '../backgroundManager';
import { builtinBg1 } from '../assets/backgrounds/builtinBackgrounds';
export interface BackgroundSettings {
    imageUrl: string;
    scale: number;
    position: { x: number; y: number };
    backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    opacity?: number;
}

export class BackgroundSettingModal extends Modal {
    private imageUrl = '';
    private scale = 1;
    private position: { x: number; y: number } = { x: 0, y: 0 };
    private backgroundRepeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y' = 'no-repeat';
    private opacity = 0.8;
    private initialSettings?: BackgroundSettings;
    private previewImage: HTMLElement | null = null;
    private dragEventCleanup: (() => void) | null = null;
    private backgroundManager: BackgroundManager;
    constructor(
        app: App,
        private onSubmit: (settings: BackgroundSettings) => void,
        private targetPreviewEl: HTMLElement,
        backgroundManager: BackgroundManager,
        initialSettings?: BackgroundSettings
    ) {
        super(app);
        this.initialSettings = initialSettings;
        this.backgroundManager = backgroundManager;
        this.loadInitialSettings();
    }

    private loadInitialSettings() {
        if (this.initialSettings) {
            this.imageUrl = this.initialSettings.imageUrl;
            this.scale = this.initialSettings.scale;
            this.position = { ...this.initialSettings.position };
            this.backgroundRepeat = this.initialSettings.backgroundRepeat || 'no-repeat';
            this.opacity = this.initialSettings.opacity ?? 0.8;
        }
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
    
        const container = contentEl.createEl('div', { cls: 'red-background-container' });
        container.createEl('h3', { text: '背景图片', cls: 'red-background-title' });
    
        // 内置背景选择区
        const builtInBgArea = container.createEl('div', { cls: 'red-background-builtins' });
        const builtInImages = [builtinBg1];
        builtInImages.forEach(src => {
            const thumb = builtInBgArea.createEl('img', { attr: { src }, cls: 'red-bg-thumb' });
            thumb.addEventListener('click', () => {
                this.imageUrl = src;
                this.scale = 1;
                this.position = { x: 0, y: 0 };
                if (this.previewImage) {
                    this.applyBackgroundStyles(this.previewImage, {
                        imageUrl: this.imageUrl,
                        scale: this.scale,
                        position: this.position,
                        backgroundRepeat: this.backgroundRepeat,
                        opacity: this.opacity
                    });
                    this.initDragAndScale();
                }
                // 新增：同步更新主预览区
                this.updateTargetPreview(true);
            });
        });
    
        const previewArea = container.createEl('div', { cls: 'red-background-preview' });
        this.previewImage = previewArea.createEl('div', { cls: 'red-background-preview-image' });
    
        const controlsArea = container.createEl('div', { cls: 'red-background-controls' });
        this.createControls(controlsArea);
    
        if (this.imageUrl) {
            this.applyBackgroundStyles(this.previewImage, {
                imageUrl: this.imageUrl,
                scale: this.scale,
                position: this.position,
                backgroundRepeat: this.backgroundRepeat,
                opacity: this.opacity
            });
            this.initDragAndScale();
        }
    }

    private createControls(container: HTMLElement) {
        // 图片选择和清除按钮组
        new Setting(container)
            .addButton(button => button
                .setButtonText('选择图片')
                .onClick(() => this.handleImageUpload()))
            .addButton(button => button
                .setButtonText('清除图片')
                .onClick(() => this.handleClearImage()));

        // 背景平铺样式选择器
        new Setting(container)
            .setName('背景平铺')
            .setDesc('选择背景图片的平铺方式')
            .addDropdown(dropdown => {
                dropdown.addOption('no-repeat', '不平铺');
                dropdown.addOption('repeat', '平铺');
                dropdown.addOption('repeat-x', '水平平铺');
                dropdown.addOption('repeat-y', '垂直平铺');
                
                dropdown.setValue(this.backgroundRepeat);
                dropdown.onChange(value => {
                    this.backgroundRepeat = value as 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
                    this.handleBackgroundRepeatChange();
                });
            });

        new Setting(container)
            .setName('缩放')
            .addSlider(slider => slider
                .setLimits(0.1, 2, 0.01)
                .setValue(this.scale)
                .onChange(value => this.handleScaleChange(value)));

        new Setting(container)
            .setName('透明度')
            .setDesc('调整背景图片的透明程度 (0-1)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.01)
                .setValue(this.opacity)
                .onChange(value => this.handleOpacityChange(value)));

        new Setting(container)
            .addButton(button => button
                .setButtonText('确认')
                .setCta()
                .onClick(() => this.handleConfirm()))
            .addButton(button => button
                .setButtonText('取消')
                .onClick(() => this.handleCancel()));
    }

    private handleBackgroundRepeatChange() {
        if (this.previewImage) {
            this.applyBackgroundStyles(this.previewImage, {
                imageUrl: this.imageUrl,
                scale: this.scale,
                position: this.position,
                backgroundRepeat: this.backgroundRepeat
            });
        }
        this.updateTargetPreview(true);
    }

    private handleOpacityChange(value: number) {
        this.opacity = Math.max(0, Math.min(1, value));
        if (this.previewImage) {
            this.applyBackgroundStyles(this.previewImage, {
                imageUrl: this.imageUrl,
                scale: this.scale,
                position: this.position,
                backgroundRepeat: this.backgroundRepeat,
                opacity: this.opacity
            });
        }
        this.updateTargetPreview(true);
    }

    private handleImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imageUrl = e.target?.result as string;
                    if (this.previewImage) {
                        this.applyBackgroundStyles(this.previewImage, {
                            imageUrl: this.imageUrl,
                            scale: this.scale,
                            position: this.position,
                            backgroundRepeat: this.backgroundRepeat,
                            opacity: this.opacity
                        });
                        this.initDragAndScale();
                    }
                    // 新增：同步更新主预览区
                    this.updateTargetPreview(true);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    private handleScaleChange(value: number) {
        this.scale = value;
        if (this.previewImage) {
            this.applyBackgroundStyles(this.previewImage, {
                imageUrl: this.imageUrl,
                scale: this.scale,
                position: this.position,
                backgroundRepeat: this.backgroundRepeat,
                opacity: this.opacity
            });
        }
        this.updateTargetPreview(true);
    }

    private handleConfirm() {
        const backgroundSettings = {
            imageUrl: this.imageUrl,
            scale: this.scale,
            position: this.position,
            backgroundRepeat: this.backgroundRepeat,
            opacity: this.opacity
        };
        this.onSubmit(backgroundSettings);
        this.close();
    }

    private handleCancel() {
        this.updateTargetPreview(false);
        this.close();
    }

    private initDragAndScale() {
        if (!this.previewImage) return;

        let isDragging = false;
        let startX: number, startY: number;

        const handleMouseDown = (e: MouseEvent) => {
            isDragging = true;
            startX = e.clientX - this.position.x;
            startY = e.clientY - this.position.y;
            this.previewImage?.addClass('dragging');
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            this.position.x = e.clientX - startX;
            this.position.y = e.clientY - startY;
            if (this.previewImage) {
                this.applyBackgroundStyles(this.previewImage, {
                    imageUrl: this.imageUrl,
                    scale: this.scale,
                    position: this.position,
                    backgroundRepeat: this.backgroundRepeat,
                    opacity: this.opacity
                });
            }
            this.updateTargetPreview(true);
        };

        const handleMouseUp = () => {
            isDragging = false;
            this.previewImage?.removeClass('dragging');
        };

        this.previewImage.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // 保存清理函数
        this.dragEventCleanup = () => {
            this.previewImage?.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }

    private applyBackgroundStyles(element: HTMLElement, settings: BackgroundSettings) {
        this.backgroundManager.applyBackgroundStyles(element, settings);
    }

    private updateTargetPreview(applyBackground = true) {
        const previewContainer = this.targetPreviewEl.querySelector('.red-image-preview');
        if (!previewContainer) return;

        if (applyBackground && this.imageUrl) {
            this.applyBackgroundStyles(previewContainer as HTMLElement, {
                imageUrl: this.imageUrl,
                scale: this.scale,
                position: this.position,
                backgroundRepeat: this.backgroundRepeat,
                opacity: this.opacity
            });
        } else if (!applyBackground && this.initialSettings?.imageUrl) {
            this.applyBackgroundStyles(previewContainer as HTMLElement, this.initialSettings);
        } else {
            this.backgroundManager.clearBackgroundStyles(previewContainer as HTMLElement);
        }
    }

    private handleClearImage() {
        this.imageUrl = '';
        this.scale = 1;
        this.position = { x: 0, y: 0 };

        if (this.previewImage) {
            this.previewImage.setAttribute('style', '');
        }

        // 更新目标预览并清除设置
        const previewContainer = this.targetPreviewEl.querySelector('.red-image-preview');
        if (previewContainer) {
            this.backgroundManager.clearBackgroundStyles(previewContainer as HTMLElement);
        }

        // 清除设置
        this.onSubmit({
            imageUrl: '',
            scale: 1,
            position: { x: 0, y: 0 }
        });
    }

    onClose() {
        // 清理事件监听器
        if (this.dragEventCleanup) {
            this.dragEventCleanup();
            this.dragEventCleanup = null;
        }

        // 恢复初始状态
        this.updateTargetPreview(false);

        // 清理DOM
        const { contentEl } = this;
        contentEl.empty();
    }
}