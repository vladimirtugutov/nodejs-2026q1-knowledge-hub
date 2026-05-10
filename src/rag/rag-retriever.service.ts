import { Injectable } from '@nestjs/common';
import { RagSearchRequestDto } from './dto/rag-search-request.dto';
import { RagSearchResponseDto } from './dto/rag-search-response.dto';
import { VectorDbService } from './vector-db.service';

@Injectable()
export class RagRetrieverService {
  constructor(private readonly vectorDbService: VectorDbService) {}

  async search(_dto: RagSearchRequestDto): Promise<RagSearchResponseDto> {
    return {
      results: [],
    };
  }
}
