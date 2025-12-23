import { DefaultTemplate } from './imgTelplate/defaultTemplate';
import type { SettingsManager } from './settings/settings';

export interface ImgTemplate {
    id: string;
    name: string;
    sections: {
        header?: boolean;
        content: true;
        footer?: boolean;
    };
    render: (element: HTMLElement, settings: any) => void;
}

export class ImgTemplateManager {
    private templates: ImgTemplate[] = [];
    private currentTemplate: ImgTemplate | null = null;

    constructor(
        private settingsManager: SettingsManager
    ) {
        this.initializeTemplates();
    }

    private initializeTemplates() {
        // 只注册默认模板
        this.registerTemplate(new DefaultTemplate(this.settingsManager));
    }

    registerTemplate(template: ImgTemplate) {
        this.templates.push(template);
    }

    getImgTemplateOptions() {
        return this.templates.map(t => ({
            value: t.id,
            label: t.name
        }));
    }

    setCurrentTemplate(id: string) {
        const template = this.templates.find(t => t.id === id);
        if (template) {
            this.currentTemplate = template;
        }
    }

    applyTemplate(previewEl: HTMLElement, settings: any) {
        if (!this.currentTemplate) {
            this.currentTemplate = this.templates[0] || null;
        }

        if (this.currentTemplate) {
            this.currentTemplate.render(previewEl, settings);
        }
    }
}