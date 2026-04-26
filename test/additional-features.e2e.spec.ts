import { StatusCodes } from 'http-status-codes';
import { request } from './lib';
import {
  getTokenAndUserId,
  shouldAuthorizationBeTested,
  removeTokenUser,
} from './utils';
import {
  usersRoutes,
  articlesRoutes,
  categoriesRoutes,
  commentsRoutes,
} from './endpoints';

describe('Additional features (e2e)', () => {
  const unauthorizedRequest = request;
  const commonHeaders: Record<string, string> = { Accept: 'application/json' };

  let mockUserId: string | undefined;
  const createdUserIds: string[] = [];
  const createdArticleIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdCommentIds: string[] = [];

  beforeAll(async () => {
    if (shouldAuthorizationBeTested) {
      const result = await getTokenAndUserId(unauthorizedRequest);
      commonHeaders['Authorization'] = result.token;
      mockUserId = result.mockUserId;
    }
  });

  afterAll(async () => {
    for (const commentId of createdCommentIds.reverse()) {
      await unauthorizedRequest
        .delete(commentsRoutes.delete(commentId))
        .set(commonHeaders);
    }

    for (const articleId of createdArticleIds.reverse()) {
      await unauthorizedRequest
        .delete(articlesRoutes.delete(articleId))
        .set(commonHeaders);
    }

    for (const categoryId of createdCategoryIds.reverse()) {
      await unauthorizedRequest
        .delete(categoriesRoutes.delete(categoryId))
        .set(commonHeaders);
    }

    for (const userId of createdUserIds.reverse()) {
      await unauthorizedRequest
        .delete(usersRoutes.delete(userId))
        .set(commonHeaders);
    }

    if (mockUserId) {
      await removeTokenUser(unauthorizedRequest, mockUserId, commonHeaders);
    }

    if (commonHeaders['Authorization']) {
      delete commonHeaders['Authorization'];
    }
  });

  describe('Pagination', () => {
    it('should paginate users list with total, page, limit and data', async () => {
      for (let i = 0; i < 3; i++) {
        const response = await unauthorizedRequest
          .post(usersRoutes.create)
          .set(commonHeaders)
          .send({
            login: `PAGINATION_USER_${Date.now()}_${i}`,
            password: 'TEST_PASSWORD',
          });

        expect(response.status).toBe(StatusCodes.CREATED);
        createdUserIds.push(response.body.id);
      }

      const response = await unauthorizedRequest
        .get(`${usersRoutes.getAll}?page=1&limit=2`)
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('data');

      expect(typeof response.body.total).toBe('number');
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should paginate articles list on the second page', async () => {
      for (let i = 0; i < 3; i++) {
        const response = await unauthorizedRequest
          .post(articlesRoutes.create)
          .set(commonHeaders)
          .send({
            title: `PAGINATION_ARTICLE_${Date.now()}_${i}`,
            content: `Pagination content ${i}`,
            status: 'draft',
            authorId: null,
            categoryId: null,
            tags: [`page-${i}`],
          });

        expect(response.status).toBe(StatusCodes.CREATED);
        createdArticleIds.push(response.body.id);
      }

      const response = await unauthorizedRequest
        .get(`${articlesRoutes.getAll}?page=2&limit=2`)
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('data');

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(2);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Sorting', () => {
    it('should correctly combine article filters by status and tag', async () => {
      const article1Response = await unauthorizedRequest
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({
          title: `COMBINED_FILTER_1_${Date.now()}`,
          content: 'Combined filter content 1',
          status: 'published',
          authorId: null,
          categoryId: null,
          tags: ['nodejs', 'nestjs'],
        });

      expect(article1Response.status).toBe(StatusCodes.CREATED);
      createdArticleIds.push(article1Response.body.id);

      const article2Response = await unauthorizedRequest
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({
          title: `COMBINED_FILTER_2_${Date.now()}`,
          content: 'Combined filter content 2',
          status: 'draft',
          authorId: null,
          categoryId: null,
          tags: ['nodejs'],
        });

      expect(article2Response.status).toBe(StatusCodes.CREATED);
      createdArticleIds.push(article2Response.body.id);

      const article3Response = await unauthorizedRequest
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({
          title: `COMBINED_FILTER_3_${Date.now()}`,
          content: 'Combined filter content 3',
          status: 'published',
          authorId: null,
          categoryId: null,
          tags: ['python'],
        });

      expect(article3Response.status).toBe(StatusCodes.CREATED);
      createdArticleIds.push(article3Response.body.id);

      const response = await unauthorizedRequest
        .get(`${articlesRoutes.getAll}?status=published&tag=nodejs`)
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body).toBeInstanceOf(Array);

      const ids = response.body.map((article) => article.id);

      expect(ids).toContain(article1Response.body.id);
      expect(ids).not.toContain(article2Response.body.id);
      expect(ids).not.toContain(article3Response.body.id);
    });

    it('should sort articles by title in descending order', async () => {
      const titles = ['ARTICLE_A', 'ARTICLE_C', 'ARTICLE_B'];

      for (const title of titles) {
        const response = await unauthorizedRequest
          .post(articlesRoutes.create)
          .set(commonHeaders)
          .send({
            title: `${title}_${Date.now()}`,
            content: `Content for ${title}`,
            status: 'draft',
            authorId: null,
            categoryId: null,
            tags: [],
          });

        expect(response.status).toBe(StatusCodes.CREATED);
        createdArticleIds.push(response.body.id);
      }

      const response = await unauthorizedRequest
        .get(`${articlesRoutes.getAll}?sortBy=title&order=desc`)
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);

      const body = response.body;
      const data = Array.isArray(body) ? body : body.data;

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);

      for (let i = 1; i < data.length; i++) {
        expect(
          String(data[i - 1].title).localeCompare(String(data[i].title)) >= 0,
        ).toBe(true);
      }
    });
  });

  describe('Combined features', () => {
    it('should apply filtering with pagination for articles', async () => {
      const categoryResponse = await unauthorizedRequest
        .post(categoriesRoutes.create)
        .set(commonHeaders)
        .send({
          name: `FILTER_PAGINATION_CATEGORY_${Date.now()}`,
          description: 'Category for combined test',
        });

      expect(categoryResponse.status).toBe(StatusCodes.CREATED);
      const categoryId = categoryResponse.body.id;
      createdCategoryIds.push(categoryId);

      for (let i = 0; i < 3; i++) {
        const publishedResponse = await unauthorizedRequest
          .post(articlesRoutes.create)
          .set(commonHeaders)
          .send({
            title: `COMBINED_PUBLISHED_${Date.now()}_${i}`,
            content: 'Combined test content',
            status: 'published',
            authorId: null,
            categoryId,
            tags: ['nodejs', 'combined'],
          });

        expect(publishedResponse.status).toBe(StatusCodes.CREATED);
        createdArticleIds.push(publishedResponse.body.id);
      }

      const draftResponse = await unauthorizedRequest
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({
          title: `COMBINED_DRAFT_${Date.now()}`,
          content: 'Draft article content',
          status: 'draft',
          authorId: null,
          categoryId,
          tags: ['nodejs'],
        });

      expect(draftResponse.status).toBe(StatusCodes.CREATED);
      createdArticleIds.push(draftResponse.body.id);

      const response = await unauthorizedRequest
        .get(
          `${articlesRoutes.getAll}?status=published&categoryId=${categoryId}&tag=nodejs&page=1&limit=2`,
        )
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);

      const body = response.body;
      const data = Array.isArray(body) ? body : body.data;

      expect(Array.isArray(data)).toBe(true);

      for (const article of data) {
        expect(article.status).toBe('published');
        expect(article.categoryId).toBe(categoryId);
        expect(article.tags).toContain('nodejs');
      }

      if (!Array.isArray(response.body)) {
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(2);
        expect(response.body.data.length).toBeLessThanOrEqual(2);
      }
    });

    it('should sort comments by createdAt in descending order for an article', async () => {
      const articleResponse = await unauthorizedRequest
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({
          title: `COMMENTS_SORT_ARTICLE_${Date.now()}`,
          content: 'Article for comments sorting',
          status: 'draft',
          authorId: null,
          categoryId: null,
          tags: [],
        });

      expect(articleResponse.status).toBe(StatusCodes.CREATED);
      const articleId = articleResponse.body.id;
      createdArticleIds.push(articleId);

      for (let i = 0; i < 3; i++) {
        const response = await unauthorizedRequest
          .post(commentsRoutes.create)
          .set(commonHeaders)
          .send({
            content: `SORT_COMMENT_${Date.now()}_${i}`,
            articleId,
            authorId: null,
          });

        expect(response.status).toBe(StatusCodes.CREATED);
        createdCommentIds.push(response.body.id);

        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      const response = await unauthorizedRequest
        .get(`${commentsRoutes.getByArticle(articleId)}&sortBy=createdAt&order=desc`)
        .set(commonHeaders);

      expect(response.status).toBe(StatusCodes.OK);

      const body = response.body;
      const data = Array.isArray(body) ? body : body.data;

      expect(data).toBeInstanceOf(Array);

      for (let i = 1; i < data.length; i++) {
        expect(Number(data[i - 1].createdAt)).toBeGreaterThanOrEqual(
          Number(data[i].createdAt),
        );
      }
    });
  });
});