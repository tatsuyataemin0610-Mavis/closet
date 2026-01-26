# 部署指南：让手机也能用

## ✅ 目前已完成

1. ✅ 安装 Supabase 客户端套件
2. ✅ 创建认证系统（邮箱/密码登入）
3. ✅ 创建登入、注册、忘记密码页面
4. ✅ 创建路由保护中间件
5. ✅ 创建登出组件

## 🔄 你现在要做的（大约 10 分钟）

### 步骤 1：设置 Supabase（5 分钟）

请按照 `SETUP_SUPABASE_AUTH.md` 文件的步骤 1-4 操作：
1. 创建 Supabase 帐号
2. 创建新项目
3. 执行 SQL 创建数据表
4. 取得 API 密钥

### 步骤 2：设置环境变量（1 分钟）

在项目根目录的 `.env.local` 文件加上（如果没有这个文件就创建一个）：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=你的 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon public key

# OpenAI (你原本就有的)
OPENAI_API_KEY=你的key
```

### 步骤 3：重新启动开发服务器（1 分钟）

```bash
# 停止目前的服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

打开浏览器到 `http://localhost:3001`，你应该会看到登入页面。

### 步骤 4：测试注册和登入（2 分钟）

1. 点击「立即注册」
2. 输入邮箱和密码（密码至少 6 个字符）
3. 注册成功后会自动登入
4. 试着登出再登入

## 📱 部署到 Vercel（让手机能用）

当你测试成功后，就可以部署到网上了：

### 步骤 1：推送代码到 GitHub（如果还没有）

```bash
# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Add authentication system"

# 在 GitHub 创建一个新的 repository，然后：
git remote add origin https://github.com/你的用户名/closet.git
git push -u origin main
```

### 步骤 2：部署到 Vercel（免费）

1. 前往 https://vercel.com/
2. 用 GitHub 登入
3. 点击「Import Project」
4. 选择你的 closet repository
5. 在「Environment Variables」加上你的环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
6. 点击「Deploy」

### 步骤 3：用手机访问

部署完成后，Vercel 会给你一个网址，例如：
`https://closet-xxxxx.vercel.app`

用手机打开这个网址，就可以用了！

## 🎉 完成

现在你可以：
- ✅ 在任何设备（电脑/手机/平板）登入
- ✅ 数据在所有设备间同步
- ✅ 用独立的邮箱密码登入（不连动 Google）
- ✅ 重设密码功能

## ⚠️ 重要注意事项

1. **图片存储**：目前图片还是存在本地 `public/uploads`，部署到 Vercel 后上传的图片会丢失（因为 Vercel 是静态部署）。你需要：
   - 改用 Supabase Storage 存图片（我可以帮你改）
   - 或用 Cloudinary / Imgur 等图床

2. **数据迁移**：如果你本地已经有衣服数据（在 `data/closet.json`），需要手动迁移到 Supabase。我可以帮你写迁移脚本。

3. **成本**：
   - Vercel 免费版：无限流量
   - Supabase 免费版：500MB 数据库 + 1GB 图片存储（够用很久）

## 需要帮助？

如果遇到任何问题，告诉我：
1. 你卡在哪一步
2. 看到什么错误讯息
3. 截图（如果有的话）

我会立刻帮你解决！
