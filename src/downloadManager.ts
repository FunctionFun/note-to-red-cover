import * as htmlToImage from "html-to-image";
import JSZip from "jszip";
import type { App } from "obsidian";
import { TFile } from "obsidian";

export class DownloadManager {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	// 获取当前活动笔记的ID
	private getCurrentNoteId(): string | null {
		const activeFile = this.app.workspace.getActiveFile();
		return activeFile ? activeFile.path : null;
	}

	// 标记笔记为已导出（通过笔记属性）
	private async markNoteAsExported(noteId: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(noteId);
		if (!(file instanceof TFile)) return;
		
		const tFile = file;
		const metadata = this.app.metadataCache.getFileCache(tFile);
		const frontmatter = metadata?.frontmatter || {};
		
		// 添加/更新"导出状态"属性
		if (frontmatter["导出状态"] !== "已导出") {
			frontmatter["导出状态"] = "已导出";
			const content = await this.app.vault.read(tFile);
			const newContent = this.updateFrontmatter(content, frontmatter);
			await this.app.vault.modify(tFile, newContent);
		}
	}

	// 更新笔记的frontmatter
	private updateFrontmatter(content: string, frontmatter: any): string {
		// 检查内容是否已经有frontmatter
		if (content.startsWith("---\n")) {
			// 找到frontmatter的结束位置
			const endIndex = content.indexOf("\n---\n", 4);
			if (endIndex !== -1) {
				// 替换现有的frontmatter
				const yamlContent = this.yamlify(frontmatter);
				return content.substring(0, 4) + yamlContent + content.substring(endIndex);
			}
		}
		
		// 如果没有frontmatter，添加一个新的
		const yamlContent = this.yamlify(frontmatter);
		return `---
${yamlContent}---
${content}`;
	}

	// 将对象转换为YAML格式
	private yamlify(obj: any): string {
		const lines: string[] = [];
		for (const [key, value] of Object.entries(obj)) {
			lines.push(`${key}: ${value}`);
		}
		return lines.join("\n") + "\n";
	}

	// 添加共用的导出配置方法
	private getExportConfig() {
		return {
			width: 540,
			height: 720,
			scale: 2,
			skipFonts: false,
			imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
		};
	}

	async downloadAllImages(element: HTMLElement): Promise<void> {
		// 保存所有.red-image-preview元素的原始transform值
		const originalTransforms = this.saveAllTransforms();
		
		try {
			// 应用临时scale(1)转换
			this.applyAllScaleOne();
			
			const zip = new JSZip();
			console.log("开始批量导出图片...");

			// 使用增强的元素查找找到预览容器
			const targetElement = await this.findTargetElement(element);
			const previewContainer = targetElement.parentElement;
			if (!previewContainer) throw new Error("找不到预览容器");

			// 定义 CSS 类名常量
			const VISIBLE_CLASS = "red-section-visible";
			const HIDDEN_CLASS = "red-section-hidden";

			const sections = previewContainer.querySelectorAll<HTMLElement>(
				".red-content-section"
			);
			const totalSections = sections.length;

			// 保存原始可见状态（基于类名）
			const originalVisibility = Array.from(sections).map((section) => ({
				visible: section.classList.contains(VISIBLE_CLASS),
				hidden: section.classList.contains(HIDDEN_CLASS),
			}));

			for (let i = 0; i < totalSections; i++) {
				// 使用 classList API 批量操作
				sections.forEach((section) => {
					section.classList.add(HIDDEN_CLASS);
					section.classList.remove(VISIBLE_CLASS);
				});

				if (sections[i]) {
					sections[i]!.classList.remove(HIDDEN_CLASS);
					sections[i]!.classList.add(VISIBLE_CLASS);
				}

				// 确保浏览器完成重绘并等待资源加载
				await new Promise((resolve) => setTimeout(resolve, 500)); // 增加等待时间确保渲染完成

				console.log(`批量导出 - 处理第${i + 1}页...`);
				// 重新查找目标元素，确保获取最新的DOM状态
				const imageElement = await this.findTargetElement(element);
				console.log("批量导出 - 找到的元素：", imageElement);

				try {
					// 临时移除可能导致额外边距的样式
					const originalStyles = {
						padding: imageElement.style.padding,
						paddingBottom: imageElement.style.paddingBottom,
						boxShadow: imageElement.style.boxShadow,
						margin: imageElement.style.margin,
					};

					try {
						// 使用canvas方法以便添加水印
						const canvas = await htmlToImage.toCanvas(
							imageElement,
							this.getExportConfig()
						);

						// 转换为blob
						const blob = await new Promise<Blob>(
							(resolve, reject) => {
								canvas.toBlob(
									(b) => {
										if (b) {
											resolve(b);
										} else {
											reject(
												new Error(
													"Canvas 转换为 Blob 失败"
												)
											);
										}
									},
									"image/png",
									1
								);
							}
						);

						if (blob instanceof Blob) {
							zip.file(`小红书笔记_第${i + 1}页.png`, blob);
						} else {
							throw new Error("生成的不是有效的 Blob 对象");
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
					section.classList.toggle(
						VISIBLE_CLASS,
						originalVisibility[index]!.visible
					);
					section.classList.toggle(
						HIDDEN_CLASS,
						originalVisibility[index]!.hidden
					);
				}
			});

			// 创建下载
			const content = await zip.generateAsync({
				type: "blob",
				compression: "DEFLATE",
				compressionOptions: {
					level: 9,
				},
			});

			if (!(content instanceof Blob)) {
            throw new Error("生成的压缩文件不是有效的 Blob 对象");
        }

        const url = URL.createObjectURL(content);
			const link = Object.assign(document.createElement("a"), {
				href: url,
				download: `小红书笔记_${Date.now()}.zip`,
			});

			link.click();
			URL.revokeObjectURL(url);
			
			// 标记笔记为已导出
			const noteId = this.getCurrentNoteId();
			if (noteId) {
				await this.markNoteAsExported(noteId);
			}
		} catch (error) {
			console.error("导出图片失败:", error);
			throw error;
		} finally {
			// 恢复所有.red-image-preview元素的原始transform值
			this.restoreAllTransforms(originalTransforms);
		}
	}

	// 保存所有.red-image-preview元素的原始transform值
    private saveAllTransforms(): Map<HTMLElement, string> {
        const elements = document.querySelectorAll('.red-image-preview');
        const originalTransforms = new Map<HTMLElement, string>();
        
        elements.forEach(element => {
            const htmlElement = element as HTMLElement;
            originalTransforms.set(htmlElement, htmlElement.style.transform);
        });
        
        return originalTransforms;
    }
    
    // 将所有.red-image-preview元素的transform设置为scale(1)
    private applyAllScaleOne(): void {
        const elements = document.querySelectorAll('.red-image-preview');
        elements.forEach(element => {
            (element as HTMLElement).style.transform = 'scale(1)';
        });
    }
    
    // 恢复所有.red-image-preview元素的原始transform值
    private restoreAllTransforms(originalTransforms: Map<HTMLElement, string>): void {
        originalTransforms.forEach((transform, element) => {
            element.style.transform = transform;
        });
    }
    
    // 增强的元素查找函数
    private async findTargetElement(
        element: HTMLElement
    ): Promise<HTMLElement> {
        const maxAttempts = 10;
        const delay = 200;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			console.log(`尝试查找目标元素 (第${attempt}次)...`);
			// console.log('当前元素结构:', element.innerHTML);
			console.log("元素类名:", element.className);

			// 首先尝试在直接传入的元素中查找
			let target = element.querySelector(".red-image-preview");
			console.log("直接查找结果:", target);

			// 如果没找到，尝试查找子元素
			if (!target) {
				console.log("尝试查找所有子元素:");
				Array.from(element.children).forEach((child, index) => {
					console.log(`子元素 ${index}: ${child.outerHTML}`);
				});

				// 尝试在所有包含red类名的元素中查找
				const redElements = Array.from(
					element.querySelectorAll('[class*="red"]')
				);
				console.log(`找到 ${redElements.length} 个包含red的元素:`);
				redElements.forEach((el) => {
					console.log(`  - ${el.className}: ${el.tagName}`);
				});

				// 尝试查找预览容器
				const previewContainer = element.querySelector(
					".red-preview-container"
				);
				console.log("预览容器:", previewContainer);

				if (previewContainer) {
					target =
						previewContainer.querySelector(".red-image-preview");
					console.log("从预览容器查找结果:", target);
				}
			}

			if (target) {
				console.log("成功找到目标元素:", target);
				return target as HTMLElement;
			}

			// 如果没找到，等待后重试
			console.log(
				`第${attempt}次尝试未找到元素，等待${delay}ms后重试...`
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		// 最后尝试在整个文档中查找
		const docTarget = document.querySelector(".red-image-preview");
		if (docTarget) {
			console.log("在整个文档中找到目标元素:", docTarget);
			return docTarget as HTMLElement;
		}

		throw new Error("找不到.red-image-preview元素");
	}

	async downloadSingleImage(element: HTMLElement): Promise<void> {
		// 保存所有.red-image-preview元素的原始transform值
		const originalTransforms = this.saveAllTransforms();
		
		try {
			// 应用临时scale(1)转换
			this.applyAllScaleOne();
			
			console.log("开始导出单张图片...");

			// 增强的元素查找
			const imageElement = await this.findTargetElement(element);

			// 确保浏览器完成重绘并等待资源加载
			await new Promise((resolve) => setTimeout(resolve, 500)); // 增加等待时间确保渲染完成

			// 原始样式
			const originalStyles = {
				padding: imageElement.style.padding,
				paddingBottom: imageElement.style.paddingBottom,
				boxShadow: imageElement.style.boxShadow,
				margin: imageElement.style.margin,
			};

			try {
				// 转换为 PNG Base64 格式
				const dataUrl = await htmlToImage.toCanvas(
					imageElement,
					this.getExportConfig()
				);

				// 转换为blob并下载
				dataUrl.toBlob((blob) => {
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

			// 根据要求，导出单张图片时不添加笔记属性
			// 移除标记导出状态的代码
		} catch (error) {
			console.error("导出图片失败:", error);
			throw error;
		} finally {
			// 恢复所有.red-image-preview元素的原始transform值
			this.restoreAllTransforms(originalTransforms);
		}
	}
}
