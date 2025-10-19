import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...classes: string[]) => twMerge(clsx(classes))