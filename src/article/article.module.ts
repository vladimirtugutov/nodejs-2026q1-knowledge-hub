import { Module, forwardRef } from '@nestjs/common'
import { ArticleController } from './article.controller'
import { ArticleService } from './article.service'
import { ArticleRepository } from './article.repository'
import { CommentModule } from '../comment/comment.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule, forwardRef(() => CommentModule)],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleRepository],
  exports: [ArticleService],
})
export class ArticleModule {}