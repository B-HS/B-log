import { hydrateRoot } from 'react-dom/client'
import * as Pages from '@/components/page'
import { Header } from './header'

declare global {
    interface Window {
        __PAGE__: string
    }
}

const root = document.getElementById('root')

if (root && window.__PAGE__) {
    const pageName = window.__PAGE__.charAt(0).toUpperCase() + window.__PAGE__.slice(1)
    const PageComponent = Pages[pageName as keyof typeof Pages]

    if (PageComponent) {
        hydrateRoot(
            root,
            <>
                <Header />
                <PageComponent />
            </>,
        )
    }
}
