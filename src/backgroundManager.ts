import { BackgroundSettings } from './modals/BackgroundSettingModal';

export class BackgroundManager {
    constructor() {}

    public applyBackgroundStyles(element: HTMLElement, settings: BackgroundSettings) {
        // 确保背景尺寸不会为0
        const backgroundScale = Math.max(settings.scale * 100, 100); // 至少100%
        
        element.style.backgroundImage = `url(${settings.imageUrl})`;
        element.style.backgroundSize = `${backgroundScale}%`;
        element.style.backgroundPosition = `${settings.position.x}px ${settings.position.y}px`;
        element.style.backgroundRepeat = 'no-repeat';
    }

    public clearBackgroundStyles(element: HTMLElement) {
        // 直接清除背景相关样式，避免影响其他样式
        element.style.backgroundImage = '';
        element.style.backgroundSize = '';
        element.style.backgroundPosition = '';
        element.style.backgroundRepeat = '';
    }
}