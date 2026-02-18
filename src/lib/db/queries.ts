import sql from './client'

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
    const rows = await sql`
        SELECT * FROM public.profiles WHERE id = ${userId} LIMIT 1
    `
    return rows[0] ?? null
}

export async function upsertProfile(profile: {
    id: string
    email?: string
    name?: string
    phone?: string
    university_id?: string
    university_name?: string
    university_short_name?: string
    avatar_url?: string
    biography?: string
    year?: number
}) {
    const rows = await sql`
        INSERT INTO public.profiles ${sql(profile)}
        ON CONFLICT (id) DO UPDATE SET ${sql(profile)}, updated_at = now()
        RETURNING *
    `
    return rows[0]
}

export async function updateProfile(userId: string, updates: Record<string, any>) {
    const rows = await sql`
        UPDATE public.profiles
        SET ${sql(updates)}, updated_at = now()
        WHERE id = ${userId}
        RETURNING *
    `
    return rows[0]
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(options: {
    limit?: number
    offset?: number
    userId?: string
    category?: string
    type?: string
    campus?: string
    search?: string
} = {}) {
    const { limit = 20, offset = 0, userId, category, type, campus, search } = options

    const rows = await sql`
        SELECT p.*, pr.name as "sellerName", pr.avatar_url as "sellerAvatar", pr.university_name as "sellerUniversity"
        FROM public.posts p
        LEFT JOIN public.profiles pr ON p.user_id = pr.id
        WHERE 1=1
        ${userId ? sql`AND p.user_id = ${userId}` : sql``}
        ${category ? sql`AND p.category = ${category}` : sql``}
        ${type ? sql`AND p.type = ${type}` : sql``}
        ${campus ? sql`AND p.campus = ${campus}` : sql``}
        ${search ? sql`AND (p.title ILIKE ${'%' + search + '%'} OR p.description ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `
    return rows
}

export async function getPost(postId: string) {
    const rows = await sql`
        SELECT p.*, pr.name as "sellerName", pr.avatar_url as "sellerAvatar", pr.university_name as "sellerUniversity"
        FROM public.posts p
        LEFT JOIN public.profiles pr ON p.user_id = pr.id
        WHERE p.id = ${postId}
        LIMIT 1
    `
    return rows[0] ?? null
}

export async function createPost(post: Record<string, any>) {
    const rows = await sql`
        INSERT INTO public.posts ${sql(post)}
        RETURNING *
    `
    return rows[0]
}

export async function updatePost(postId: string, updates: Record<string, any>) {
    const rows = await sql`
        UPDATE public.posts
        SET ${sql(updates)}, updated_at = now()
        WHERE id = ${postId}
        RETURNING *
    `
    return rows[0]
}

export async function deletePost(postId: string) {
    await sql`DELETE FROM public.posts WHERE id = ${postId}`
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(options: { buyerId?: string; sellerId?: string } = {}) {
    const { buyerId, sellerId } = options
    const rows = await sql`
        SELECT o.*,
            seller.name as "sellerName", seller.avatar_url as "sellerAvatar",
            buyer.name as "buyerName",
            p.title as "postTitle", p.images as "postImages", p.price as "postPrice"
        FROM public.orders o
        LEFT JOIN public.profiles seller ON o.seller_id = seller.id
        LEFT JOIN public.profiles buyer ON o.buyer_id = buyer.id
        LEFT JOIN public.posts p ON o.post_id = p.id
        WHERE 1=1
        ${buyerId ? sql`AND o.buyer_id = ${buyerId}` : sql``}
        ${sellerId ? sql`AND o.seller_id = ${sellerId}` : sql``}
        ORDER BY o.created_at DESC
    `
    return rows
}

export async function getOrder(orderId: string) {
    const rows = await sql`
        SELECT o.*,
            seller.name as "sellerName", seller.avatar_url as "sellerAvatar", seller.university_name as "sellerUniversity",
            buyer.name as "buyerName",
            p.title as "postTitle", p.images as "postImages", p.price as "postPrice"
        FROM public.orders o
        LEFT JOIN public.profiles seller ON o.seller_id = seller.id
        LEFT JOIN public.profiles buyer ON o.buyer_id = buyer.id
        LEFT JOIN public.posts p ON o.post_id = p.id
        WHERE o.id = ${orderId}
        LIMIT 1
    `
    return rows[0] ?? null
}

export async function createOrder(order: Record<string, any>) {
    const rows = await sql`
        INSERT INTO public.orders ${sql(order)}
        RETURNING *
    `
    return rows[0]
}

export async function updateOrderStatus(orderId: string, status: string) {
    const rows = await sql`
        UPDATE public.orders SET status = ${status} WHERE id = ${orderId} RETURNING *
    `
    return rows[0]
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export async function toggleLike(userId: string, postId: string) {
    const existing = await sql`
        SELECT id FROM public.likes WHERE user_id = ${userId} AND post_id = ${postId}
    `
    if (existing.length > 0) {
        await sql`DELETE FROM public.likes WHERE user_id = ${userId} AND post_id = ${postId}`
        await sql`UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ${postId}`
        return { liked: false }
    } else {
        await sql`INSERT INTO public.likes (user_id, post_id) VALUES (${userId}, ${postId})`
        await sql`UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = ${postId}`
        return { liked: true }
    }
}

export async function getLikedPosts(userId: string) {
    const rows = await sql`
        SELECT p.* FROM public.posts p
        INNER JOIN public.likes l ON p.id = l.post_id
        WHERE l.user_id = ${userId}
        ORDER BY l.created_at DESC
    `
    return rows
}

// ─── Saved Posts ──────────────────────────────────────────────────────────────

export async function toggleSave(userId: string, postId: string) {
    const existing = await sql`
        SELECT id FROM public.saved_posts WHERE user_id = ${userId} AND post_id = ${postId}
    `
    if (existing.length > 0) {
        await sql`DELETE FROM public.saved_posts WHERE user_id = ${userId} AND post_id = ${postId}`
        return { saved: false }
    } else {
        await sql`INSERT INTO public.saved_posts (user_id, post_id) VALUES (${userId}, ${postId})`
        return { saved: true }
    }
}

export async function getSavedPosts(userId: string) {
    const rows = await sql`
        SELECT p.* FROM public.posts p
        INNER JOIN public.saved_posts sp ON p.id = sp.post_id
        WHERE sp.user_id = ${userId}
        ORDER BY sp.created_at DESC
    `
    return rows
}
