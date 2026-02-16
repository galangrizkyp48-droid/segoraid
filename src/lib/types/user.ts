// User Types
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    coverPhoto: string | null;
    bio: string;
    university: {
        id: string;
        name: string;
        shortName: string;
        logo: string;
    };
    year: number | null;
    location: string;
    socialMedia: {
        instagram?: string;
        linkedin?: string;
    };
    stats: {
        postsCount: number;
        followersCount: number;
        followingCount: number;
    };
    sellerStats?: {
        rating: number;
        totalReviews: number;
        totalSold: number;
        responseRate: number;
        avgResponseTime: number;
    };
    createdAt: Date;
}

// Post Types
// Post Types (Supabase compatible)
export interface Post {
    id: string;
    user_id: string;
    type: 'product' | 'service' | 'info';
    title: string;
    description: string;
    category: string;
    images: string[];
    price: number;
    price_type?: 'fixed' | 'starting' | 'negotiable' | 'free';
    negotiable: boolean;
    condition?: 'new' | 'like_new' | 'good' | 'fair';
    stock?: number;
    campus?: string;
    location_detail?: string;

    // Relations
    profiles?: {
        name: string;
        avatar_url: string | null;
        university_name: string;
    };

    // Derived/Joined for compatibility (optional)
    sellerName?: string;
    sellerAvatar?: string;
    sellerUniversity?: string;

    hashtags?: string[];
    tags?: string[];

    // Stats
    views_count?: number;
    likes_count?: number;
    comments_count?: number;
    shares_count?: number;

    // Legacy mapping (optional, for transition)
    stats?: {
        likes: number;
        comments: number;
        shares: number;
        views: number;
    };

    created_at: string; // Supabase returns ISO string
}
