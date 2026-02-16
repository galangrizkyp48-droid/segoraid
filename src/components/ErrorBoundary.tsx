'use client'

import { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Error caught by boundary:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-4">😔</div>
                        <h1 className="text-2xl font-bold mb-2">Oops! Ada yang error</h1>
                        <p className="text-gray-600 mb-6">
                            Maaf, terjadi kesalahan. Silakan refresh halaman.
                        </p>
                        {this.state.error && (
                            <div className="bg-red-50 p-4 rounded text-left mb-6 overflow-auto max-h-40">
                                <p className="text-red-600 font-mono text-xs font-bold">{this.state.error.toString()}</p>
                                <p className="text-red-500 font-mono text-[10px] mt-2 whitespace-pre-wrap">{this.state.error.stack}</p>
                            </div>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-sky-600 text-white rounded-full font-semibold"
                        >
                            Refresh Halaman
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
