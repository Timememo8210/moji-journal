# 个人日记App — 产品需求文档 (PRD)

## 项目名称
暂定：**Moji** (墨记)

## 目标用户
晓波个人使用，私密日记

## 核心功能

### MVP (第一版)
1. **写日记** — 富文本编辑，支持标题、正文
2. **上传照片** — 多张图片附加到日记
3. **时间线浏览** — 卡片式列表，按日期倒序
4. **单篇查看** — 全屏阅读模式
5. **数据导出** — JSON/Markdown格式备份

### 第二版
6. **语音输入** — Web Speech API，中英文
7. **AI整理** — 一键润色/结构化凌乱文字
8. **AI生成配图** — Gemini Pro生图，无照片时自动生成
9. **音乐附件** — 嵌入音乐链接或上传音频
10. **搜索** — 全文搜索日记内容

### 未来
11. **月度/年度AI总结**
12. **"那年今日"回顾**
13. **标签/分类**
14. **暗色模式**

## 设计风格
- **黑白极简 + 卡片式布局**
- Day One的照片突出卡片时间线 + Notion的黑白克制配色
- 大量留白，高端杂志感
- 点缀色：深金或淡蓝（极少量）
- 字体：无衬线，现代感（Inter / Noto Sans SC）
- 响应式：手机优先，电脑也适配

## 技术架构

### 前端
- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS** (样式)
- **Framer Motion** (动画)
- 部署：**Vercel** (免费，全球CDN)

### 后端 & 数据
- **Supabase**
  - PostgreSQL 数据库
  - Auth (邮箱登录，单用户)
  - Storage (图片/音频存储)
  - 免费tier: 500MB数据库, 1GB存储

### AI
- 文字整理：Claude API (已有key)
- 语音转文字：Web Speech API (浏览器内置，免费)
- 生成配图：Gemini Pro (已有订阅)

## 数据模型

```sql
-- 日记表
entries (
  id uuid PK,
  title text,
  content text,        -- 日记正文(Markdown)
  raw_content text,    -- 原始输入(AI整理前)
  mood text,           -- 心情标签
  created_at timestamp,
  updated_at timestamp
)

-- 媒体附件
media (
  id uuid PK,
  entry_id uuid FK,
  type text,           -- image/audio
  url text,            -- Supabase Storage URL
  caption text,
  position int,        -- 排序
  created_at timestamp
)
```

## 数据导出
- 一键导出所有日记为 JSON 或 Markdown+图片 ZIP
- 随时可备份，数据完全属于用户
