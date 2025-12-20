// 使用 require 导入 JSON 文件以避免 TypeScript 的 JSON 模块解析问题
const minimalTemplate = require('./minimal.json');
const elegantTemplate = require('./elegant.json');

export const templates = {
    minimal: minimalTemplate,
    elegant: elegantTemplate
};