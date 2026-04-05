import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponse } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { sortItems } from '../common/utils/sort.util';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  async findAll(
    query?: PaginationDto & { sortBy?: string; order?: 'asc' | 'desc' },
  ): Promise<UserResponse[] | PaginatedResponseDto<UserResponse>> {
    const users = await this.userRepository.findAll();
    let sanitizedUsers = users.map(({ password, ...user }) => user);

    const allowedSortFields = ['login', 'role', 'createdAt', 'updatedAt'];
    if (query?.sortBy && allowedSortFields.includes(query.sortBy)) {
      sanitizedUsers = sortItems(
        sanitizedUsers,
        query.sortBy,
        query.order ?? 'asc',
      );
    }

    if (!query?.page && !query?.limit) {
      return sanitizedUsers;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const total = sanitizedUsers.length;
    const skip = (page - 1) * limit;
    const data = sanitizedUsers.slice(skip, skip + limit);

    return { total, page, limit, data };
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const { password, ...response } = user;
    return response;
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const user = await this.userRepository.create({
      login: createUserDto.login,
      password: createUserDto.password,
      role: createUserDto.role ?? 'viewer',
    });

    const { password, ...response } = user;
    return response;
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.password !== updatePasswordDto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const updatedUser = await this.userRepository.update(id, {
      password: updatePasswordDto.newPassword,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const { password, ...response } = updatedUser;
    return response;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.articleService.nullifyAuthorByUserId(id);
    await this.commentService.deleteByAuthorId(id);

    await this.userRepository.remove(id);
  }
}