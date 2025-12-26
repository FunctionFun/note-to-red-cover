import * as htmlToImage from 'html-to-image';

export class ClipboardManager {
    private static getExportConfig(_imageElement: HTMLElement) {
        // 直接使用元素的CSS尺寸，而不是getBoundingClientRect()获取的显示尺寸
        // 确保导出尺寸严格为540x720
        const width = 540;
        const height = 720;
        
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
            imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        };
    }

    // 增强的元素查找函数
    private static async findTargetElement(element: HTMLElement): Promise<HTMLElement> {
        const maxAttempts = 10;
        const delay = 200;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`复制功能 - 尝试查找目标元素 (第${attempt}次)...`);
            console.log('复制功能 - 当前元素结构:', element.innerHTML);
            console.log('复制功能 - 元素类名:', element.className);
            
            // 首先尝试在直接传入的元素中查找
            let target = element.querySelector('.red-image-preview');
            console.log('复制功能 - 直接查找结果:', target);
            
            // 如果没找到，尝试查找子元素
            if (!target) {
                console.log('复制功能 - 尝试查找所有子元素:');
                Array.from(element.children).forEach((child, index) => {
                    console.log(`复制功能 - 子元素 ${index}: ${child.outerHTML}`);
                });
                
                // 尝试在所有包含red类名的元素中查找
                const redElements = Array.from(element.querySelectorAll('[class*="red"]'));
                console.log(`复制功能 - 找到 ${redElements.length} 个包含red的元素:`);
                redElements.forEach(el => {
                    console.log(`复制功能 -   - ${el.className}: ${el.tagName}`);
                });
                
                // 尝试查找预览容器
                const previewContainer = element.querySelector('.red-preview-container');
                console.log('复制功能 - 预览容器:', previewContainer);
                
                if (previewContainer) {
                    target = previewContainer.querySelector('.red-image-preview');
                    console.log('复制功能 - 从预览容器查找结果:', target);
                }
            }
            
            if (target) {
                console.log('复制功能 - 成功找到目标元素:', target);
                return target as HTMLElement;
            }
            
            // 如果没找到，等待后重试
            console.log(`复制功能 - 第${attempt}次尝试未找到元素，等待${delay}ms后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // 最后尝试在整个文档中查找
        const docTarget = document.querySelector('.red-image-preview');
        if (docTarget) {
            console.log('复制功能 - 在整个文档中找到目标元素:', docTarget);
            return docTarget as HTMLElement;
        }
        
        throw new Error('找不到.red-image-preview元素');
    }

    static async copyImageToClipboard(element: HTMLElement): Promise<boolean> {
        try {
            console.log('开始复制图片到剪贴板...');
            
            // 增强的元素查找
            const imageElement = await this.findTargetElement(element);

            // 确保浏览器完成重绘并等待资源加载
            await new Promise(resolve => setTimeout(resolve, 300));

            try {
                const blob = await htmlToImage.toBlob(imageElement, this.getExportConfig(imageElement));
                if (!(blob instanceof Blob)) {
                    throw new Error('生成的不是有效的 Blob 对象');
                }

                // 创建 ClipboardItem 对象
                const clipboardItem = new ClipboardItem({
                    'image/png': blob
                });
                
                // 写入剪贴板
                await navigator.clipboard.write([clipboardItem]);
                return true;
            } catch (err) {
                console.warn('复制失败，尝试备用方法', err);
                // 备用方法：使用 toCanvas
                const canvas = await htmlToImage.toCanvas(imageElement, this.getExportConfig(imageElement));
                try {
                    // 尝试直接复制 Canvas
                    await new Promise<void>((resolve, reject) => {
                        canvas.toBlob(async (blob) => {
                            if (!blob) {
                                reject(new Error('Canvas 转换为 Blob 失败'));
                                return;
                            }
                            try {
                                const clipboardItem = new ClipboardItem({
                                    'image/png': blob
                                });
                                await navigator.clipboard.write([clipboardItem]);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }, 'image/png', 1);
                    });
                    return true;
                } catch (clipboardErr) {
                    console.error('复制到剪贴板失败', clipboardErr);
                    return false;
                }
            }
        } catch (error) {
            console.error('复制图片失败:', error);
            return false;
        }
    }
}