import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]