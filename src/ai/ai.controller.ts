@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai/article')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  @Post(':id/summarize')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  summarize(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    return this.aiService.summarize(id, dto);
  }
}