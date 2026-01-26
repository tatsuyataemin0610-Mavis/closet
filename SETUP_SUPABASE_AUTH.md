# Supabase 认证 + 数据库设置指南

## 第 1 步：创建 Supabase 项目（免费）

1. 前往 https://supabase.com/
2. 点击「Start your project」→ 用邮箱注册（不用 Google 账号也可以）
3. 创建新项目：
   - **Project name**: closet-app
   - **Database Password**: 设一个强密码（记下来）
   - **Region**: Northeast Asia (Tokyo) - 最接近台湾
   - 点击「Create new project」（等 1-2 分钟）

## 第 2 步：创建数据表

1. 在 Supabase 控制台，点左侧「Table Editor」
2. 点击「Create a new table」，创建 `clothes` 表：

```sql
-- 复制下面这段 SQL，贴到 SQL Editor 执行

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- 创建 clothes 表
create table clothes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text,
  category text,
  color text,
  brand text,
  size text,
  material text,
  occasion text,
  price numeric,
  purchase_date date,
  seasons text,
  notes text,
  image_url text,
  image_processed_url text,
  care_label_url text,
  brand_label_url text,
  back_view_url text,
  material_photo_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 创建 drawers 表（抽屉分类）
create table drawers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 创建 outfits 表（穿搭）
create table outfits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  cloth_ids uuid[] not null,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 创建 user_profiles 表（使用者档案）
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 启用 Row Level Security (RLS)
alter table clothes enable row level security;
alter table drawers enable row level security;
alter table outfits enable row level security;
alter table user_profiles enable row level security;

-- 创建政策：使用者只能看到自己的数据
create policy "Users can view their own clothes"
  on clothes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own clothes"
  on clothes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clothes"
  on clothes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own clothes"
  on clothes for delete
  using (auth.uid() = user_id);

-- Drawers 政策
create policy "Users can view their own drawers"
  on drawers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own drawers"
  on drawers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own drawers"
  on drawers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own drawers"
  on drawers for delete
  using (auth.uid() = user_id);

-- Outfits 政策
create policy "Users can view their own outfits"
  on outfits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outfits"
  on outfits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outfits"
  on outfits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outfits"
  on outfits for delete
  using (auth.uid() = user_id);

-- User Profiles 政策
create policy "Users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- 创建 Storage bucket（图片存储）
insert into storage.buckets (id, name, public) values ('clothes-images', 'clothes-images', true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Storage 政策：使用者只能上传/查看自己的图片
create policy "Users can upload their own images"
  on storage.objects for insert
  with check (bucket_id = 'clothes-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own images"
  on storage.objects for update
  using (bucket_id = 'clothes-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own images"
  on storage.objects for delete
  using (bucket_id = 'clothes-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view public images"
  on storage.objects for select
  using (bucket_id = 'clothes-images');

-- Avatars storage 政策
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
```

## 第 3 步：设置邮箱认证（独立帐号密码）

1. 在 Supabase 控制台，点左侧「Authentication」→「Providers」
2. 找到「Email」，确认已启用
3. 关闭不需要的第三方登入（Google、GitHub 等）
4. **重要**：在「Email Templates」里可以自定义注册/重设密码的邮件内容

## 第 4 步：取得 API 密钥

1. 点左侧「Project Settings」→「API」
2. 复制下面两个值：
   - **Project URL** (例如：https://xxxxx.supabase.co)
   - **anon public** key（一串很长的字）

## 第 5 步：设置环境变量

在你的项目根目录 `.env.local` 加上：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=你的 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon public key

# OpenAI (你原本就有的)
OPENAI_API_KEY=你的key
```

---

## 完成！接下来我会帮你：

1. ✅ 安装 Supabase 客户端
2. ✅ 创建登入/注册页面
3. ✅ 改写 API 连接到 Supabase
4. ✅ 部署到 Vercel（让手机能用）
