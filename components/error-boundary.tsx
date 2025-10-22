import { Component, type ReactNode, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    resetError = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.resetError)
            }

            return (
                <div className='flex flex-col items-center justify-center min-h-[400px] p-8'>
                    <div className='max-w-md text-center space-y-4'>
                        <h2 className='text-2xl font-bold text-destructive'>문제가 발생했습니다</h2>
                        <p className='text-muted-foreground'>페이지를 표시하는 중에 오류가 발생했습니다.</p>
                        <button
                            onClick={this.resetError}
                            className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'>
                            다시 시도
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
