import { Prisma } from '@prisma/client'

export type Article = Prisma.ArticleGetPayload<{
  include: {
    author: true
    category: true
    tags: true
    comments: true
  }
}>