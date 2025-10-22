import * as Pages from '@/components/page'
import { hydrateRoot } from 'react-dom/client'
import { Header } from './header'
import { ToastProvider } from '../ui/toast'

declare global {
    interface Window {
        __PAGE__: string
    }
}

const root = document.getElementById('root')

if (root && window.__PAGE__) {
    const PageComponent = Pages[window.__PAGE__ as keyof typeof Pages]

    if (PageComponent) {
        hydrateRoot(
            root,
            <ToastProvider>
                <Header />
                <PageComponent />
            </ToastProvider>,
        )
    }
}
