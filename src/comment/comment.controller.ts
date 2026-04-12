import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'
import { CommentService } from './comment.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { QueryCommentDto } from './dto/query-comment.dto'

@ApiTags('comment')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Get comments by articleId' })
  @ApiOkResponse({ description: 'Comments retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid query params' })
  @ApiQuery({ name: 'articleId', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByArticleId(@Query() query: QueryCommentDto) {
    return this.commentService.findByArticleId(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by id' })
  @ApiOkResponse({ description: 'Comment retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: 'Create comment' })
  @ApiCreatedResponse({ description: 'Comment created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnprocessableEntityResponse({
    description: 'Referenced article does not exist',
  })
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(createCommentDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment' })
  @ApiNoContentResponse({ description: 'Comment deleted successfully' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.commentService.remove(id)
  }
}