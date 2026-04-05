import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ArticleRepository } from './article.repository';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { Article } from './entities/article.entity';
import { CommentService } from '../comment/comment.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { sortItems } from '../common/utils/sort.util';

@Injectable()
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  async findAll(
    query?: QueryArticleDto,
  ): Promise<
    Article[] | PaginatedResponseDto<Article>
  > {
    let articles = await this.articleRepository.findAll();

    if (query?.status) {
      articles = articles.filter((article) => article.status === query.status);
    }

    if (query?.categoryId) {
      articles = articles.filter(
        (article) => article.categoryId === query.categoryId,
      );
    }

    if (query?.tag) {
      articles = articles.filter((article) =>
        article.tags.includes(query.tag),
      );
    }

    const allowedSortFields = ['title', 'status', 'createdAt', 'updatedAt'];
    if (query?.sortBy && allowedSortFields.includes(query.sortBy)) {
      articles = sortItems(articles, query.sortBy, query.order ?? 'asc');
    }

    if (!query?.page && !query?.limit) {
      return articles;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const total = articles.length;
    const skip = (page - 1) * limit;
    const data = articles.slice(skip, skip + limit);

    return { total, page, limit, data };
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne(id);

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return article;
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    return this.articleRepository.create({
      title: createArticleDto.title,
      content: createArticleDto.content,
      status: createArticleDto.status ?? 'draft',
      authorId: createArticleDto.authorId ?? null,
      categoryId: createArticleDto.categoryId ?? null,
      tags: createArticleDto.tags ?? [],
    });
  }

  async update(id: string, updateArticleDto: UpdateArticleDto): Promise<Article> {
    const article = await this.articleRepository.findOne(id);

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    const updatedArticle = await this.articleRepository.update(id, {
      ...updateArticleDto,
    });

    if (!updatedArticle) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return updatedArticle;
  }

  async remove(id: string): Promise<void> {
    const article = await this.articleRepository.findOne(id);

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    await this.commentService.deleteByArticleId(id);
    await this.articleRepository.remove(id);
  }

  async nullifyAuthorByUserId(userId: string): Promise<void> {
    const articles = await this.articleRepository.findAll();
    const relatedArticles = articles.filter((article) => article.authorId === userId);

    await Promise.all(
      relatedArticles.map((article) =>
        this.articleRepository.update(article.id, { authorId: null }),
      ),
    );
  }

  async nullifyCategoryByCategoryId(categoryId: string): Promise<void> {
    const articles = await this.articleRepository.findAll();
    const relatedArticles = articles.filter(
      (article) => article.categoryId === categoryId,
    );

    await Promise.all(
      relatedArticles.map((article) =>
        this.articleRepository.update(article.id, { categoryId: null }),
      ),
    );
  }

  async exists(id: string): Promise<boolean> {
    const article = await this.articleRepository.findOne(id);
    return Boolean(article);
  }
}