import React from 'react';
import '../index.css';

const FileIcon = ({ filename, size = '2rem' }) => {
  // 获取文件扩展名
  const getFileExtension = (filename) => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  // 定义颜色映射
  const colorMap = {
    // 文档类
    pdf: '#dc2626',    // 红色
    doc: '#2563eb',    // 蓝色
    docx: '#2563eb',   // 蓝色
    txt: '#64748b',    // 灰色
    rtf: '#64748b',    // 灰色
    md: '#64748b',     // 灰色
    
    // 表格类
    xls: '#16a34a',    // 绿色
    xlsx: '#16a34a',   // 绿色
    csv: '#16a34a',    // 绿色
    
    // 演示文稿类
    ppt: '#f97316',    // 橙色
    pptx: '#f97316',   // 橙色
    
    // 图片类
    jpg: '#8b5cf6',    // 紫色
    jpeg: '#8b5cf6',   // 紫色
    png: '#8b5cf6',    // 紫色
    gif: '#8b5cf6',    // 紫色
    svg: '#8b5cf6',    // 紫色
    webp: '#8b5cf6',   // 紫色
    
    // 压缩包类
    zip: '#ca8a04',    // 黄色
    rar: '#ca8a04',    // 黄色
    '7z': '#ca8a04',   // 黄色
    tar: '#ca8a04',    // 黄色
    gz: '#ca8a04',     // 黄色
    
    // 代码类
    js: '#f59e0b',     // 黄色
    jsx: '#f59e0b',    // 黄色
    ts: '#3b82f6',     // 蓝色
    tsx: '#3b82f6',    // 蓝色
    html: '#ef4444',   // 红色
    css: '#3b82f6',    // 蓝色
    scss: '#ec4899',   // 粉色
    sass: '#ec4899',   // 粉色
    json: '#fbbf24',   // 黄色
    xml: '#fbbf24',    // 黄色
    
    // 音频类
    mp3: '#ec4899',    // 粉色
    wav: '#ec4899',    // 粉色
    flac: '#ec4899',   // 粉色
    m4a: '#ec4899',    // 粉色
    
    // 视频类
    mp4: '#0ea5e9',    // 天蓝色
    avi: '#0ea5e9',    // 天蓝色
    mov: '#0ea5e9',    // 天蓝色
    mkv: '#0ea5e9',    // 天蓝色
    webm: '#0ea5e9',   // 天蓝色
    
    // 默认
    default: '#64748b' // 灰色
  };

  // 定义图标映射
  const iconMap = {
    // 文档类
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📄',
    rtf: '📄',
    md: '📄',
    
    // 表格类
    xls: '📊',
    xlsx: '📊',
    csv: '📊',
    
    // 演示文稿类
    ppt: '📽️',
    pptx: '📽️',
    
    // 图片类
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    webp: '🖼️',
    
    // 压缩包类
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',
    
    // 代码类
    js: '⚡',
    jsx: '⚛️',
    ts: '📝',
    tsx: '⚛️',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',
    json: '📋',
    xml: '📋',
    
    // 音频类
    mp3: '🎵',
    wav: '🎵',
    flac: '🎵',
    m4a: '🎵',
    
    // 视频类
    mp4: '🎬',
    avi: '🎬',
    mov: '🎬',
    mkv: '🎬',
    webm: '🎬',
    
    // 默认
    default: '📄' // 更改为文档图标
  };

  const ext = getFileExtension(filename);
  const color = colorMap[ext] || colorMap.default;
  const icon = iconMap[ext] || iconMap.default;

  return (
    <span 
      className="file-icon-component" 
      style={{
        fontSize: size,
        color: color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {icon}
    </span>
  );
};

export default FileIcon;