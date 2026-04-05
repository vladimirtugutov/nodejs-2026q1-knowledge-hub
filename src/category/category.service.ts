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

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.findAll();
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

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
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