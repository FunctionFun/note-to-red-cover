import type { ImgTemplate } from '../imgTemplateManager';
import type { SettingsManager } from '../settings/settings';

export class NotesTemplate implements ImgTemplate {
    id = 'notes';
    name = '备忘录';
    sections = {
        header: true,
        content: true as const,
        footer: false
    };

    constructor(
        private settingsManager: SettingsManager,
        private onSettingsUpdate: () => Promise<void>
    ) { }

    render(element: HTMLElement, settings: any) {
        const sections = element.querySelectorAll('.red-content-section');
        
        const header = element.querySelector('.red-preview-header') as HTMLElement;
        if (header) {
            header.empty();
            
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
            
            // 只显示当前激活section的页码信息
            this.createPageNumberSection(header, activeSectionIndex, sections.length, settings);
        }

        const footer = element.querySelector('.red-preview-footer');
        if (footer && !this.sections.footer) {
            footer.empty();
            footer.removeAttribute('class');
        }
    }

    private async handleTitleEdit(element: HTMLElement) {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-notes-edit-input';
        input.placeholder = '请输入标题';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            const newTitle = input.value.trim();
            await this.settingsManager.updateSettings({
                notesTitle: newTitle || '备忘录'
            });
            await this.onSettingsUpdate();
            input.replaceWith(element);
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleBlur();
            }
        });
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
}