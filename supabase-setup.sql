-- Supabase 数据库设置 SQL
-- 直接复制这整个文件的内容，贴到 SQL Editor 执行

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
  cloth_ids uuid[],
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

-- Clothes 表政策：使用者只能看到自己的数据
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
insert into storage.buckets (id, name, public) 
values ('clothes-images', 'clothes-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

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
