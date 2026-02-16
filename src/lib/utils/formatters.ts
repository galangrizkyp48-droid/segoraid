export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price)
}

export const formatTimeAgo = (date: Date | any): string => {
    if (!date) return ''

    const now = new Date()
    const jsDate = date.toDate ? date.toDate() : new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - jsDate.getTime()) / 1000)

    if (diffInSeconds < 60) {
        return 'Baru saja'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
        return `${diffInMinutes} menit yang lalu`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `${diffInHours} jam yang lalu`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
        return `${diffInDays} hari yang lalu`
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(jsDate)
}

export const formatDate = (date: Date | any): string => {
    if (!date) return ''
    const jsDate = date.toDate ? date.toDate() : new Date(date)
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(jsDate)
}
