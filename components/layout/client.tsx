import * as Pages from '@/components/page'
import { hydrateRoot } from 'react-dom/client'
import { Header } from './header'
import { ToastProvider } from '../ui/toast'
import { TooltipProvider } from '../ui/tooltip'

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
                <TooltipProvider delayDuration={500} skipDelayDuration={200}>
                    <Header />
                    <main id='main-content'>
                        <PageComponent />
                    </main>
                </TooltipProvider>
            </ToastProvider>,
        )
    }
}
