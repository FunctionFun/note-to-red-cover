import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import type { SettingsManager } from './settings/settings';
import type { App, TFile } from 'obsidian';

export class DownloadManager {
    private settingsManager: SettingsManager;
    private app: App;

    constructor(settingsManager: SettingsManager, app: App) {
        this.settingsManager = settingsManager;
        this.app = app;
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
    private getExportConfig(imageElement: HTMLElement) {
        return {
            quality: 1,
            pixelRatio: 4,
            skipFonts: false,
            // 添加过滤器，确保所有元素都被包含
            filter: (node: Node) => {
                return true;
            },
            // 处理图片加载错误
            imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        };
    }

    async downloadAllImages(element: HTMLElement): Promise<void> {
        try {
            const zip = new JSZip();
            const previewContainer = element.querySelector('.red-preview-container');
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

                sections[i].classList.remove(HIDDEN_CLASS);
                sections[i].classList.add(VISIBLE_CLASS);

                // 确保浏览器完成重绘并等待资源加载
                await new Promise(resolve => setTimeout(resolve, 300));

                const imageElement = element.querySelector<HTMLElement>('.red-image-preview')!;

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
                } catch (err) {
                    console.error(`第${i + 1}页导出失败`, err);
                }
            }

            // 恢复原始类名状态
            sections.forEach((section, index) => {
                section.classList.toggle(VISIBLE_CLASS, originalVisibility[index].visible);
                section.classList.toggle(HIDDEN_CLASS, originalVisibility[index].hidden);
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
        const { watermarkText, watermarkImage, opacity, count } = watermarkSettings;

        // 设置透明度
        ctx.globalAlpha = opacity;

        // 生成随机位置的水印
        for (let i = 0; i < count; i++) {
            // 随机位置
            const x = Math.random() * width;
            const y = Math.random() * height;
            
            // 随机旋转角度 (-30 到 30 度)
            const rotation = (Math.random() * 60 - 30) * Math.PI / 180;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

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

    async downloadSingleImage(element: HTMLElement): Promise<void> {
        try {
            const imageElement = element.querySelector('.red-image-preview') as HTMLElement;
            if (!imageElement) {
                throw new Error('找不到预览区域');
            }

            // 确保浏览器完成重绘并等待资源加载
            await new Promise(resolve => setTimeout(resolve, 300));

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
        } catch (error) {
            console.error('导出图片失败:', error);
            throw error;
        }
    }
}