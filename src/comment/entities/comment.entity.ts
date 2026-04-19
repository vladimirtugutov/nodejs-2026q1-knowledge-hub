import { Prisma } from '@prisma/client';

export type Comment = Prisma.CommentGetPayload<Record<string, never>>;
