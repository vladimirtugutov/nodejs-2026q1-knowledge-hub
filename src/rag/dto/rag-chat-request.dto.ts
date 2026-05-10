import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RagChatRequestDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  conversationId?: string;
}
