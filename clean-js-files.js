const fs = require('fs');
const path = require('path');

// 获取src目录
const srcDir = path.join(__dirname, 'src');

// 递归获取目录下所有文件
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 获取所有.js和.ts文件
const allFiles = getAllFiles(srcDir);
const jsFiles = allFiles.filter(file => file.endsWith('.js'));
const tsFiles = allFiles.filter(file => file.endsWith('.ts'));

// 将.ts文件路径转换为没有扩展名的形式，用于比较
const tsFileNames = new Set(tsFiles.map(file => file.slice(0, -3)));

console.log('找到的.js文件数量:', jsFiles.length);
console.log('找到的.ts文件数量:', tsFiles.length);

// 找出有对应.ts文件的.js文件并删除
const filesToDelete = jsFiles.filter(jsFile => {
  const baseName = jsFile.slice(0, -3);
  return tsFileNames.has(baseName);
});

console.log('将删除的多余.js文件数量:', filesToDelete.length);

filesToDelete.forEach(file => {
  try {
    fs.unlinkSync(file);
    console.log('已删除:', file);
  } catch (error) {
    console.error('删除失败:', file, error.message);
  }
});

console.log('清理完成!');
