import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { Comment } from './entities/comment.entity';
import { ArticleService } from '../article/article.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  async findByArticleId(
    query: QueryCommentDto,
  ): Promise<
    Comment[] | { total: number; page: number; limit: number; data: Comment[] }
  > {
    let comments = await this.commentRepository.findAll();
    comments = comments.filter((comment) => comment.articleId === query.articleId);

    if (!query.page && !query.limit) {
      return comments;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const total = comments.length;
    const skip = (page - 1) * limit;
    const data = comments.slice(skip, skip + limit);

    return { total, page, limit, data };
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const articleExists = await this.articleService.exists(createCommentDto.articleId);

    if (!articleExists) {
      throw new UnprocessableEntityException(
        `Article with id ${createCommentDto.articleId} does not exist`,
      );
    }

    return this.commentRepository.create({
      content: createCommentDto.content,
      articleId: createCommentDto.articleId,
      authorId: createCommentDto.authorId ?? null,
    });
  }

  async remove(id: string): Promise<void> {
    const comment = await this.commentRepository.findOne(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    await this.commentRepository.remove(id);
  }

  async deleteByArticleId(articleId: string): Promise<void> {
    const comments = await this.commentRepository.findAll();
    const relatedIds = comments
      .filter((comment) => comment.articleId === articleId)
      .map((comment) => comment.id);

    await this.commentRepository.removeMany(relatedIds);
  }

  async deleteByAuthorId(authorId: string): Promise<void> {
    const comments = await this.commentRepository.findAll();
    const relatedIds = comments
      .filter((comment) => comment.authorId === authorId)
      .map((comment) => comment.id);

    await this.commentRepository.removeMany(relatedIds);
  }
}