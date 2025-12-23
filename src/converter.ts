import { App } from 'obsidian';
import RedPlugin from './main';
import Prism from 'prismjs';
// 导入常用语言支持
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';

/**
 * 元素分组类型
 */
enum ElementGroupType {
    SingleElement,
    ListGroup,
    CodeBlock,
    ParagraphGroup
}

/**
 * 元素分组接口
 */
interface ElementGroup {
    type: ElementGroupType;
    elements: Element[];
    isOrderedList?: boolean;
    startIndex?: number;
}

export class RedConverter {
    private static app: App;
    private static plugin: RedPlugin;

    static initialize(app: App, plugin: RedPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    static hasValidContent(element: HTMLElement): boolean {
        // 只检查是否有内容，不再依赖标题
        // 直接检查元素本身的内容，因为MarkdownRenderer直接渲染到该元素中
        return !!element.textContent && element.textContent.trim().length > 0;
    }

    static async formatContent(element: HTMLElement, currentFilePath = ''): Promise<void> {
        // 获取所有内容
        // 直接使用element作为内容源，因为MarkdownRenderer直接渲染到该元素中
        
        if (!element.textContent?.trim()?.length) {
            element.empty();
            // 创建预览容器
            const previewContainer = document.createElement('div');
            previewContainer.className = 'red-preview-container';

            // 创建图片预览区域
            const imagePreview = document.createElement('div');
            imagePreview.className = 'red-image-preview';
            // 使用固定的400px宽度和600px高度
            imagePreview.style.width = '400px';
            imagePreview.style.height = '600px';
            imagePreview.style.backgroundColor = 'transparent';
            // 设置默认transform和transform-origin值
            imagePreview.style.transform = 'scale(0.7)';
            imagePreview.style.transformOrigin = 'top center';
        

            
            // 创建空状态提示
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'red-empty-message';
            emptyMessage.textContent = `⚠️ 温馨提示
                        请在文档中添加内容，内容将根据高度自动分割
                        现在编辑文档，实时预览效果`;
            
            // 组装结构
            imagePreview.appendChild(emptyMessage);
            previewContainer.appendChild(imagePreview);
            
            // 添加到元素中
            element.appendChild(previewContainer);
            
            // 触发自定义事件
            element.dispatchEvent(new CustomEvent('content-validation-change', { 
                detail: { isValid: false },
                bubbles: true 
            }));
            return;
        }

        // 触发自定义事件表示内容有效
        element.dispatchEvent(new CustomEvent('content-validation-change', { 
            detail: { isValid: true },
            bubbles: true 
        }));

        // 创建预览容器
        const previewContainer = document.createElement('div');
        previewContainer.className = 'red-preview-container';

        // 创建图片预览区域
        const imagePreview = document.createElement('div');
        imagePreview.className = 'red-image-preview';
        // 使用固定的400px宽度和600px高度
        imagePreview.style.width = '400px';
        imagePreview.style.height = '600px';
        // 设置默认背景色，确保即使没有内容也能看到预览区域
        imagePreview.style.backgroundColor = 'transparent';
        imagePreview.style.position = 'relative';
        // 设置默认transform和transform-origin值
        imagePreview.style.transform = 'scale(0.7)';
        imagePreview.style.transformOrigin = 'top center';
        

        
        // 创建复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'red-copy-button';
        copyButton.innerHTML = '<?xml version="1.0" encoding="UTF-8"?><svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 12.4316V7.8125C13 6.2592 14.2592 5 15.8125 5H40.1875C41.7408 5 43 6.2592 43 7.8125V32.1875C43 33.7408 41.7408 35 40.1875 35H35.5163" stroke="#9b9b9b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32.1875 13H7.8125C6.2592 13 5 14.2592 5 15.8125V40.1875C5 41.7408 6.2592 43 7.8125 43H32.1875C33.7408 43 35 41.7408 35 40.1875V15.8125C35 14.2592 33.7408 13 32.1875 13Z" fill="none" stroke="#9b9b9b" stroke-width="4" stroke-linejoin="round"/></svg>';
        copyButton.title = '复制图片';
        copyButton.setAttribute('aria-label', '复制图片到剪贴板');
        
        // 添加复制按钮到预览容器
        previewContainer.appendChild(copyButton);

        // 创建三个主要区域
        const headerArea = document.createElement('div');
        headerArea.className = 'red-preview-header';
        headerArea.style.minHeight = '20px'; // 确保有最小高度

        const contentArea = document.createElement('div');
        contentArea.className = 'red-preview-content';
        contentArea.style.width = '100%';
        contentArea.style.flex = '1';
        contentArea.style.overflow = 'hidden';
        contentArea.style.display = 'flex'; // 确保内容区域是flex容器
        contentArea.style.flexDirection = 'column';

        const footerArea = document.createElement('div');
        footerArea.className = 'red-preview-footer';
        footerArea.style.minHeight = '20px'; // 确保有最小高度

        // 创建内容容器
        const contentContainer = document.createElement('div');
        contentContainer.className = 'red-content-container';
        
        // 使用固定的400px宽度来计算内容分割
        const containerWidth = 400;
        
        // 处理整个内容，不按标题分割
        const section = await this.createContentSection(element, containerWidth, currentFilePath);
        if (section) {
            contentContainer.appendChild(section);
        } else {
            // 如果没有创建section，保持内容容器为空
        }

        // 组装结构
        contentArea.appendChild(contentContainer);
        imagePreview.appendChild(headerArea);
        imagePreview.appendChild(contentArea);
        imagePreview.appendChild(footerArea);
        previewContainer.appendChild(imagePreview);

        // 处理完成后再清空原容器并添加新内容
        element.empty();
        element.appendChild(previewContainer);

        // 触发自定义事件，通知 view 添加复制按钮事件监听
        const copyEvent = new CustomEvent('copy-button-added', { 
            detail: { copyButton },
            bubbles: true 
        });
        element.dispatchEvent(copyEvent);
    }

    private static async createContentSection(markdownContent: Element, containerWidth = 450, currentFilePath = ''): Promise<HTMLElement | null> {
        const settings = this.plugin?.settingsManager?.getSettings();
        
        // 先克隆markdownContent，避免修改原始DOM
        const clonedContent = markdownContent.cloneNode(true) as Element;
        
        // 在克隆的内容上处理图片，将internal-embed转换为img标签
        await RedConverter.processImages(clonedContent, currentFilePath);
        
        // 获取所有内容元素（处理嵌套情况，确保能获取到h1等标题元素）
        let content: Element[] = [];
        
        // 递归函数：处理元素及其子元素
        const processElement = (element: Element) => {
            // 检查元素是否包含图片或图片嵌入
            const hasImage = element.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image');
            
            // 如果是div容器且有子元素，且不包含图片，递归处理其子元素
            if (element.tagName === 'DIV' && element.children.length > 0 && !hasImage) {
                Array.from(element.children).forEach(child => {
                    processElement(child);
                });
            } else {
                // 如果是div但包含图片，或者不是div容器，直接添加到内容中
                content.push(element);
            }
        };
        
        // 检查克隆内容的直接子元素
        Array.from(clonedContent.children).forEach(child => {
            processElement(child);
        });
        
        // 如果没有子元素，但有文本内容，创建一个div元素来包含文本内容
        const textContent = clonedContent.textContent?.trim();
        if (content.length === 0 && textContent && textContent.length > 0) {
            const textContainer = document.createElement('div');
            textContainer.textContent = textContent;
            content = [textContainer];
        }

        // 根据设置决定是否使用水平分割线分割内容
        let hrPages: Element[][] = [content]; // 默认直接使用整个内容数组
        
        if (settings?.useHorizontalRuleSplit) {
            // 使用水平分割线分割内容
            hrPages = [];
            const currentPage: Element[] = [];
            
            content.forEach((el: Element) => {
                // 检查是否为水平分割线
                if (el.tagName === 'HR') {
                    // 只有当当前页面有实际内容时才添加到hrPages
                    if (currentPage.length > 0) {
                        // 检查当前页面是否有实际内容
                        const hasActualContent = currentPage.some(el => {
                            if (el.tagName === 'OL' || el.tagName === 'UL') {
                                return Array.from(el.querySelectorAll('li')).some(li => 
                                    (li.textContent?.trim() || '').length > 0
                                );
                            }
                            if (el.tagName === 'PRE') {
                                return (el.textContent?.trim() || '').length > 0;
                            }
                            return (el.textContent?.trim() || '').length > 0;
                        });
                        
                        if (hasActualContent) {
                            hrPages.push([...currentPage]);
                            currentPage.length = 0;
                        } else {
                            // 当前页面没有实际内容，重置
                            currentPage.length = 0;
                        }
                    }
                } else {
                    // 添加元素到当前页面
                    currentPage.push(el);
                }
            });
            
            // 添加最后一个页面（如果有内容）
            if (currentPage.length > 0) {
                // 检查最后一个页面是否有实际内容
                const hasActualContent = currentPage.some(el => {
                    if (el.tagName === 'OL' || el.tagName === 'UL') {
                        return Array.from(el.querySelectorAll('li')).some(li => 
                            (li.textContent?.trim() || '').length > 0
                        );
                    }
                    if (el.tagName === 'PRE') {
                        return (el.textContent?.trim() || '').length > 0;
                    }
                    return (el.textContent?.trim() || '').length > 0;
                });
                
                if (hasActualContent) {
                    hrPages.push([...currentPage]);
                }
            }
            
            // 如果没有页面，使用原始内容
            if (hrPages.length === 0) {
                hrPages = [content];
            }
        }
        
        // 创建临时容器来测量内容高度
        const tempContainer = document.createElement('div');
        tempContainer.className = 'red-image-preview';
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = `${containerWidth}px`; // 使用传入的容器宽度
        tempContainer.style.height = `${containerWidth * 1.5}px`; // 固定2:3比例高度
        tempContainer.style.display = 'flex';
        tempContainer.style.flexDirection = 'column';
        tempContainer.style.transform = 'scale(1)';
        tempContainer.style.transformOrigin = 'top center';
        tempContainer.style.padding = '10px';
        tempContainer.style.paddingBottom = '60px';
        tempContainer.style.boxSizing = 'border-box';
        tempContainer.style.overflow = 'hidden';
        document.body.appendChild(tempContainer);
        
        // 创建临时页头区域
        const tempHeaderArea = document.createElement('div');
        tempHeaderArea.className = 'red-preview-header';
        tempHeaderArea.style.minHeight = '20px';
        tempContainer.appendChild(tempHeaderArea);
        
        // 创建临时内容区域
        const tempContentArea = document.createElement('div');
        tempContentArea.className = 'red-preview-content';
        tempContentArea.style.flex = '1';
        tempContentArea.style.overflow = 'hidden';
        tempContentArea.style.position = 'relative';
        const tempContentContainer = document.createElement('div');
        tempContentContainer.className = 'red-content-container';
        const tempSection = document.createElement('section');
        tempSection.className = 'red-content-section red-section-active';
        tempSection.style.overflow = 'hidden';
        // 添加与实际内容区域一致的样式
        tempSection.style.margin = '0 13px';
        tempSection.style.width = 'calc(100% - 26px)';
        tempSection.style.fontSize = '1rem';
        tempSection.style.lineHeight = '1.5';
        
        // 确保段落元素有正确的边距
        tempSection.style.padding = '0';
        // 添加与实际渲染一致的样式，确保高度测量准确
        tempSection.style.boxSizing = 'border-box';
        tempSection.style.wordWrap = 'break-word';
        tempSection.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        tempSection.style.color = '#333333';
        // 为临时容器中的元素设置与实际渲染一致的样式
        const elementStyle = document.createElement('style');
        elementStyle.textContent = `
            .red-content-section.red-section-active p,
            .red-content-section.red-section-active ul,
            .red-content-section.red-section-active ol {
                font-size: 1em;
                line-height: 1.5;
                margin-bottom: 0.5rem;
            }
            .red-content-section.red-section-active ul {
                list-style-type: disc;
                padding-left: 1.5rem;
            }
            .red-content-section.red-section-active ol {
                list-style-type: decimal;
                padding-left: 1.5rem;
            }
        `;
        tempContainer.appendChild(elementStyle);
        // 使用用户设置的字体大小进行测量，确保分页逻辑与实际渲染一致
        tempContainer.style.fontSize = `${settings.fontSize}px`;
        tempSection.style.fontSize = `${settings.fontSize}px`;
        // 行高设置为字体大小的1.5倍，确保与实际渲染一致
        tempSection.style.lineHeight = `${settings.fontSize * 1.5}px`;
        
        tempContentContainer.appendChild(tempSection);
        tempContentArea.appendChild(tempContentContainer);
        tempContainer.appendChild(tempContentArea);
        
        // 创建临时页脚区域
        const tempFooterArea = document.createElement('div');
        tempFooterArea.className = 'red-preview-footer';
        tempFooterArea.style.minHeight = '20px';
        tempContainer.appendChild(tempFooterArea);
        
        // 使用与实际预览区域一致的2:3宽高比
        const tempContainerHeight = containerWidth * 1.5;
        // 减去header、footer和tempSection的边距，确保准确的可用内容高度
        // 根据实际情况，页脚高度默认为50px
        const availableHeight = tempContainerHeight - 20 - 50;
        
        // 创建最终的页面数组
        let finalPages: Element[][] = [];
        
        // 处理每个由水平分割线创建的页面
        hrPages.forEach((hrPageContent) => {
            if (hrPageContent.length === 0) return;
            
            // 将当前水平分割线页面分割成多个基于高度的页面
            const heightBasedPages = this.splitContentByHeight(hrPageContent, availableHeight, tempSection);
            finalPages.push(...heightBasedPages);
        });
        
        // 清理临时容器
        document.body.removeChild(tempContainer);
        
        // 移除空页面和只有空白内容的页面
        finalPages = finalPages.filter(page => {
            if (page.length === 0) return false;
            
            // 检查页面是否有实际内容
            return page.some(el => {
                if (el.tagName === 'OL' || el.tagName === 'UL') {
                    // 检查列表是否有非空列表项
                    return Array.from(el.querySelectorAll('li')).some(li => 
                        (li.textContent?.trim() || '').length > 0
                    );
                }
                if (el.tagName === 'PRE') {
                    // 检查代码块是否有实际内容
                    return (el.textContent?.trim() || '').length > 0;
                }
                // 检查其他元素是否有实际内容
                return (el.textContent?.trim() || '').length > 0;
            });
        });
        
        // 创建一个容器元素来包含所有页面
        const container = document.createElement('div');
        container.className = 'red-section-container';
        
        // 为每个页面创建一个部分
        finalPages.forEach((pageContent, pageIndex) => {
            if (pageContent.length === 0) return; // 跳过空页面
            
            const section = document.createElement('section');
            section.className = 'red-content-section';
            section.setAttribute('data-index', finalPages.length === 1 ? '0' : `0-${pageIndex}`);
            
            // 添加页面内容（所有内容包括标题都会被保留）
            pageContent.forEach(el => section.appendChild(el));
            
            // 处理样式和格式
            this.processElements(section);
            
            // 应用用户配置的字体设置到最终渲染的内容
            if (settings) {
                // 为整个section容器设置基础字体大小，这样CSS中的rem单位会基于此计算
                section.style.fontSize = `${settings.fontSize}px`;
                
                // 为整个section容器设置字体族
                section.style.fontFamily = settings.fontFamily;
                
                // 为代码块单独设置字体族，确保代码使用等宽字体
                const codeBlocks = section.querySelectorAll('pre, code');
                codeBlocks.forEach(el => {
                    (el as HTMLElement).style.fontFamily = settings.fontFamily;
                });
            }
            
            container.appendChild(section);
        });
        
        return container;
    }


    
    /**
     * 根据内容高度分割内容为多个页面
     * @param content 要分割的内容元素数组
     * @param maxHeight 每个页面的最大内容高度
     * @param tempSection 用于测量高度的临时section
     */
    private static splitContentByHeight(content: Element[], maxHeight: number, tempSection: HTMLElement): Element[][] {
        const pages: Element[][] = [];
        const currentPage: Element[] = [];
        
        // 1. 首先将内容分组
        const groups = this.groupElements(content);
        
        // 重置临时section
        while (tempSection.firstChild) {
            tempSection.removeChild(tempSection.firstChild);
        }
        
        // 2. 遍历所有分组
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            if (!group) continue;
            
            // 3. 根据分组类型处理
            switch (group.type) {
                case ElementGroupType.SingleElement:
                    this.processSingleElementGroup(group, currentPage, pages, maxHeight, tempSection);
                    break;
                case ElementGroupType.CodeBlock:
                    this.processCodeBlockGroup(group, currentPage, pages, maxHeight, tempSection);
                    break;
                case ElementGroupType.ListGroup:
                    this.processListGroup(group, currentPage, pages, maxHeight, tempSection);
                    break;
                case ElementGroupType.ParagraphGroup:
                    this.processParagraphGroup(group, currentPage, pages, maxHeight, tempSection);
                    break;
                default:
                    this.processSingleElementGroup(group, currentPage, pages, maxHeight, tempSection);
            }
        }
        
        // 添加最后一页（确保只添加非空页面）
        if (currentPage.length > 0) {
            // 检查页面内容是否有实际文本或图片
            const hasActualContent = currentPage.some(el => {
                // 检查是否包含图片
                if (el.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image')) {
                    return true;
                }
                // 对于列表和代码块，检查是否有内容
                if (el.tagName === 'OL' || el.tagName === 'UL') {
                    return Array.from(el.querySelectorAll('li')).some(li => (li.textContent?.trim() || '').length > 0);
                }
                if (el.tagName === 'PRE') {
                    return (el.textContent?.trim() || '').length > 0;
                }
                // 其他元素直接检查文本内容
                return (el.textContent?.trim() || '').length > 0;
            });
            
            if (hasActualContent) {
                pages.push(currentPage);
            }
        }
        
        // 清空临时section
        while (tempSection.firstChild) {
            tempSection.removeChild(tempSection.firstChild);
        }
        
        // 过滤掉所有空页面或只有空白内容的页面
        return pages.filter(page => {
            if (page.length === 0) return false;
            
            // 检查页面是否有实际内容（文本或图片）
            return page.some(el => {
                // 检查是否包含图片
                if (el.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image')) {
                    return true;
                }
                
                if (el.tagName === 'OL' || el.tagName === 'UL') {
                    return Array.from(el.querySelectorAll('li')).some(li => {
                        // 检查列表项是否有文本或包含图片
                        if (li.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image')) {
                            return true;
                        }
                        return (li.textContent?.trim() || '').length > 0;
                    });
                }
                
                if (el.tagName === 'PRE') {
                    return (el.textContent?.trim() || '').length > 0;
                }
                
                return (el.textContent?.trim() || '').length > 0;
            });
        });
    }

    /**
     * 将内容元素分组
     * @param content 要分组的内容元素数组
     */
    private static groupElements(content: Element[]): ElementGroup[] {
        const groups: ElementGroup[] = [];
        
        for (let i = 0; i < content.length; i++) {
            const el = content[i];
            if (!el) continue;
            
            // 检查元素是否有内容或包含图片
            const hasTextContent = (el.textContent?.trim() || '').length > 0;
            const hasImage = el.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image');
            
            // 如果元素既没有文本内容也没有图片，跳过
            if (!hasTextContent && !hasImage) continue;
            
            // 1. 检查是否是代码块
            if (el.tagName === 'PRE') {
                groups.push({
                    type: ElementGroupType.CodeBlock,
                    elements: [el]
                });
                continue;
            }
            
            // 2. 检查是否是完整列表（OL或UL）
            if (el.tagName === 'OL' || el.tagName === 'UL') {
                const listGroup: ElementGroup = {
                    type: ElementGroupType.ListGroup,
                    elements: [el],
                    isOrderedList: el.tagName === 'OL',
                    startIndex: el.tagName === 'OL' ? parseInt(el.getAttribute('start') || '1') : undefined
                };
                groups.push(listGroup);
                continue;
            }
            
            // 3. 默认处理为单个元素
            groups.push({
                type: ElementGroupType.SingleElement,
                elements: [el]
            });
        }
        
        return groups;
    }
    

    
    /**
     * 处理单个元素分组
     * @param group 元素分组
     * @param currentPage 当前页面内容
     * @param pages 所有页面
     * @param maxHeight 最大高度
     * @param tempSection 临时section
     */
    private static processSingleElementGroup(group: ElementGroup, currentPage: Element[], pages: Element[][], maxHeight: number, tempSection: HTMLElement): void {
        this.processGenericGroup(group, currentPage, pages, maxHeight, tempSection);
    }
    
    /**
     * 处理代码块分组
     * @param group 元素分组
     * @param currentPage 当前页面内容
     * @param pages 所有页面
     * @param maxHeight 最大高度
     * @param tempSection 临时section
     */
    private static processCodeBlockGroup(group: ElementGroup, currentPage: Element[], pages: Element[][], maxHeight: number, tempSection: HTMLElement): void {
        const codeBlock = group.elements[0];
        
        // 如果不是PRE元素，使用通用处理
        if (codeBlock!.tagName !== 'PRE') {
            this.processGenericGroup(group, currentPage, pages, maxHeight, tempSection);
            return;
        }
        
        // 获取代码内容和语法高亮类
        const codeContent = codeBlock!.textContent || '';
        
        // 检查代码块是否有实际内容
        if (!codeContent.trim()) {
            return; // 跳过空代码块
        }
        
        const codeElement = codeBlock!.querySelector('code');
        const langClass = codeElement?.className || '';
        
        // 按行分割代码并过滤空行
        const codeLines = codeContent.split('\n').filter(line => line.trim().length > 0);
        
        // 如果代码只有一行或空行，直接处理
        if (codeLines.length <= 1) {
            const clonedBlock = codeBlock!.cloneNode(true) as Element;
            if (clonedBlock.tagName === 'PRE') {
                clonedBlock.classList.add('red-pre');
            }
            
            tempSection.innerHTML = '';
            currentPage.forEach(el => tempSection.appendChild(el.cloneNode(true) as Element));
            tempSection.appendChild(clonedBlock);
            
            tempSection.style.height = 'auto';
            tempSection.style.overflow = 'visible';
            
            if (tempSection.scrollHeight <= maxHeight) {
                currentPage.push(codeBlock!);
            } else {
                if (currentPage.length > 0) {
                    // 检查当前页面是否有内容
                    const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                    if (pageHasContent) {
                        pages.push([...currentPage]);
                    }
                    currentPage.length = 0;
                    tempSection.innerHTML = '';
                }
                currentPage.push(codeBlock!);
            }
            return;
        }
        
        let currentCodePage: string[] = [];
        
        // 遍历所有代码行，逐行分页
        for (let i = 0; i < codeLines.length; i++) {
            const line = codeLines[i];
            const testLines = [...currentCodePage, line];
            
            // 创建临时代码块
            const tempPre = document.createElement('pre');
            tempPre.className = `red-pre ${codeBlock!.className}`;
            const tempCode = document.createElement('code');
            tempCode.className = langClass;
            tempCode.textContent = testLines.join('\n');
            tempPre.appendChild(tempCode);
            
            // 测量高度
            tempSection.innerHTML = '';
            currentPage.forEach(el => tempSection.appendChild(el.cloneNode(true) as Element));
            tempSection.appendChild(tempPre);
            
            tempSection.style.height = 'auto';
            tempSection.style.overflow = 'visible';
            
            if (tempSection.scrollHeight <= maxHeight) {
                // 可以添加到当前代码页
                currentCodePage.push(line!);
            } else {
                // 需要分页
                if (currentCodePage.length > 0) {
                    // 创建当前页面的代码块
                    const pagePre = document.createElement('pre');
                    pagePre.className = `red-pre ${codeBlock!.className}`;
                    const pageCode = document.createElement('code');
                    pageCode.className = langClass;
                    pageCode.textContent = currentCodePage.join('\n');
                    pagePre.appendChild(pageCode);
                    
                    // 检查当前页面是否有空间
                    tempSection.innerHTML = '';
                    currentPage.forEach(el => tempSection.appendChild(el.cloneNode(true) as Element));
                    tempSection.appendChild(pagePre);
                    
                    tempSection.style.height = 'auto';
                    tempSection.style.overflow = 'visible';
                    
                    if (tempSection.scrollHeight <= maxHeight) {
                        currentPage.push(pagePre);
                    } else {
                        // 当前页面已满，保存并创建新页面
                        if (currentPage.length > 0) {
                            const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                            if (pageHasContent) {
                                pages.push([...currentPage]);
                            }
                            currentPage.length = 0;
                        }
                        currentPage.push(pagePre);
                    }
                    
                    // 重置当前代码页，从当前行开始新页面
                    currentCodePage = [line!];
                } else {
                    // 单行代码就超过了最大高度，单独占一页
                    const singleLinePre = document.createElement('pre');
                    singleLinePre.className = `red-pre ${codeBlock!.className}`;
                    const singleLineCode = document.createElement('code');
                    singleLineCode.className = langClass;
                    singleLineCode.textContent = line!;
                    singleLinePre.appendChild(singleLineCode);
                    
                    // 检查当前页面是否有空间
                    tempSection.innerHTML = '';
                    currentPage.forEach(el => tempSection.appendChild(el.cloneNode(true) as Element));
                    tempSection.appendChild(singleLinePre);
                    
                    tempSection.style.height = 'auto';
                    tempSection.style.overflow = 'visible';
                    
                    if (tempSection.scrollHeight <= maxHeight) {
                        // 当前页面还有空间，直接添加
                        currentPage.push(singleLinePre);
                    } else {
                        // 当前页面已满，保存并创建新页面
                        if (currentPage.length > 0) {
                            const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                            if (pageHasContent) {
                                pages.push([...currentPage]);
                            }
                            currentPage.length = 0;
                        }
                        currentPage.push(singleLinePre);
                    }
                }
            }
        }
        
        // 处理剩余的代码行，确保只包含实际内容
        const nonEmptyCodePage = currentCodePage.filter(line => line.trim().length > 0);
        if (nonEmptyCodePage.length > 0) {
            // 创建剩余代码的代码块
            const pagePre = document.createElement('pre');
            pagePre.className = `red-pre ${codeBlock!.className}`;
            const pageCode = document.createElement('code');
            pageCode.className = langClass;
            pageCode.textContent = nonEmptyCodePage.join('\n');
            pagePre.appendChild(pageCode);
            
            // 检查当前页面是否有空间
            tempSection.innerHTML = '';
            currentPage.forEach(el => tempSection.appendChild(el.cloneNode(true) as Element));
            tempSection.appendChild(pagePre);
            
            tempSection.style.height = 'auto';
            tempSection.style.overflow = 'visible';
            
            if (tempSection.scrollHeight <= maxHeight) {
                currentPage.push(pagePre);
            } else {
                // 当前页面已满，保存并创建新页面
                if (currentPage.length > 0) {
                    const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                    if (pageHasContent) {
                        pages.push([...currentPage]);
                    }
                    currentPage.length = 0;
                }
                currentPage.push(pagePre);
            }
        }
    }
    
    /**
     * 处理列表分组
     * @param group 元素分组
     * @param currentPage 当前页面内容
     * @param pages 所有页面
     * @param maxHeight 最大高度
     * @param tempSection 临时section
     */
    private static processListGroup(group: ElementGroup, currentPage: Element[], pages: Element[][], maxHeight: number, tempSection: HTMLElement): void {
        // 获取完整列表元素
        const listElement = group.elements[0];
        if (!listElement) return;
        
        const isOrderedList = group.isOrderedList || listElement.tagName === 'OL';
        const startIndex = group.startIndex || parseInt(listElement.getAttribute('start') || '1');
        
        // 获取所有列表项
        const listItems = Array.from(listElement.querySelectorAll('li'));
        
        // 过滤掉空列表项（但保留包含图片的列表项）
        const nonEmptyListItems = listItems.filter(item => {
            const hasTextContent = (item.textContent?.trim() || '').length > 0;
            const hasImage = item.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image');
            return hasTextContent || hasImage;
        });
        
        // 如果没有非空列表项且列表元素没有内容，跳过
        if (nonEmptyListItems.length === 0) {
            const hasContent = (listElement.textContent?.trim() || '').length > 0;
            const hasImage = listElement.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image');
            if (hasContent || hasImage) {
                currentPage.push(listElement);
            }
            return;
        }
        
        let currentListItemPage: Element[] = [];
        let currentStartIndex = startIndex;
        
        // 遍历所有非空列表项，检查是否需要分页
        for (let i = 0; i < nonEmptyListItems.length; i++) {
            const listItem = nonEmptyListItems[i];
            
            // 克隆列表项以保留原始样式
            const clonedItem = listItem!.cloneNode(true) as HTMLElement;
            
            // 创建临时列表容器，用于测量高度
            const tempList = document.createElement(isOrderedList ? 'ol' : 'ul');
            if (isOrderedList) {
                tempList.setAttribute('start', currentStartIndex.toString());
            }
            // 应用与实际渲染一致的列表样式，确保高度测量准确
            tempList.style.fontSize = tempSection.style.fontSize;
            tempList.style.lineHeight = tempSection.style.lineHeight;
            tempList.style.marginBottom = '0.5rem';
            tempList.style.paddingLeft = '1.5rem';
            tempList.style.listStyleType = isOrderedList ? 'decimal' : 'disc';
            tempList.style.boxSizing = 'border-box';
            
            // 添加当前列表页的所有列表项（如果有）
            currentListItemPage.forEach(item => tempList.appendChild(item.cloneNode(true) as Element));
            // 添加当前要检查的列表项
            tempList.appendChild(clonedItem);
            
            // 测量高度
            tempSection.innerHTML = '';
            currentPage.forEach(el => tempSection.appendChild(el.cloneNode(true) as Element));
            tempSection.appendChild(tempList);
            
            tempSection.style.height = 'auto';
            tempSection.style.overflow = 'visible';
            
            // 检查是否超出最大高度
            if (tempSection.scrollHeight <= maxHeight) {
                // 列表项可以放入当前页面，添加到当前列表页
                currentListItemPage.push(listItem!);
            } else {
                // 当前列表项导致页面溢出
                if (currentListItemPage.length > 0) {
                    // 保存当前页面的列表项到新页面
                    const pageListContainer = document.createElement(isOrderedList ? 'ol' : 'ul');
                    if (isOrderedList) {
                        pageListContainer.setAttribute('start', currentStartIndex.toString());
                    }
                    currentListItemPage.forEach(item => pageListContainer.appendChild(item.cloneNode(true) as Element));
                    
                    // 将当前列表页添加到当前页面
                    currentPage.push(pageListContainer);
                    
                    // 保存当前页面并创建新页面
                    const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                    if (pageHasContent) {
                        pages.push([...currentPage]);
                    }
                    currentPage.length = 0;
                    
                    // 更新起始索引并重置当前列表页
                    currentStartIndex += currentListItemPage.length;
                    currentListItemPage = [];
                    i--; // 重试当前列表项
                } else {
                    // 单个列表项非常长，需要拆分成多行
                    // 检查当前页面是否为空
                    if (currentPage.length > 0) {
                        // 当前页面已有内容，创建新页面
                        const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                        if (pageHasContent) {
                            pages.push([...currentPage]);
                        }
                        currentPage.length = 0;
                    }
                    
                    // 处理长列表项
                    this.handleLongListItem(listItem!, isOrderedList, currentStartIndex, currentPage, pages, maxHeight, tempSection);
                    currentStartIndex++;
                }
            }
        }
        
        // 处理剩余的列表项
        if (currentListItemPage.length > 0) {
            const pageListContainer = document.createElement(isOrderedList ? 'ol' : 'ul');
            if (isOrderedList) {
                pageListContainer.setAttribute('start', currentStartIndex.toString());
            }
            currentListItemPage.forEach(item => pageListContainer.appendChild(item.cloneNode(true) as Element));
            
            // 检查是否能放入当前页面
            tempSection.innerHTML = '';
            currentPage.forEach(el => tempSection.appendChild(el.cloneNode(true) as Element));
            tempSection.appendChild(pageListContainer);
            
            // 确保列表项不会被截断在页面底部
            if (tempSection.scrollHeight <= maxHeight) {
                currentPage.push(pageListContainer);
            } else {
                // 当前页面已满，创建新页面
                if (currentPage.length > 0) {
                    const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                    if (pageHasContent) {
                        pages.push([...currentPage]);
                    }
                    currentPage.length = 0;
                }
                currentPage.push(pageListContainer);
            }
        }
    }
    
    /**
     * 处理超长列表项，将其拆分成多行
     * @param listItem 超长列表项
     * @param isOrderedList 是否为有序列表
     * @param startIndex 起始索引
     * @param currentPage 当前页面内容
     * @param pages 所有页面
     * @param maxHeight 最大高度
     * @param tempSection 临时section
     */
    private static handleLongListItem(listItem: Element, isOrderedList: boolean, startIndex: number, currentPage: Element[], pages: Element[][], maxHeight: number, tempSection: HTMLElement): void {
        const listContent = listItem.textContent || '';
        const hasImage = listItem.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image');
        
        // 如果列表项内容为空且没有图片，直接返回
        if (!listContent.trim() && !hasImage) return;
        
        // 创建临时列表项，用于测量高度
        const tempListItem = listItem.cloneNode(true) as HTMLElement;
        const tempList = document.createElement(isOrderedList ? 'ol' : 'ul');
        if (isOrderedList) {
            tempList.setAttribute('start', startIndex.toString());
        }
        // 应用与实际渲染一致的列表样式，确保高度测量准确
        tempList.style.fontSize = tempSection.style.fontSize;
        tempList.style.lineHeight = tempSection.style.lineHeight;
        tempList.style.marginBottom = '0.5rem';
        tempList.style.paddingLeft = '1.5rem';
        tempList.style.listStyleType = isOrderedList ? 'decimal' : 'disc';
        tempList.style.boxSizing = 'border-box';
        
        // 先检查完整列表项是否能放入当前页面
        tempSection.innerHTML = '';
        currentPage.forEach(el => tempSection.appendChild(el.cloneNode(true) as Element));
        tempList.appendChild(tempListItem);
        tempSection.appendChild(tempList);
        
        tempSection.style.height = 'auto';
        tempSection.style.overflow = 'visible';
        
        if (tempSection.scrollHeight <= maxHeight) {
            // 超长列表项能放入当前页面，直接添加
            currentPage.push(tempList.cloneNode(true) as Element);
            return;
        }
        
        // 当前列表项无法放入当前页面，需要拆分
        
        // 1. 尝试按段落拆分（使用换行符分隔）
        const paragraphs = listContent.split(/\n\s*\n/);
        
        const currentParagraphPage: string[] = [];
        const remainingParagraphs: string[] = [...paragraphs];
        
        // 尝试找到最大可放入当前页面的段落数
        while (remainingParagraphs.length > 0) {
            // 添加一个段落
            currentParagraphPage.push(remainingParagraphs.shift()!);
            
            // 创建临时内容
            const tempContent = currentParagraphPage.join('\n\n');
            
            // 更新临时列表项的内容
            tempListItem.textContent = tempContent;
            
            // 测量高度
            tempSection.innerHTML = '';
            const testList = document.createElement(isOrderedList ? 'ol' : 'ul');
            if (isOrderedList) {
                testList.setAttribute('start', startIndex.toString());
            }
            // 应用与实际渲染一致的列表样式，确保高度测量准确
            testList.style.fontSize = tempSection.style.fontSize;
            testList.style.lineHeight = tempSection.style.lineHeight;
            testList.style.marginBottom = '0.5rem';
            testList.style.paddingLeft = '1.5rem';
            testList.style.listStyleType = isOrderedList ? 'decimal' : 'disc';
            testList.style.boxSizing = 'border-box';
            testList.appendChild(tempListItem.cloneNode(true) as Element);
            tempSection.appendChild(testList);
            
            if (tempSection.scrollHeight > maxHeight) {
                // 超出高度，移除最后添加的段落
                remainingParagraphs.unshift(currentParagraphPage.pop()!);
                break;
            }
        }
        
        // 2. 如果找到可放入当前页面的段落内容
        if (currentParagraphPage.length > 0) {
            // 创建当前页面的列表项
            const currentPageListItem = listItem.cloneNode(true) as HTMLElement;
            currentPageListItem.textContent = currentParagraphPage.join('\n\n');
            
            const currentPageList = document.createElement(isOrderedList ? 'ol' : 'ul');
            if (isOrderedList) {
                currentPageList.setAttribute('start', startIndex.toString());
            }
            currentPageList.appendChild(currentPageListItem);
            
            // 将当前段落内容添加到当前页面
            currentPage.push(currentPageList);
            
            // 处理剩余内容
            if (remainingParagraphs.length > 0) {
                const remainingListItem = listItem.cloneNode(true) as HTMLElement;
                remainingListItem.textContent = remainingParagraphs.join('\n\n');
                
                // 创建新页面
                const newPage: Element[] = [];
                pages.push(newPage);
                
                // 递归处理剩余内容
                this.handleLongListItem(remainingListItem, isOrderedList, startIndex + 1, newPage, pages, maxHeight, tempSection);
            }
        } else {
            // 3. 单个段落仍然太长，尝试按单词拆分
            const singleParagraph = listContent;
            const words = singleParagraph.split(' ');
            
            const currentWordPage: string[] = [];
            const remainingWords: string[] = [...words];
            
            // 尝试找到最大可放入当前页面的单词数
            while (remainingWords.length > 0) {
                // 添加一个单词
                currentWordPage.push(remainingWords.shift()!);
                
                // 创建临时内容
                const tempContent = currentWordPage.join(' ');
                
                // 更新临时列表项的内容
                tempListItem.textContent = tempContent;
                
                // 测量高度
                tempSection.innerHTML = '';
                const testList = document.createElement(isOrderedList ? 'ol' : 'ul');
                if (isOrderedList) {
                    testList.setAttribute('start', startIndex.toString());
                }
                // 应用与实际渲染一致的列表样式，确保高度测量准确
                testList.style.fontSize = tempSection.style.fontSize;
                testList.style.lineHeight = tempSection.style.lineHeight;
                testList.style.marginBottom = '0.5rem';
                testList.style.paddingLeft = '1.5rem';
                testList.style.listStyleType = isOrderedList ? 'decimal' : 'disc';
                testList.style.boxSizing = 'border-box';
                testList.appendChild(tempListItem.cloneNode(true) as Element);
                tempSection.appendChild(testList);
                
                if (tempSection.scrollHeight > maxHeight) {
                    // 超出高度，移除最后添加的单词
                    remainingWords.unshift(currentWordPage.pop()!);
                    break;
                }
            }
            
            // 4. 如果找到可放入当前页面的单词内容
            if (currentWordPage.length > 0) {
                // 创建当前页面的列表项
                const currentPageListItem = listItem.cloneNode(true) as HTMLElement;
                currentPageListItem.textContent = currentWordPage.join(' ');
                
                const currentPageList = document.createElement(isOrderedList ? 'ol' : 'ul');
                if (isOrderedList) {
                    currentPageList.setAttribute('start', startIndex.toString());
                }
                currentPageList.appendChild(currentPageListItem);
                
                // 将当前单词内容添加到当前页面
                currentPage.push(currentPageList);
                
                // 处理剩余内容
                if (remainingWords.length > 0) {
                    const remainingListItem = listItem.cloneNode(true) as HTMLElement;
                    remainingListItem.textContent = remainingWords.join(' ');
                    
                    // 创建新页面
                    const newPage: Element[] = [];
                    pages.push(newPage);
                    
                    // 递归处理剩余内容
                    this.handleLongListItem(remainingListItem, isOrderedList, startIndex + 1, newPage, pages, maxHeight, tempSection);
                }
            } else {
                // 5. 单个单词就超过了最大高度，直接添加到当前页面
                const tempListContainer = document.createElement(isOrderedList ? 'ol' : 'ul');
                if (isOrderedList) {
                    tempListContainer.setAttribute('start', startIndex.toString());
                }
                tempListContainer.appendChild(listItem.cloneNode(true) as Element);
                
                currentPage.push(tempListContainer);
            }
        }
    }
    
    /**
     * 处理段落分组
     * @param group 元素分组
     * @param currentPage 当前页面内容
     * @param pages 所有页面
     * @param maxHeight 最大高度
     * @param tempSection 临时section
     */
    private static processParagraphGroup(group: ElementGroup, currentPage: Element[], pages: Element[][], maxHeight: number, tempSection: HTMLElement): void {
        this.processGenericGroup(group, currentPage, pages, maxHeight, tempSection);
    }
    
    /**
     * 处理通用分组
     * @param group 元素分组
     * @param currentPage 当前页面内容
     * @param pages 所有页面
     * @param maxHeight 最大高度
     * @param tempSection 临时section
     */
    private static processGenericGroup(group: ElementGroup, currentPage: Element[], pages: Element[][], maxHeight: number, tempSection: HTMLElement): void {
        // 检查分组是否有实际内容
        const hasActualContent = group.elements.some(el => {
            if (el.tagName === 'PRE') {
                return (el.textContent?.trim() || '').length > 0;
            }
            // 检查是否有文本内容或包含图片
            return (el.textContent?.trim() || '').length > 0 || 
                   el.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image') !== null;
        });
        
        if (!hasActualContent) return;
        
        // 逐个处理分组内的元素，支持单个元素的分页
        for (const element of group.elements) {
            // 检查元素是否为空（同时检查是否包含图片）
            if ((element.textContent?.trim() || '').length === 0 && 
                element.querySelector('img, span.internal-embed, div.internal-embed, .markdown-image') === null) {
                continue;
            }
            
            // 克隆当前元素
            const clonedElement = element.cloneNode(true) as Element;
            
            // 确保克隆元素应用了与原始元素相同的样式
            if (element.className) {
                clonedElement.className = element.className;
            }
            
            // 处理不同类型的元素，确保应用了正确的样式
            switch (element.tagName) {
                case 'H1':
                case 'H2':
                case 'H3':
                case 'H4':
                case 'H5':
                case 'H6':
                    // 确保标题元素应用了正确的样式
                    // 移除可能影响测量的内联样式
                    clonedElement.removeAttribute('style');
                    break;
                case 'PRE':
                    clonedElement.classList.add('red-pre');
                    clonedElement.removeAttribute('style');
                    break;
                case 'P':
                    // 移除段落的内联样式，确保使用统一的样式
                    clonedElement.removeAttribute('style');
                    break;
            }
            
            // 首先检查当前元素本身是否能放入新页面
            tempSection.innerHTML = '';
            tempSection.appendChild(clonedElement);
            
            // 测量元素本身的高度
            tempSection.style.height = 'auto';
            tempSection.style.overflow = 'visible';
            tempSection.style.position = 'static';
            tempSection.style.display = 'block';
            tempSection.style.minHeight = '0';
            tempSection.style.maxHeight = 'none';
            tempSection.style.whiteSpace = 'normal';
            tempSection.style.textAlign = 'left';
            
            // 强制重排以确保准确的高度计算
            tempSection.offsetHeight;
            
            const elementHeight = tempSection.scrollHeight;
            
            // 如果元素本身的高度就超过了最大高度，直接放入新页面
            if (elementHeight > maxHeight) {
                // 如果当前页面已经有内容，保存当前页面
                if (currentPage.length > 0) {
                    const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                    if (pageHasContent) {
                        pages.push([...currentPage]);
                    }
                    currentPage.length = 0;
                }
                
                // 直接将当前元素添加到新页面
                currentPage.push(element);
                continue;
            }
            
            // 尝试将元素添加到当前页面
            tempSection.innerHTML = '';
            
            // 克隆当前页面的所有元素，并确保它们也应用了正确的样式
            currentPage.forEach(el => {
                const pageElClone = el.cloneNode(true) as Element;
                // 同样处理当前页面元素的样式
                if (pageElClone.tagName.match(/^H[1-6]$/) || pageElClone.tagName === 'PRE' || pageElClone.tagName === 'P') {
                    pageElClone.removeAttribute('style');
                }
                if (pageElClone.tagName === 'PRE') {
                    pageElClone.classList.add('red-pre');
                }
                tempSection.appendChild(pageElClone);
            });
            
            // 添加当前元素
            tempSection.appendChild(clonedElement);
            
            // 强制重排以确保准确的高度计算
            tempSection.offsetHeight;
            
            const totalHeight = tempSection.scrollHeight;
            
            if (totalHeight <= maxHeight) {
                // 高度未超过限制，将元素添加到当前页面
                currentPage.push(element);
            } else {
                // 当前元素导致溢出，将其移到新页面
                
                // 如果当前页面已经有内容，保存当前页面
                if (currentPage.length > 0) {
                    const pageHasContent = currentPage.some(el => (el.textContent?.trim() || '').length > 0);
                    if (pageHasContent) {
                        pages.push([...currentPage]);
                    }
                    currentPage.length = 0;
                }
                
                // 直接将当前元素添加到新页面
                currentPage.push(element);
            }
        }
    }
    
    private static processElements(container: HTMLElement | null): void {
        if (!container) return;

        // 处理标题元素，移除内联样式以确保CSS样式生效
        container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
            // 移除所有内联样式
            el.removeAttribute('style');
        });

        // 处理强调文本
        container.querySelectorAll('strong, em').forEach(el => {
            el.classList.add('red-emphasis');
        });

        // 处理链接
        container.querySelectorAll('a').forEach(el => {
            el.classList.add('red-link');
        });

        // 处理表格
        container.querySelectorAll('table').forEach(el => {
            if (el === container.closest('table')) return;
            el.classList.add('red-table');
        });

        // 处理分割线
        container.querySelectorAll('hr').forEach(el => {
            el.classList.add('red-hr');
        });

        // 处理删除线
        container.querySelectorAll('del').forEach(el => {
            el.classList.add('red-del');
        });

        // 处理任务列表
        container.querySelectorAll('.task-list-item').forEach(el => {
            el.classList.add('red-task-list-item');
        });

        // 处理脚注
        container.querySelectorAll('.footnote-ref, .footnote-backref').forEach(el => {
            el.classList.add('red-footnote');
        });

        // 处理代码块
        container.querySelectorAll('pre').forEach(pre => {
            // 先移除所有内联样式
            pre.removeAttribute('style');
            // 然后添加自定义类
            pre.classList.add('red-pre');
            
            // 移除原有的复制按钮
            const copyButton = pre.querySelector('.copy-code-button');
            if (copyButton) {
                copyButton.remove();
            }
            
            // 为代码块添加语法高亮
            const codeElement = pre.querySelector('code');
            if (codeElement) {
                Prism.highlightElement(codeElement);
            }
        });

        // 处理图片（已在createContentSection中预处理）
        container.querySelectorAll('img.red-image').forEach(img => {
            img.classList.add('red-img');
        });
        
        // 处理Markdown中直接的img标签
        container.querySelectorAll('img').forEach(img => {
            if (!img.classList.contains('red-image')) {
                img.classList.add('red-img');
            }
        });
    }

    /**
     * 预处理图片，将span.internal-embed转换为img标签
     * 此方法必须在内容分割之前调用，以便分割逻辑能正确计算图片高度
     */
    private static processImages(content: Element, currentFilePath: string): Promise<void> {
        console.log('=== 开始图片处理 ===');
        console.log('处理内容类型:', content.tagName);
        console.log('处理内容结构:', content.outerHTML);
        
        // 检查this.app和this.plugin是否存在
        if (!this.app) {
            console.error('this.app不存在，无法处理图片');
            return Promise.resolve();
        }
        
        if (!this.app.metadataCache) {
            console.error('this.app.metadataCache不存在，无法处理图片');
            return Promise.resolve();
        }
        
        if (!this.app.vault || !this.app.vault.adapter) {
            console.error('this.app.vault或this.app.vault.adapter不存在，无法处理图片');
            return Promise.resolve();
        }
        
        // 使用更广泛的选择器，包括可能的div.internal-embed和其他嵌入元素
        const embedElements = content.querySelectorAll('span.internal-embed, div.internal-embed, .markdown-image, [data-type="file-embed"], [data-embed-type="image"]');
        
        // 特别检查带有src或data-href属性的内部嵌入元素
        const internalEmbedElements = content.querySelectorAll('span[data-href^="[["], div[data-href^="[["]');
        console.log(`发现 ${internalEmbedElements.length} 个带有data-href="[[...]]"的元素`);
        
        // 检查是否有带有data-link属性的元素，这是Obsidian内部链接的常见属性
        const dataLinkElements = content.querySelectorAll('[data-link]');
        console.log(`发现 ${dataLinkElements.length} 个带有data-link属性的元素`);
        
        console.log(`发现 ${embedElements.length} 个嵌入元素`);
        
        // 也尝试查找所有的img元素
        const imgElements = content.querySelectorAll('img');
        console.log(`发现 ${imgElements.length} 个img元素`);
        
        // 检查是否有任何带有markdown-image类的元素
        const markdownImages = content.querySelectorAll('.markdown-image');
        console.log(`发现 ${markdownImages.length} 个markdown-image元素`);
        
        // 处理所有可能的嵌入元素
        const allEmbedElements = [...Array.from(embedElements), ...Array.from(internalEmbedElements)];
        console.log(`总共处理 ${allEmbedElements.length} 个嵌入元素`);
        
        // 创建图片加载Promise数组
        const imageLoadPromises: Promise<void>[] = [];
        
        // 转换为数组以便使用forEach
        allEmbedElements.forEach((el, index) => {
            const originalEmbed = el as HTMLElement;
            
            console.log(`\n=== 处理第 ${index + 1} 个嵌入元素 ===`);
            console.log('Embed element found:', originalEmbed.outerHTML);
            console.log('Embed element tagName:', originalEmbed.tagName);
            console.log('Embed element classList:', originalEmbed.classList);
            
            // 尝试从不同位置获取src信息
            let src = originalEmbed.getAttribute('src') || 
                      originalEmbed.getAttribute('data-href') ||
                      originalEmbed.getAttribute('data-link') || // 检查Obsidian内部链接的data-link属性
                      originalEmbed.getAttribute('data-src') || // 直接检查data-src
                      originalEmbed.querySelector('img')?.getAttribute('src') ||
                      originalEmbed.querySelector('img')?.getAttribute('data-src') ||
                      originalEmbed.querySelector('img')?.getAttribute('data-href') ||
                      originalEmbed.querySelector('img')?.getAttribute('data-link') ||
                      originalEmbed.dataset.src ||
                      originalEmbed.dataset.link ||
                      originalEmbed.dataset.href;
            
            // 检查是否有data-embed-src属性
            if (!src) {
                src = originalEmbed.getAttribute('data-embed-src') || undefined;
            }
            
            // 检查是否有background-image样式中的url
            if (!src) {
                const bgStyle = originalEmbed.style.backgroundImage;
                if (bgStyle && bgStyle.startsWith('url(')) {
                    const urlMatch = bgStyle.match(/url\((['"]?)(.*?)\1\)/);
                    if (urlMatch && urlMatch[2]) {
                        src = urlMatch[2];
                        console.log('从background-image提取的URL:', src);
                    }
                }
            }
            
            // 检查子元素中的background-image
            if (!src) {
                const bgImgEl = originalEmbed.querySelector('[style*="background-image"]');
                if (bgImgEl) {
                    const bgStyle = (bgImgEl as HTMLElement).style.backgroundImage;
                    if (bgStyle && bgStyle.startsWith('url(')) {
                        const urlMatch = bgStyle.match(/url\((['"]?)(.*?)\1\)/);
                        if (urlMatch && urlMatch[2]) {
                            src = urlMatch[2];
                            console.log('从子元素background-image提取的URL:', src);
                        }
                    }
                }
            }
            
            // 特别处理Obsidian内部图片链接格式，如![[图片名称.png]]
            if (src && (src.startsWith('[') || src.startsWith('!['))) {
                console.log('检测到Obsidian内部链接格式:', src);
                // 提取链接内容
                const match = src.match(/!*\[\[(.*?)\]\]/);
                if (match) {
                    src = match[1];
                    console.log('提取的实际路径:', src);
                }
            }
            
            // 移除URL中的协议和域名部分，只保留路径（如果是绝对URL）
            if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
                console.log('检测到外部URL，保留原样:', src);
            } else {
                // 处理相对路径，移除可能的../或./前缀
                if (src) {
                    // 移除路径中的../和./
                    const pathParts = src.split('/').filter(part => part && part !== '.');
                    const cleanedPath: string[] = [];
                    
                    for (const part of pathParts) {
                        if (part === '..' && cleanedPath.length > 0) {
                            cleanedPath.pop();
                        } else {
                            cleanedPath.push(part);
                        }
                    }
                    
                    if (cleanedPath.length > 0) {
                        src = cleanedPath.join('/');
                        console.log('清理后的路径:', src);
                    }
                }
            }
            
            // 检查是否有文件名（包含扩展名）
            if (src && !src.includes('.')) {
                console.log('路径可能缺少扩展名:', src);
                // 尝试添加常见的图片扩展名
                const commonExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
                for (const ext of commonExtensions) {
                    const testPath = src + ext;
                    const testFile = this.app.metadataCache.getFirstLinkpathDest(testPath, currentFilePath);
                    if (testFile) {
                        src = testPath;
                        console.log('找到带扩展名的文件:', src);
                        break;
                    }
                }
            }
            
            const alt = originalEmbed.getAttribute('alt') || 
                       originalEmbed.querySelector('img')?.getAttribute('alt') || '';
            
            console.log('Extracted src:', src);
            console.log('Extracted alt:', alt);
            
            if (!src) {
                console.log('未找到有效src，跳过该元素');
                return;
            }
            
            try {
                // 解析图片路径，移除可能的管道符和参数
                const linktext = src.split('|')[0];
                
                console.log('Processing linktext:', linktext);
                
                // 获取图片文件
                const file = this.app.metadataCache.getFirstLinkpathDest(linktext!, currentFilePath);
                
                console.log('Found file:', file);
                
                if (file) {
                    console.log('找到图片文件:', file.path, file.name);
                    
                    // 获取图片的绝对路径
                    const absolutePath = this.app.vault.adapter.getResourcePath(file.path);
                    
                    console.log('生成的绝对路径:', absolutePath);
                    
                    // 创建img元素
                    const newImg = document.createElement('img');
                    newImg.src = absolutePath;
                    newImg.alt = alt;
                    newImg.className = 'red-image red-img';
                    
                    // 设置图片样式，确保它能正确显示
                    newImg.style.maxWidth = '100%';
                    newImg.style.height = 'auto';
                    newImg.style.display = 'block';
                    newImg.style.margin = '10px auto';
                    
                    console.log('创建的新img元素:', newImg.outerHTML);
                    
                    // 替换原始的embed元素
                    if (originalEmbed.parentNode) {
                        originalEmbed.parentNode.replaceChild(newImg, originalEmbed);
                        console.log('成功替换嵌入元素为img标签');
                    } else {
                        console.warn('嵌入元素的父节点为null，无法替换');
                        // 如果没有父节点，尝试直接添加到内容中
                        content.appendChild(newImg);
                        console.log('尝试直接将图片添加到内容中');
                    }
                    
                    // 添加图片加载Promise
                    const loadPromise = new Promise<void>((resolve) => {
                        // 如果图片已经加载完成
                        if (newImg.complete) {
                            resolve();
                        } else {
                            // 等待图片加载完成
                            newImg.onload = () => {
                                console.log('图片加载完成:', absolutePath);
                                resolve();
                            };
                            // 图片加载失败时也 resolve，避免阻塞，但要显示错误提示
                            newImg.onerror = () => {
                                console.error('图片加载失败:', absolutePath);
                                // 创建错误提示元素
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'red-image-error';
                                errorDiv.textContent = `找不到图片: ${linktext}`;
                                errorDiv.style.cssText = `
                                    width: 100%;
                                    height: 100px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    border: 1px dashed #ff4d4f;
                                    color: #ff4d4f;
                                    background: #fff1f0;
                                    border-radius: 4px;
                                    padding: 10px;
                                    box-sizing: border-box;
                                `;
                                // 替换失败的图片元素
                                if (newImg.parentNode) {
                                    newImg.parentNode.replaceChild(errorDiv, newImg);
                                }
                                resolve();
                            };
                        }
                    });
                    
                    imageLoadPromises.push(loadPromise);
                } else {
                    console.warn('未找到图片文件:', linktext);
                    
                    // 尝试直接使用linktext作为路径（如果是相对路径）
                    try {
                        const absolutePath = this.app.vault.adapter.getResourcePath(linktext!);
                        console.log('尝试直接生成绝对路径:', absolutePath);
                        
                        // 创建img元素
                        const newImg = document.createElement('img');
                        newImg.src = absolutePath;
                        newImg.alt = alt;
                        newImg.className = 'red-image red-img';
                        
                        // 设置图片样式，确保它能正确显示
                        newImg.style.maxWidth = '100%';
                        newImg.style.height = 'auto';
                        newImg.style.display = 'block';
                        newImg.style.margin = '10px auto';
                        
                        console.log('创建的新img元素:', newImg.outerHTML);
                        
                        // 替换原始的embed元素
                        if (originalEmbed.parentNode) {
                            originalEmbed.parentNode.replaceChild(newImg, originalEmbed);
                            console.log('成功使用直接路径替换嵌入元素为img标签');
                        } else {
                            console.warn('嵌入元素的父节点为null，无法替换');
                            // 如果没有父节点，尝试直接添加到内容中
                            content.appendChild(newImg);
                            console.log('尝试直接将图片添加到内容中');
                        }
                        
                        // 添加图片加载Promise
                        const loadPromise = new Promise<void>((resolve) => {
                            // 如果图片已经加载完成
                            if (newImg.complete) {
                                resolve();
                            } else {
                                // 等待图片加载完成
                                newImg.onload = () => {
                                    console.log('图片加载完成:', absolutePath);
                                    resolve();
                                };
                                // 图片加载失败时也 resolve，避免阻塞，但要显示错误提示
                                newImg.onerror = () => {
                                    console.error('图片加载失败:', absolutePath);
                                    // 创建错误提示元素
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'red-image-error';
                                    errorDiv.textContent = `找不到图片: ${linktext}`;
                                    errorDiv.style.cssText = `
                                        width: 100%;
                                        height: 100px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        border: 1px dashed #ff4d4f;
                                        color: #ff4d4f;
                                        background: #fff1f0;
                                        border-radius: 4px;
                                        padding: 10px;
                                        box-sizing: border-box;
                                    `;
                                    // 替换失败的图片元素
                                    if (newImg.parentNode) {
                                        newImg.parentNode.replaceChild(errorDiv, newImg);
                                    }
                                    resolve();
                                };
                            }
                        });
                        
                        imageLoadPromises.push(loadPromise);
                    } catch (directError) {
                        console.error('直接路径生成失败:', directError);
                    }
                }
            } catch (error) {
                console.error('图片处理错误:', error);
            }
        });
        
        // 处理引用块
        content.querySelectorAll('blockquote').forEach(el => {
            el.classList.add('red-blockquote');
            el.querySelectorAll('p').forEach(p => {
                p.classList.add('red-blockquote-p');
            });
        });
        
        // 等待所有图片加载完成
        return Promise.all(imageLoadPromises).then(() => {
            // 最后再次检查是否有图片被处理
            const finalImgElements = content.querySelectorAll('img');
            console.log(`图片处理完成后，内容中共有 ${finalImgElements.length} 个img元素`);
            return Promise.resolve();
        });
    }
}
