-- Segora DB Migration Script
-- Run as postgres superuser on segora_db

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Auth schema (Supabase compatibility layer)
CREATE SCHEMA IF NOT EXISTS auth;

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS public.saved_posts CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;

-- 1. auth.users (base table for FK references)
CREATE TABLE auth.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text UNIQUE,
    encrypted_password text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT auth_users_pkey PRIMARY KEY (id)
);

-- 2. profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    name text,
    phone text,
    university_id text,
    university_name text,
    university_short_name text,
    avatar_url text,
    biography text,
    year integer,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. posts
CREATE TABLE public.posts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    price numeric DEFAULT 0,
    price_type text,
    negotiable boolean DEFAULT false,
    condition text,
    stock integer DEFAULT 1,
    weight integer DEFAULT 0,
    duration text,
    service_type text,
    images text[] DEFAULT ARRAY[]::text[],
    campus text,
    location_detail text,
    shipping_methods text[],
    tags text[],
    hashtags text[],
    visible_to text DEFAULT 'all',
    views_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT posts_pkey PRIMARY KEY (id),
    CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 4. likes
CREATE TABLE public.likes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT likes_pkey PRIMARY KEY (id),
    CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE
);

-- 5. orders
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    post_id uuid NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    total_price integer NOT NULL,
    status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','cod_waiting','paid','completed','cancelled'])),
    payment_method text NOT NULL,
    delivery_method text NOT NULL,
    location_meetup text,
    notes text,
    snapshot_title text,
    snapshot_price integer,
    snapshot_image text,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id),
    CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id),
    CONSTRAINT orders_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);

-- 6. saved_posts
CREATE TABLE public.saved_posts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT saved_posts_pkey PRIMARY KEY (id),
    CONSTRAINT saved_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT saved_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE
);

-- Grant privileges to segora_user
GRANT USAGE ON SCHEMA public TO segora_user;
GRANT USAGE ON SCHEMA auth TO segora_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO segora_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO segora_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO segora_user;

-- Verify
SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('public','auth') ORDER BY schemaname, tablename;
