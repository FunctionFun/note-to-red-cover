import type { ImgTemplate } from '../imgTemplateManager';
import type { SettingsManager } from '../settings/settings';


export class DefaultTemplate implements ImgTemplate {
    id = 'default';
    name = '默认模板';
    sections = {
        header: true,
        content: true as const,
        footer: true
    };

    constructor(
        private settingsManager: SettingsManager
    ) {}

    render(element: HTMLElement, settings: any) {
        const sections = element.querySelectorAll('.red-content-section');
        
        // 获取已有的头部和页脚元素
        const header = element.querySelector('.red-preview-header');
        const footer = element.querySelector('.red-preview-footer');

        // 找到当前激活的section，如果没有则使用第一个
        let activeSectionIndex = 0;
        const activeSection = element.querySelector('.red-section-active');
        if (activeSection) {
            // 遍历sections找到激活section的索引
            sections.forEach((section, index) => {
                if (section === activeSection) {
                    activeSectionIndex = index;
                }
            });
        }

        // 更新头部内容，只显示当前激活section的页码
        if (this.sections.header && header) {
            this.createHeaderContent(header as HTMLElement, activeSectionIndex, sections.length, settings);
        }

        // 页脚内容
        if (this.sections.footer && footer) {
            // 检查是否显示页脚
            if (settings.showFooter !== false) {
                this.createFooterContent(footer as HTMLElement);
            } else {
                // 完全移除页脚元素
                footer.remove();
            }
        }
    }

    private createHeaderContent(headerArea: HTMLElement, currentPage: number, totalPages: number, settings: any) {
        headerArea.empty();
        // 只显示页码信息
        this.createPageNumberSection(headerArea, currentPage, totalPages, settings);
    }









    private createPageNumberSection(parent: HTMLElement, currentPage: number, totalPages: number, settings: any) {
        // 获取文件名，如果没有则显示默认文本
        const fileName = settings.currentFileName || '未命名文件';
        const pageNumber = parent.createEl('div', {
            cls: 'red-page-number',
            text: `[${fileName} ${currentPage + 1}/${totalPages}]`
        });
        // 设置样式：小字体，不抢眼，左对齐
        pageNumber.style.fontSize = '12px';
        pageNumber.style.color = 'rgb(232 232 232)';
        pageNumber.style.marginTop = '8px';
        pageNumber.style.textAlign = 'left';
        pageNumber.style.paddingLeft = '10px';
    }

    private createFooterContent(footerArea: HTMLElement) {
        footerArea.empty();
        const settings = this.settingsManager.getSettings();

        // 左边显示作者名/作者账号
        const leftSection = footerArea.createEl('div', { cls: 'red-footer-left' });
        this.createFooterLeftSection(leftSection, settings);
        
        footerArea.createEl('div', {
            cls: 'red-footer-separator',
            text: '|'
        });

        // 右边显示自定义签名
        this.createFooterText(footerArea, settings.xhsBio);
    }

    private createFooterLeftSection(parent: HTMLElement, settings: any): void {
        // 添加作者名和作者账号
        const authorInfo = parent.createEl('div', { cls: 'red-footer-author-info' });
        
        authorInfo.createEl('span', {
            cls: 'red-footer-author-name',
            text: settings.xhsNickname || '未设置'
        });
        
        authorInfo.createEl('span', { text: ' ' });
        
        authorInfo.createEl('span', {
            cls: 'red-footer-author-id',
            text: settings.xhsAccount || ''
        });
    }

    private createFooterText(parent: HTMLElement, text: string): HTMLElement {
        return parent.createEl('div', {
            cls: 'red-footer-text',
            text: text
        });
    }




}