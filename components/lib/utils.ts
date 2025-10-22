import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...classes: string[]) => twMerge(clsx(classes))

export const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}
