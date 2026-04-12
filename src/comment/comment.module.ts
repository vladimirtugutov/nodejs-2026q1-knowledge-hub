import { Module, forwardRef } from '@nestjs/common'
import { CommentController } from './comment.controller'
import { CommentService } from './comment.service'
import { CommentRepository } from './comment.repository'
import { ArticleModule } from '../article/article.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule, forwardRef(() => ArticleModule)],
  controllers: [CommentController],
  providers: [CommentService, CommentRepository],
  exports: [CommentService],
})
export class CommentModule {}