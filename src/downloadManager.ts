import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import type { SettingsManager } from './settings/settings';
import type { App } from 'obsidian';
import { WatermarkManager } from './watermarkManager';

export class DownloadManager {
    private settingsManager: SettingsManager;
    private app: App;
    private watermarkManager: WatermarkManager;

    constructor(settingsManager: SettingsManager, app: App) {
        this.settingsManager = settingsManager;
        this.app = app;
        this.watermarkManager = new WatermarkManager();
    }

    // 获取当前活动笔记的ID
    private getCurrentNoteId(): string | null {
        const activeFile = this.app.workspace.getActiveFile();
        return activeFile ? activeFile.path : null;
    }

    // 标记笔记为已导出
    private async markNoteAsExported(noteId: string): Promise<void> {
        const settings = this.settingsManager.getSettings();
        if (!settings.exportedNotes.includes(noteId)) {
            settings.exportedNotes.push(noteId);
            await this.settingsManager.updateSettings(settings);
        }
    }
    // 添加共用的导出配置方法
    private getExportConfig(_imageElement: HTMLElement) {
        // 使用小红书封面标准尺寸：400x600
        const width = 400;
        const height = 600;
        console.log("导出图片尺寸：", width, "x", height);
        
        return {
            quality: 1,
            pixelRatio: 1, // 保持1:1的比例
            width: width,
            height: height,
            skipFonts: false,
            // 移除严格的过滤器，确保所有子元素都被包含
            filter: (_node: Node) => {
                return true;
            },
            // 处理图片加载错误
            imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        };
    }

    async downloadAllImages(element: HTMLElement): Promise<void> {
        try {
            const zip = new JSZip();
            console.log('开始批量导出图片...');
            
            // 使用增强的元素查找找到预览容器
            const targetElement = await this.findTargetElement(element);
            const previewContainer = targetElement.parentElement;
            if (!previewContainer) throw new Error('找不到预览容器');

            // 定义 CSS 类名常量
            const VISIBLE_CLASS = 'red-section-visible';
            const HIDDEN_CLASS = 'red-section-hidden';

            const sections = previewContainer.querySelectorAll<HTMLElement>('.red-content-section');
            const totalSections = sections.length;

            // 保存原始可见状态（基于类名）
            const originalVisibility = Array.from(sections).map(section => ({
                visible: section.classList.contains(VISIBLE_CLASS),
                hidden: section.classList.contains(HIDDEN_CLASS)
            }));

            for (let i = 0; i < totalSections; i++) {
                // 使用 classList API 批量操作
                sections.forEach(section => {
                    section.classList.add(HIDDEN_CLASS);
                    section.classList.remove(VISIBLE_CLASS);
                });

                if (sections[i]) {
                    sections[i]!.classList.remove(HIDDEN_CLASS);
                    sections[i]!.classList.add(VISIBLE_CLASS);
                }

                // 确保浏览器完成重绘并等待资源加载
                    await new Promise(resolve => setTimeout(resolve, 500)); // 增加等待时间确保渲染完成

                    console.log(`批量导出 - 处理第${i + 1}页...`);
                    // 重新查找目标元素，确保获取最新的DOM状态
                    const imageElement = await this.findTargetElement(element);
                    console.log('批量导出 - 找到的元素：', imageElement);

                try {
                    // 临时移除可能导致额外边距的样式
                    const originalStyles = {
                        padding: imageElement.style.padding,
                        paddingBottom: imageElement.style.paddingBottom,
                        boxShadow: imageElement.style.boxShadow,
                        margin: imageElement.style.margin
                    };

                    // 移除内边距、外边距和阴影，确保只导出内容
                    imageElement.style.padding = '0px';
                    imageElement.style.paddingBottom = '0px';
                    imageElement.style.boxShadow = 'none';
                    imageElement.style.margin = '0px';

                    try {
                        // 使用canvas方法以便添加水印
                        const canvas = await htmlToImage.toCanvas(imageElement, this.getExportConfig(imageElement));
                        
                        // 添加水印
                        const watermarkedCanvas = await this.addWatermark(canvas);
                        
                        // 转换为blob
                        const blob = await new Promise<Blob>((resolve, reject) => {
                            watermarkedCanvas.toBlob((b) => {
                                if (b) {
                                    resolve(b);
                                } else {
                                    reject(new Error('Canvas 转换为 Blob 失败'));
                                }
                            }, 'image/png', 1);
                        });
                        
                        if (blob instanceof Blob) {
                            zip.file(`小红书笔记_第${i + 1}页.png`, blob);
                        } else {
                            throw new Error('生成的不是有效的 Blob 对象');
                        }
                    } finally {
                        // 恢复原始样式
                        Object.assign(imageElement.style, originalStyles);
                    }
                    } catch (err) {
                        console.error(`第${i + 1}页导出失败`, err);
                    }
            }

            // 恢复原始类名状态
            sections.forEach((section, index) => {
                if (originalVisibility[index]) {
                    section.classList.toggle(VISIBLE_CLASS, originalVisibility[index]!.visible);
                    section.classList.toggle(HIDDEN_CLASS, originalVisibility[index]!.hidden);
                }
            });

            // 创建下载
            const content = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            });

            if (!(content instanceof Blob)) {
                throw new Error('生成的压缩文件不是有效的 Blob 对象');
            }

            // 标记笔记为已导出
            const noteId = this.getCurrentNoteId();
            if (noteId) {
                await this.markNoteAsExported(noteId);
            }

            const url = URL.createObjectURL(content);
            const link = Object.assign(document.createElement('a'), {
                href: url,
                download: `小红书笔记_${Date.now()}.zip`
            });

            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('导出图片失败:', error);
            throw error;
        }
    }

    // 添加水印到canvas
    private async addWatermark(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
        const watermarkSettings = this.settingsManager.getSettings().watermarkSettings;
        if (!watermarkSettings.enabled) {
            return canvas;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return canvas;
        }

        const { width, height } = canvas;
        const { watermarkText, watermarkImage, opacity } = watermarkSettings;

        // 获取统一的随机种子，确保与预览的一致性
        const seed = this.watermarkManager.getWatermarkSeed();
        
        // 使用WatermarkManager生成水印位置
        const positions = this.watermarkManager.generateWatermarkPositions({
            containerWidth: width,
            containerHeight: height,
            settings: watermarkSettings,
            seed: seed
        });

        // 设置透明度
        ctx.globalAlpha = opacity;

        // 根据生成的位置绘制水印
        for (const position of positions) {
            const { x, y, rotation } = position;
            
            // 转换角度为弧度
            const rotationRad = rotation * Math.PI / 180;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotationRad);

            if (watermarkImage) {
                // 使用图片水印
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = watermarkImage;
                });
                // 调整图片大小
                const imgWidth = 100;
                const imgHeight = (img.height / img.width) * imgWidth;
                ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
            } else if (watermarkText) {
                // 使用文字水印
                ctx.font = '24px Arial';
                ctx.fillStyle = watermarkSettings.watermarkColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(watermarkText, 0, 0);
            }

            ctx.restore();
        }

        // 恢复透明度
        ctx.globalAlpha = 1;

        return canvas;
    }

    // 增强的元素查找函数
    private async findTargetElement(element: HTMLElement): Promise<HTMLElement> {
        const maxAttempts = 10;
        const delay = 200;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`尝试查找目标元素 (第${attempt}次)...`);
            // console.log('当前元素结构:', element.innerHTML);
            console.log('元素类名:', element.className);
            
            // 首先尝试在直接传入的元素中查找
            let target = element.querySelector('.red-image-preview');
            console.log('直接查找结果:', target);
            
            // 如果没找到，尝试查找子元素
            if (!target) {
                console.log('尝试查找所有子元素:');
                Array.from(element.children).forEach((child, index) => {
                    console.log(`子元素 ${index}: ${child.outerHTML}`);
                });
                
                // 尝试在所有包含red类名的元素中查找
                const redElements = Array.from(element.querySelectorAll('[class*="red"]'));
                console.log(`找到 ${redElements.length} 个包含red的元素:`);
                redElements.forEach(el => {
                    console.log(`  - ${el.className}: ${el.tagName}`);
                });
                
                // 尝试查找预览容器
                const previewContainer = element.querySelector('.red-preview-container');
                console.log('预览容器:', previewContainer);
                
                if (previewContainer) {
                    target = previewContainer.querySelector('.red-image-preview');
                    console.log('从预览容器查找结果:', target);
                }
            }
            
            if (target) {
                console.log('成功找到目标元素:', target);
                return target as HTMLElement;
            }
            
            // 如果没找到，等待后重试
            console.log(`第${attempt}次尝试未找到元素，等待${delay}ms后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // 最后尝试在整个文档中查找
        const docTarget = document.querySelector('.red-image-preview');
        if (docTarget) {
            console.log('在整个文档中找到目标元素:', docTarget);
            return docTarget as HTMLElement;
        }
        
        throw new Error('找不到.red-image-preview元素');
    }

    async downloadSingleImage(element: HTMLElement): Promise<void> {
        try {
            console.log('开始导出单张图片...');
            
            // 增强的元素查找
            const imageElement = await this.findTargetElement(element);

            // 确保浏览器完成重绘并等待资源加载
            await new Promise(resolve => setTimeout(resolve, 500)); // 增加等待时间确保渲染完成

            // 临时移除可能导致额外边距的样式
            const originalStyles = {
                padding: imageElement.style.padding,
                paddingBottom: imageElement.style.paddingBottom,
                boxShadow: imageElement.style.boxShadow,
                margin: imageElement.style.margin
            };

            // 移除内边距、外边距和阴影，确保只导出内容
            imageElement.style.padding = '0px';
            imageElement.style.paddingBottom = '0px';
            imageElement.style.boxShadow = 'none';
            imageElement.style.margin = '0px';

            try {
                // 使用canvas方法以便添加水印
                const canvas = await htmlToImage.toCanvas(imageElement, this.getExportConfig(imageElement));
                
                // 添加水印
                const watermarkedCanvas = await this.addWatermark(canvas);

                // 标记笔记为已导出
                const noteId = this.getCurrentNoteId();
                if (noteId) {
                    await this.markNoteAsExported(noteId);
                }

                // 转换为blob并下载
                watermarkedCanvas.toBlob((blob) => {
                    if (!blob) {
                        throw new Error('Canvas 转换为 Blob 失败');
                    }
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `小红书笔记_${new Date().getTime()}.png`;

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 'image/png', 1);
            } finally {
                // 恢复原始样式
                Object.assign(imageElement.style, originalStyles);
            }
        } catch (error) {
            console.error('导出图片失败:', error);
            throw error;
        }
    }
}