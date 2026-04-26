import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.comment.deleteMany()
    await tx.article.updateMany({
      data: { authorId: null, categoryId: null },
    })
    await tx.article.deleteMany()
    await tx.tag.deleteMany()
    await tx.category.deleteMany()
    await tx.user.deleteMany()

    await tx.user.createMany({
      data: [
        { id: 'user1', login: 'admin', password: 'admin123', role: 'admin' },
        { id: 'user2', login: 'editor1', password: 'editor123', role: 'editor' },
        { id: 'user3', login: 'editor2', password: 'editor123', role: 'editor' },
        { id: 'user4', login: 'viewer1', password: 'viewer123', role: 'viewer' },
        { id: 'user5', login: 'viewer2', password: 'viewer123', role: 'viewer' },
      ],
    })

    await tx.category.createMany({
      data: [
        { id: 'cat1', name: 'Node.js', description: 'Backend development' },
        { id: 'cat2', name: 'NestJS', description: 'Node.js framework' },
        { id: 'cat3', name: 'TypeScript', description: 'Typed JavaScript' },
        { id: 'cat4', name: 'Database', description: 'PostgreSQL, Prisma' },
        { id: 'cat5', name: 'DevOps', description: 'Docker, CI/CD' },
      ],
    })

    await tx.tag.createMany({
      data: [
        { id: 'tag1', name: 'nestjs' },
        { id: 'tag2', name: 'nodejs' },
        { id: 'tag3', name: 'typescript' },
        { id: 'tag4', name: 'prisma' },
        { id: 'tag5', name: 'postgres' },
        { id: 'tag6', name: 'docker' },
        { id: 'tag7', name: 'tutorial' },
        { id: 'tag8', name: 'guide' },
        { id: 'tag9', name: 'advanced' },
        { id: 'tag10', name: 'beginner' },
        { id: 'tag11', name: 'devops' },
      ],
    })

    await tx.article.createMany({
      data: [
        {
          id: 'art1',
          title: 'NestJS Basics',
          content: 'Complete guide to NestJS fundamentals...',
          status: 'PUBLISHED',
          authorId: 'user2',
          categoryId: 'cat2',
        },
        {
          id: 'art2',
          title: 'Node.js Performance',
          content: 'Optimizing Node.js applications...',
          status: 'PUBLISHED',
          authorId: 'user3',
          categoryId: 'cat1',
        },
        {
          id: 'art3',
          title: 'TypeScript Deep Dive',
          content: 'Advanced TypeScript patterns...',
          status: 'DRAFT',
          authorId: 'user2',
          categoryId: 'cat3',
        },
        {
          id: 'art4',
          title: 'Prisma with NestJS',
          content: 'Fullstack Prisma + NestJS tutorial...',
          status: 'PUBLISHED',
          authorId: 'user3',
          categoryId: 'cat4',
        },
        {
          id: 'art5',
          title: 'Docker Multi-stage Builds',
          content: 'Production Docker images for Node.js...',
          status: 'PUBLISHED',
          authorId: 'user1',
          categoryId: 'cat5',
        },
        {
          id: 'art6',
          title: 'PostgreSQL Optimization',
          content: 'Indexing and query optimization...',
          status: 'PUBLISHED',
          authorId: 'user4',
          categoryId: 'cat4',
        },
        {
          id: 'art7',
          title: 'NestJS Guards & Interceptors',
          content: 'Advanced middleware patterns...',
          status: 'DRAFT',
          authorId: 'user3',
          categoryId: 'cat2',
        },
        {
          id: 'art8',
          title: 'JWT Authentication',
          content: 'Secure API with JWT...',
          status: 'PUBLISHED',
          authorId: 'user2',
          categoryId: 'cat2',
        },
        {
          id: 'art9',
          title: 'Microservices with NestJS',
          content: 'Building scalable microservices...',
          status: 'ARCHIVED',
          authorId: 'user1',
          categoryId: 'cat2',
        },
        {
          id: 'art10',
          title: 'Prisma Raw Queries',
          content: 'When to use raw SQL with Prisma...',
          status: 'PUBLISHED',
          authorId: 'user3',
          categoryId: 'cat4',
        },
      ],
    })

    await tx.article.update({
      where: { id: 'art1' },
      data: {
        tags: {
          connect: [{ name: 'nestjs' }, { name: 'tutorial' }],
        },
      },
    })

    await tx.article.update({
      where: { id: 'art2' },
      data: {
        tags: {
          connect: [{ name: 'nodejs' }, { name: 'advanced' }],
        },
      },
    })

    await tx.article.update({
      where: { id: 'art4' },
      data: {
        tags: {
          connect: [{ name: 'prisma' }, { name: 'nestjs' }],
        },
      },
    })

    await tx.article.update({
      where: { id: 'art5' },
      data: {
        tags: {
          connect: [{ name: 'docker' }, { name: 'devops' }],
        },
      },
    })

    await tx.comment.createMany({
      data: [
        {
          id: 'comm1',
          content: 'Great article! Thanks for sharing.',
          articleId: 'art1',
          authorId: 'user4',
        },
        {
          id: 'comm2',
          content: 'Can you add more examples?',
          articleId: 'art1',
          authorId: 'user5',
        },
        {
          id: 'comm3',
          content: 'Performance tips are very useful!',
          articleId: 'art2',
          authorId: 'user4',
        },
      ],
    })
  })

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })