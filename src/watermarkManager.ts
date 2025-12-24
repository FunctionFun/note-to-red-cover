import type { RedSettings } from './settings/settings';

// 从RedSettings中提取watermarkSettings类型
export type WatermarkSettings = RedSettings['watermarkSettings'];

/**
 * 水印生成配置
 */
export interface WatermarkConfig {
  containerWidth: number;
  containerHeight: number;
  settings: WatermarkSettings;
  seed?: number; // 可选的随机种子，用于确保预览和导出的一致性
}

/**
 * 水印位置信息
 */
export interface WatermarkPosition {
  x: number;
  y: number;
  rotation: number;
}

/**
 * 水印尺寸信息
 */
export interface WatermarkSize {
  width: number;
  height: number;
}

/**
 * 统一的水印管理类，处理预览和导出的水印生成逻辑
 */
export class WatermarkManager {
  /**
   * 生成指定数量的水印位置，确保在容器边界内
   */
  public generateWatermarkPositions(config: WatermarkConfig): WatermarkPosition[] {
    const { containerWidth, containerHeight, settings, seed } = config;
    const { count } = settings;
    
    // 计算水印尺寸估计值（用于边界检查）
    const watermarkSize = this.estimateWatermarkSize(settings);
    const watermarkWidth = watermarkSize.width;
    const watermarkHeight = watermarkSize.height;
    
    // 创建可预测的随机数生成器
    const random = this.createRandomGenerator(seed || Date.now());
    
    const positions: WatermarkPosition[] = [];
    
    for (let i = 0; i < count; i++) {
      // 计算随机位置，但确保水印不会超出容器边界
      const x = watermarkWidth / 2 + random() * (containerWidth - watermarkWidth);
      const y = watermarkHeight / 2 + random() * (containerHeight - watermarkHeight);
      
      // 随机旋转角度 (-30 到 30 度)
      const rotation = random() * 60 - 30;
      
      positions.push({ x, y, rotation });
    }
    
    return positions;
  }
  
  /**
   * 估计水印尺寸（用于边界检查）
   */
  private estimateWatermarkSize(settings: WatermarkSettings): WatermarkSize {
    const { watermarkText, watermarkImage } = settings;
    
    if (watermarkImage) {
      // 对于图片水印，使用固定宽度100px，并假设高度为宽度的一半（与downloadManager中的实际绘制一致）
      return { width: 100, height: 50 }; // 假设图片尺寸为100x50，与实际绘制的宽高比一致
    } else if (watermarkText) {
      // 对于文字水印，根据字体大小和文本长度估计
      const fontSize = 24; // 与当前实现一致
      const charWidth = fontSize * 0.6; // 平均字符宽度估计
      const textWidth = watermarkText.length * charWidth;
      const textHeight = fontSize;
      return { width: textWidth, height: textHeight };
    }
    
    return { width: 100, height: 50 };
  }
  
  /**
   * 创建可预测的随机数生成器
   * 使用线性同余生成器(LCG)实现
   */
  private createRandomGenerator(seed: number): () => number {
    // LCG参数（来自数值计算方法）
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    let current = seed;
    
    return () => {
      current = (a * current + c) % m;
      return current / m;
    };
  }
  
  /**
   * 获取用于预览和导出的统一随机种子
   */
  public getWatermarkSeed(): number {
    // 可以使用设置中的某个值或当前时间戳（但需要确保预览和导出使用相同值）
    // 这里简单使用固定种子，实际应用中可以考虑从设置中获取
    return 123456;
  }
}