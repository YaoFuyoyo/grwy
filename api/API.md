# API 接口文档

## 基础信息
- 平台：Laf 云开发 (Sealos)
- 应用ID：fuax8z452l
- 基础地址：https://fuax8z452l.sealoshzh.site

## 接口列表

### 1. register - 创建用户
- 地址：POST /register
- 功能：注册用户信息，生成6位自增序号
- 请求参数：
  - subdomain (string): 姓名缩写，如 "wzw"
  - name (string): 真实姓名
  - title (string): 职位/头衔
  - bio (string): 个人简介
  - email (string): 邮箱
  - phone (string): 电话
  - resumeUrl (string): 简历 base64 URL
  - resumeFilename (string): 简历原始文件名
  - portfolioUrls (array): 作品集 base64 URL 数组
  - templateId (string): 模板ID，如 "template1"
- 响应：{ok: true, url: "https://grwy.zzyy99.cn/wzw/000001"}

### 2. upload - 文件上传
- 地址：POST /upload
- 功能：上传文件，返回 base64 data URL
- 请求：multipart/form-data，file 字段
- 响应：{ok: true, url: "data:application/pdf;base64,..."}

### 3. getPage - 渲染页面
- 地址：GET /getPage
- 功能：根据用户ID渲染个人主页HTML
- 查询参数：
  - subdomain (string): 姓名缩写
  - userId (string): 6位自增序号，如 "000001"
- 响应：HTML 字符串

## 数据库集合
- users: 用户信息
  - subdomain, userId, name, title, bio, email, phone, resumeUrl, resumeFilename, portfolioUrls, templateId, createdAt
- counters: 自增序号计数器
  - name: "user_id", value: number

## 模板列表
- template1: 极简白
- template2: 深色科技
- template3: 卡片暖色