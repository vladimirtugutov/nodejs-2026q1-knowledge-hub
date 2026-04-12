import { Prisma } from '@prisma/client'

export type User = Prisma.UserGetPayload<Record<string, never>>
export type UserResponse = Omit<User, 'password'>