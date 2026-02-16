import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
    postId: string;
    sellerId: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    variant?: string;
    stock: number;
    shippingMethod?: string;
    notes?: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (postId: string) => void;
    updateQuantity: (postId: string, quantity: number) => void;
    updateShipping: (postId: string, method: string) => void;
    updateNotes: (postId: string, notes: string) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemsBySeller: () => Record<string, CartItem[]>;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                const items = get().items;
                const existingIndex = items.findIndex(i =>
                    i.postId === item.postId && i.variant === item.variant
                );

                if (existingIndex >= 0) {
                    // Update quantity
                    const newItems = [...items];
                    newItems[existingIndex].quantity += item.quantity;
                    set({ items: newItems });
                } else {
                    // Add new item
                    set({ items: [...items, item] });
                }
            },

            removeItem: (postId) => {
                set({ items: get().items.filter(item => item.postId !== postId) });
            },

            updateQuantity: (postId, quantity) => {
                set({
                    items: get().items.map(item =>
                        item.postId === postId ? { ...item, quantity } : item
                    )
                });
            },

            updateShipping: (postId, method) => {
                set({
                    items: get().items.map(item =>
                        item.postId === postId ? { ...item, shippingMethod: method } : item
                    )
                });
            },

            updateNotes: (postId, notes) => {
                set({
                    items: get().items.map(item =>
                        item.postId === postId ? { ...item, notes } : item
                    )
                });
            },

            clearCart: () => set({ items: [] }),

            getTotal: () => {
                return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            },

            getItemsBySeller: () => {
                const items = get().items;
                return items.reduce((acc, item) => {
                    if (!acc[item.sellerId]) {
                        acc[item.sellerId] = [];
                    }
                    acc[item.sellerId].push(item);
                    return acc;
                }, {} as Record<string, CartItem[]>);
            },
        }),
        {
            name: 'segora-cart',
            storage: createJSONStorage(() => {
                if (typeof window !== 'undefined') {
                    return localStorage
                }
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                }
            }),
        }
    )
);
