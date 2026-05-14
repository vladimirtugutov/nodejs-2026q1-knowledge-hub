import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RagChatRequestDto {
  @IsString()
  question!: string;

  @IsOptional()
  @IsUUID('4')
  conversationId?: string;
}
