import type { ImgTemplate } from '../imgTemplateManager';
import type { SettingsManager } from '../settings/settings';
import { Notice } from 'obsidian';

export class DefaultTemplate implements ImgTemplate {
    id = 'default';
    name = '默认模板';
    sections = {
        header: true,
        content: true as const,
        footer: true
    };

    constructor(
        private settingsManager: SettingsManager,
        private onSettingsUpdate: () => Promise<void>
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

    private createUserInfoContainer(parent: HTMLElement): HTMLElement {
        return parent.createEl('div', { cls: 'red-user-info' });
    }

    private createUserLeftSection(parent: HTMLElement, settings: any): HTMLElement {
        const userLeft = parent.createEl('div', { cls: 'red-user-left' });
        this.createAvatarSection(userLeft, settings);
        this.createUserMetaSection(userLeft, settings);
        return userLeft;
    }

    private createAvatarSection(parent: HTMLElement, settings: any) {
        const avatar = parent.createEl('div', {
            cls: 'red-user-avatar',
            attr: { 'title': '点击上传头像' }
        });

        if (settings.userAvatar) {
            avatar.createEl('img', {
                attr: {
                    src: settings.userAvatar,
                    alt: '用户头像'
                }
            });
        } else {
            const placeholder = avatar.createEl('div', { cls: 'red-avatar-placeholder' });
            placeholder.createEl('span', {
                cls: 'red-avatar-upload-icon',
                text: '📷'
            });
        }

        avatar.addEventListener('click', () => this.handleAvatarClick());
    }

    private createUserMetaSection(parent: HTMLElement, settings: any) {
        const userMeta = parent.createEl('div', { cls: 'red-user-meta' });
        
        const userNameContainer = userMeta.createEl('div', { cls: 'red-user-name-container' });
        const userName = userNameContainer.createEl('div', {
            cls: 'red-user-name',
            text: settings.userName,
            attr: { 'title': '点击编辑用户名' }
        });
        userNameContainer.createEl('span', {
            cls: 'red-verified-icon',
            attr: {
                role: 'img'
            }
        }).innerHTML = `<svg viewBox="0 0 22 22" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-bnwqim r-lrvibr r-m6rgpd r-1cvl2hr r-f9ja8p r-og9te1 r-3t4u6i"><g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path></g></svg>`;
        
        const userId = userMeta.createEl('div', {
            cls: 'red-user-id',
            text: settings.userId,
            attr: { 'title': '点击编辑用户ID' }
        });

        userName.addEventListener('click', () => this.handleUserNameEdit(userName));
        userId.addEventListener('click', () => this.handleUserIdEdit(userId));
    }

    private createTimeSection(parent: HTMLElement, settings: any) {
        const userRight = parent.createEl('div', { cls: 'red-user-right' });
        userRight.createEl('div', {
            cls: 'red-post-time',
            text: new Date().toLocaleDateString(settings.timeFormat)
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

    private createFooterContent(footerArea: HTMLElement) {
        footerArea.empty();
        const settings = this.settingsManager.getSettings();

        // 左边显示头像/作者名/作者账号
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
        // 添加头像
        if (settings.userAvatar) {
            const avatar = parent.createEl('img', {
                cls: 'red-footer-avatar',
                attr: {
                    src: settings.userAvatar,
                    alt: '作者头像'
                }
            });
            avatar.style.width = '20px';
            avatar.style.height = '20px';
            avatar.style.borderRadius = '50%';
            avatar.style.marginRight = '8px';
        }

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

    private async handleAvatarClick() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (file) {
                try {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const base64 = e.target?.result as string;
                        await this.settingsManager.updateSettings({
                            userAvatar: base64
                        });
                        await this.onSettingsUpdate();
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('头像更新失败:', error);
                    new Notice('头像更新失败');
                }
            }
        });

        input.click();
    }

    private async handleUserNameEdit(element: HTMLElement) {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-user-edit-input';
        input.placeholder = '请输入用户名';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            const newName = input.value.trim();
            await this.settingsManager.updateSettings({
                userName: newName || ''
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

    private async handleUserIdEdit(element: HTMLElement) {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-user-edit-input';
        input.placeholder = '请输入用户ID';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            const newId = input.value.trim();
            await this.settingsManager.updateSettings({
                userId: newId || '@Yeban'
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

    private async handleFooterTextEdit(element: HTMLElement, position: 'left' | 'right') {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-footer-edit-input';
        input.placeholder = '请输入页脚文本';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            const newText = input.value.trim();
            const settings = position === 'left' 
                ? { footerLeftText: newText || '' }
                : { footerRightText: newText || '' };
            
            await this.settingsManager.updateSettings(settings);
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
}