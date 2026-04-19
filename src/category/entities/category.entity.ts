import { Prisma } from '@prisma/client';

export type Category = Prisma.CategoryGetPayload<Record<string, never>>;
