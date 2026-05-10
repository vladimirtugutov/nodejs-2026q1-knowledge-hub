export class RagSearchResultItemDto {
  articleId!: string;
  articleTitle!: string;
  chunk!: string;
  similarity!: number;
}

export class RagSearchResponseDto {
  results!: RagSearchResultItemDto[];
}
