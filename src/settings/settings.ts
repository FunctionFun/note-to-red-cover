
import  RedPlugin  from '../main';
import { EventEmitter } from 'events';
interface RedSettings {
    donateCount?: number;
    lastDonatePrompt?: number;
    templateId: string;
    fontFamily: string;
    fontSize: number;
    backgroundId: string;
    // 添加用户信息设置
    userAvatar: string;
    userName: string;
    notesTitle: string;
    userId: string;
    showFooter?: boolean;
    footerLeftText: string;
    footerRightText: string;
    useHorizontalRuleSplit: boolean; // 基于分割线分割内容的开关
    customFonts: { value: string; label: string; isPreset?: boolean }[];  // 添加自定义字体配置
    backgroundSettings: {
        imageUrl: string;
        scale: number;
        position: { x: number; y: number };
    };
    // 水印配置
    watermarkSettings: {
        enabled: boolean;
        watermarkText: string;
        watermarkImage: string;
        opacity: number; // 0.1 - 1
        count: number; // 1 - 5
        watermarkColor: string; // 十六进制颜色值
    };
    // 导出标识
    exportedNotes: string[];
    // 小红书作者信息
    xhsNickname: string;
    xhsAccount: string;
    xhsBio: string;
}

export const DEFAULT_SETTINGS: RedSettings = {
    templateId: 'default',
    fontFamily: 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC"',
    fontSize: 16,
    backgroundId: '',
    // 修改默认用户信息
    userAvatar: '',  // 默认为空，提示用户上传
    userName: '',
    notesTitle: '',
    userId: '',

    useHorizontalRuleSplit: true, // 默认使用分割线分割内容
    footerLeftText: '作者名称',
    footerRightText: '作者账号 个人简介',
    // 小红书作者信息默认值
    xhsNickname: '作者名称',
    xhsAccount: '@作者账号',
    xhsBio: '个人简介',
    customFonts: [
        {
            value: 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif',
            label: '默认字体',
            isPreset: true
        },
        {
            value: 'SimSun, "宋体", serif',
            label: '宋体',
            isPreset: true
        },
        {
            value: 'SimHei, "黑体", sans-serif',
            label: '黑体',
            isPreset: true
        },
        {
            value: 'KaiTi, "楷体", serif',
            label: '楷体',
            isPreset: true
        },
        {
            value: '"Microsoft YaHei", "微软雅黑", sans-serif',
            label: '雅黑',
            isPreset: true
        }
    ],
    backgroundSettings: {
        imageUrl: '',
        scale: 1,
        position: { x: 0, y: 0 }
    },
    // 水印默认设置
    watermarkSettings: {
        enabled: true,
        watermarkText: '小红书笔记',
        watermarkImage: '',
        opacity: 0.2,
        count: 2,
        watermarkColor: '#ebebeb'
    },
    // 导出标识默认设置
    exportedNotes: []
}

export class SettingsManager extends EventEmitter {
    private plugin: RedPlugin;
    private settings: RedSettings;

    constructor(plugin: RedPlugin) {
        super();
        this.plugin = plugin;
        this.settings = DEFAULT_SETTINGS;
    }

    async loadSettings() {
        let savedData = await this.plugin.loadData();

        // 确保 savedData 是一个对象
        if (!savedData) {
            savedData = {};
        }
    
        this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);
    }

    async saveSettings() {
        await this.plugin.saveData(this.settings);
    }

    getSettings(): RedSettings {
        return this.settings;
    }

    async updateSettings(settings: Partial<RedSettings>) {
        this.settings = { ...this.settings, ...settings };
        await this.saveSettings();
        this.emit('settings-updated');
    }

    getFontOptions() {
        return this.settings.customFonts;
    }

    async addCustomFont(font: { value: string; label: string }) {
        this.settings.customFonts.push({ ...font, isPreset: false });
        await this.saveSettings();
    }

    async removeFont(value: string) {
        const font = this.settings.customFonts.find(f => f.value === value);
        if (font && !font.isPreset) {
            this.settings.customFonts = this.settings.customFonts.filter(f => f.value !== value);
            await this.saveSettings();
        }
    }

    async updateFont(oldValue: string, newFont: { value: string; label: string }) {
        const index = this.settings.customFonts.findIndex(f => f.value === oldValue);
        if (index !== -1 && !this.settings.customFonts[index].isPreset) {
            this.settings.customFonts[index] = { ...newFont, isPreset: false };
            await this.saveSettings();
        }
    }
}
