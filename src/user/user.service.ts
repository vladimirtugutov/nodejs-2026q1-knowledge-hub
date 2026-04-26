import { Inject, Injectable, forwardRef } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';
import { ConflictError } from '../common/errors/conflict.error';
import { ForbiddenError } from '../common/errors/forbidden.error';
import { NotFoundError } from '../common/errors/not-found.error';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { sortItems } from '../common/utils/sort.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserResponse } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { excludePassword } from './utils/user.utils';

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
    let sanitizedUsers = users.map(excludePassword);

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
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return excludePassword(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const existingUsers = await this.userRepository.findAll();
    const loginTaken = existingUsers.some(
      (user) => user.login === createUserDto.login,
    );

    if (loginTaken) {
      throw new ConflictError(
        `User with login ${createUserDto.login} already exists`,
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.userRepository.create({
      login: createUserDto.login,
      password: hashedPassword,
      role: createUserDto.role,
    } as never);

    return excludePassword(user);
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    const isOldPasswordValid = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new ForbiddenError('Old password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);

    const updatedUser = await this.userRepository.update(id, {
      password: hashedPassword,
    });

    if (!updatedUser) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return excludePassword(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    await this.articleService.nullifyAuthorByUserId(id);
    await this.commentService.deleteByAuthorId(id);

    await this.userRepository.remove(id);
  }
}
