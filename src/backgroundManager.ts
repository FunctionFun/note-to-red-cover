import { BackgroundSettings } from './modals/BackgroundSettingModal';

export class BackgroundManager {
    constructor() {}

    public applyBackgroundStyles(element: HTMLElement, settings: BackgroundSettings) {
        const scale = Math.max(settings.scale, 0.1);
        
        let backgroundLayer = element.querySelector('.red-background-layer') as HTMLElement;
        
        if (!backgroundLayer) {
            backgroundLayer = document.createElement('div');
            backgroundLayer.className = 'red-background-layer';
            backgroundLayer.style.position = 'absolute';
            backgroundLayer.style.top = '0';
            backgroundLayer.style.left = '0';
            backgroundLayer.style.width = '100%';
            backgroundLayer.style.height = '100%';
            backgroundLayer.style.zIndex = '0';
            backgroundLayer.style.pointerEvents = 'none';
            
            element.insertBefore(backgroundLayer, element.firstChild);
        }
        
        backgroundLayer.style.backgroundImage = `url(${settings.imageUrl})`;
        backgroundLayer.style.backgroundSize = `${scale * 100}% ${scale * 100}%`;
        backgroundLayer.style.backgroundPosition = `${settings.position.x}px ${settings.position.y}px`;
        backgroundLayer.style.backgroundRepeat = settings.backgroundRepeat || 'no-repeat';
        
        if (settings.opacity !== undefined) {
            const clampedOpacity = Math.max(0, Math.min(1, settings.opacity));
            backgroundLayer.style.opacity = clampedOpacity.toString();
        }
    }

    public clearBackgroundStyles(element: HTMLElement) {
        const backgroundLayer = element.querySelector('.red-background-layer') as HTMLElement;
        if (backgroundLayer) {
            backgroundLayer.remove();
        }
    }
}