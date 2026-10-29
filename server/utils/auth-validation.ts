export const isValidEmail = (value: unknown): value is string => typeof value === 'string' && value.length <= 254 && /^\S+@\S+\.\S+$/.test(value)

export const isValidPassword = (value: unknown): value is string => typeof value === 'string' && value.length >= 8 && value.length <= 128
