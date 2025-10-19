import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    plugins: [
        tailwindcss(),
        cloudflare(),
        ssrPlugin({
            entry: {
                target: ['server.ts', 'components/**/*.tsx', 'routes/**/*.tsx'],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
})
