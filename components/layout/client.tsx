import { hydrateRoot } from 'react-dom/client'
import { Home } from '@/components/page/home'

declare global {
    interface Window {
        __PAGE__: string
    }
}

const pages: Record<string, React.ComponentType> = {
    home: Home,
}

const root = document.getElementById('root')
if (root && pages[window.__PAGE__]) {
    const PageComponent = pages[window.__PAGE__]
    hydrateRoot(root, <PageComponent />)
}
