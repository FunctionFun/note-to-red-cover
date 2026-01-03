import RedPlugin from "../main";

export interface Theme {
    id: string;
    name: string;
    cssCode: string;
}

export interface CustomFont {
    id?: string;
    label: string;
    value: string;
    isPreset?: boolean;
}

export interface BackgroundSettings {
    imageUrl: string;
    scale: number;
    position: { x: number; y: number };
    opacity?: number;
    blur?: number;
    backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
}

export const PRESET_FONTS: CustomFont[] = [
    {
        label: '苹方',
        value: 'PingFang SC',
        isPreset: true
    },
    {
        label: '微软雅黑',
        value: 'Microsoft YaHei',
        isPreset: true
    },
    {
        label: '霞鹜文楷',
        value: 'LXGW WenKai',
        isPreset: true
    },
    {
        label: '思源黑体',
        value: 'Source Han Sans CN',
        isPreset: true
    },
    {
        label: '思源宋体',
        value: 'Source Han Serif SC',
        isPreset: true
    }
];

export interface RedSettings {
    selectedThemeId: string;
    themes: Theme[];
    useHorizontalRuleSplit: boolean;
    showFooter: boolean;
    showWatermark: boolean;
    watermarkSize: number;
    author: string;
    xhsAccount?: string;
    customFonts: CustomFont[];
    fontSize?: number;
    backgroundSettings?: BackgroundSettings;
    watermarkSettings?: any;
    fontFamily?: string;
    xhsBio?: string;
    collapsedSections?: {
        [key: string]: boolean;
    };
}

export const DEFAULT_SETTINGS: Partial<RedSettings> = {
    selectedThemeId: "default",
    themes: [
        { id: "default", name: "默认主题", cssCode: "" }
    ],
    useHorizontalRuleSplit: false,
    showFooter: true,
    showWatermark: false,
    watermarkSize: 30,
    author: "FunctionFun",
    xhsAccount: "functionfun",
    customFonts: [],
    fontSize: 16,
    backgroundSettings: { imageUrl: "", scale: 1, position: { x: 0, y: 0 }, backgroundRepeat: "no-repeat", opacity: 0.8 },
    watermarkSettings: {},
    fontFamily: "",
    xhsBio: "设计·编程·游戏·学习",
    collapsedSections: {
        author: true,
        theme: true,
        typography: true,
        watermark: true,
        background: true
    }
};

export class SettingsManager {
    private plugin: RedPlugin;
    settings: RedSettings;
    private eventListeners: Map<string, Set<Function>> = new Map();

    constructor(plugin: RedPlugin) {
        this.plugin = plugin;
        this.settings = this.buildDefaultSettings();
    }

    private buildDefaultSettings(): RedSettings {
        const defaultSettings: RedSettings = {
            ...DEFAULT_SETTINGS,
            useHorizontalRuleSplit: DEFAULT_SETTINGS.useHorizontalRuleSplit || false,
            showFooter: DEFAULT_SETTINGS.showFooter || false,
            showWatermark: DEFAULT_SETTINGS.showWatermark || false,
            watermarkSize: DEFAULT_SETTINGS.watermarkSize || 30,
            author: DEFAULT_SETTINGS.author || "",
            customFonts: DEFAULT_SETTINGS.customFonts || [],
            selectedThemeId: DEFAULT_SETTINGS.selectedThemeId || "default",
            themes: DEFAULT_SETTINGS.themes || [
                { id: "default", name: "默认主题", cssCode: "" }
            ],
            fontSize: DEFAULT_SETTINGS.fontSize || 16,
            backgroundSettings: DEFAULT_SETTINGS.backgroundSettings || { imageUrl: "", scale: 1, position: { x: 0, y: 0 }, backgroundRepeat: "no-repeat", opacity: 0.8 },
            watermarkSettings: DEFAULT_SETTINGS.watermarkSettings || {},
            fontFamily: DEFAULT_SETTINGS.fontFamily || "",
            xhsBio: DEFAULT_SETTINGS.xhsBio || "",
            collapsedSections: DEFAULT_SETTINGS.collapsedSections || {
                author: true,
                theme: true,
                typography: true,
                watermark: true,
                background: true
            }
        } as RedSettings;
        return defaultSettings;
    }

    async initialize(): Promise<void> {
        this.settings = Object.assign(
            this.buildDefaultSettings(),
            await this.plugin.loadData()
        );
    }

    async save(): Promise<void> {
        await this.plugin.saveData(this.settings);
        this.emit('settings-updated');
    }

    on(event: string, callback: Function): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
    }

    off(event: string, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    private emit(event: string): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback());
        }
    }

    getSettings(): RedSettings {
        return this.settings;
    }

    async updateSettings(updates: Partial<RedSettings>): Promise<void> {
        this.settings = Object.assign({}, this.settings, updates);
        await this.save();
    }

    async setShowWatermark(value: boolean): Promise<void> {
        this.settings.showWatermark = value;
        await this.save();
    }

    async setWatermarkSize(value: number): Promise<void> {
        this.settings.watermarkSize = value;
        await this.save();
    }

    async setAuthor(value: string): Promise<void> {
        this.settings.author = value;
        await this.save();
    }

    async setFontSize(value: number): Promise<void> {
        this.settings.fontSize = value;
        await this.save();
    }

    async setFontFamily(value: string): Promise<void> {
        this.settings.fontFamily = value;
        await this.save();
    }

    getFonts(): CustomFont[] {
        return PRESET_FONTS.concat(this.settings.customFonts);
    }

    getFontOptions(): CustomFont[] {
        const options: CustomFont[] = [
            { value: '', label: '使用系统默认字体' }
        ];
        return options.concat(this.getFonts());
    }

    async addFont(font: CustomFont): Promise<void> {
        this.settings.customFonts.push(font);
        await this.save();
    }

    async updateFont(oldFontValue: string, newFont: CustomFont): Promise<void> {
        const index = this.settings.customFonts.findIndex((font) => font.value === oldFontValue);
        if (index !== -1) {
            this.settings.customFonts[index] = newFont;
            await this.save();
        }
    }

    async deleteFont(fontValue: string): Promise<void> {
        this.settings.customFonts = this.settings.customFonts.filter((font) => font.value !== fontValue);
        await this.save();
    }

    getThemes(): Theme[] {
        return this.settings.themes;
    }

    getSelectedTheme(): Theme {
        const selected = this.settings.themes.find(theme => theme.id === this.settings.selectedThemeId);
        const defaultTheme = this.settings.themes[0];
        return selected || defaultTheme || { id: 'default', name: '默认主题', cssCode: '' };
    }

    async addTheme(name: string, cssCode: string, setAsDefault: boolean = true): Promise<void> {
        const newTheme: Theme = {
            id: `theme-${Date.now()}`,
            name,
            cssCode
        };
        this.settings.themes.push(newTheme);
        if (setAsDefault) {
            this.settings.selectedThemeId = newTheme.id;
        }
        await this.save();
    }

    async updateTheme(themeId: string, newName: string, newCssCode: string): Promise<void> {
        const theme = this.settings.themes.find(t => t.id === themeId);
        if (theme) {
            theme.name = newName;
            theme.cssCode = newCssCode;
            await this.save();
        }
    }

    async updateThemeAndSetDefault(themeId: string, newName: string, newCssCode: string): Promise<void> {
        const theme = this.settings.themes.find(t => t.id === themeId);
        if (theme) {
            theme.name = newName;
            theme.cssCode = newCssCode;
            this.settings.selectedThemeId = themeId;
            await this.save();
        }
    }

    async selectTheme(themeId: string): Promise<void> {
        this.settings.selectedThemeId = themeId;
        await this.save();
    }

    async toggleSectionCollapse(sectionKey: string): Promise<void> {
        if (!this.settings.collapsedSections) {
            this.settings.collapsedSections = {};
        }
        this.settings.collapsedSections[sectionKey] = !this.settings.collapsedSections[sectionKey];
        await this.save();
    }

    isSectionCollapsed(sectionKey: string): boolean {
        if (!this.settings.collapsedSections) {
            return false;
        }
        return this.settings.collapsedSections[sectionKey] || false;
    }
}