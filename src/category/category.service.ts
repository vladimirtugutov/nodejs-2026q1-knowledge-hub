import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { ArticleService } from '../article/article.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { sortItems } from '../common/utils/sort.util';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  async findAll(
    query?: PaginationDto & { sortBy?: string; order?: 'asc' | 'desc' },
  ): Promise<Category[] | PaginatedResponseDto<Category>> {
    let categories = await this.categoryRepository.findAll();

    const allowedSortFields = ['name', 'description'];
    if (query?.sortBy && allowedSortFields.includes(query.sortBy)) {
      categories = sortItems(categories, query.sortBy, query.order ?? 'asc');
    }

    if (!query?.page && !query?.limit) {
      return categories;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const total = categories.length;
    const skip = (page - 1) * limit;
    const data = categories.slice(skip, skip + limit);

    return { total, page, limit, data };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne(id);

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoryRepository.create(createCategoryDto);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne(id);

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const updatedCategory = await this.categoryRepository.update(
      id,
      updateCategoryDto,
    );

    if (!updatedCategory) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return updatedCategory;
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne(id);

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    await this.articleService.nullifyCategoryByCategoryId(id);
    await this.categoryRepository.remove(id);
  }
}
