# Knowledge Hub

## Prerequisites

- Git - [Download & Install Git](https://git-scm.com/downloads).
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) and the npm package manager.

## Downloading

```
git clone {repository URL}
```

## Installing NPM modules

```
npm install
```

## Docker

```
docker compose build --no-cache app
docker compose up -d
```

## Environment variables

Create a `.env` file in the project root.

## Gemini AI setup

This project uses the Google Gemini API for AI features.

### How to get API key

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Open API keys page.
4. Create a new API key for your Google project.
5. Copy the key and place it into `.env` as `GEMINI_API_KEY`.

Official docs:
- [Gemini API quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [Gemini API key setup](https://ai.google.dev/gemini-api/docs/api-key)

### Model configuration

The AI model is configurable through `.env`:

```env
GEMINI_MODEL=gemini-2.5-flash
```

If needed, you can replace it with another Gemini model available for your API key and project.

### Notes about limits

Gemini API limits depend on the selected model, project, and usage tier.
If the API returns rate-limit or quota errors, verify your project quota and billing settings in Google AI Studio / Google Cloud.

More information:
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)


## Running application
To create categories and articles, your user needs the  admin  role. New users created via signup are regular users first, so the flow is: sign up, log in, promote the user to admin in Docker PostgreSQL, create a category, then create an article. This matches JWT Bearer auth flow for protected endpoints.

1. Sign up
Register a new user:
```
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "login": "vova1",
    "password": "password2"
  }'

```
2. Log in
Log in and get tokens:
```
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "vova1",
    "password": "password2"
  }'
```
The response will contain  accessToken  and  refreshToken . Use the  accessToken  in the  Authorization  header for all protected requests.
Example response:
```
{
  "accessToken": "YOUR_ACCESS_TOKEN",
  "refreshToken": "YOUR_REFRESH_TOKEN"
}

```

3. Grant admin role
To be able to add categories and articles, promote the user to  admin  directly in the Docker PostgreSQL database:
```
docker exec -it knowledge-hub-db psql -U postgres -d knowledge_hub -c "UPDATE users SET role = 'admin' WHERE login = 'YOUR_LOGIN';"

```
4. Create a category
After this you need to add category first. Create a category using a valid access token:
```
curl -X POST http://localhost:4000/category \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "TEST_CATEGORY",
    "description": "Test category description"
  }'

```

Example response:
```
{
  "id": "3f2bc8a9-67a2-4686-8dad-a938733bb9aa",
  "name": "TEST_CATEGORY",
  "description": "Test category description"
}

```
Copy the returned category  id  and use it in the next step.


5. Create an article
Create an article using the category  id  from the previous step and a valid access token:
```
curl -X POST http://localhost:4000/article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "My published article",
    "content": "Article 1 content goes here",
    "status": "published",
    "categoryId": "3f2bc8a9-67a2-4686-8dad-a938733bb9aa",
    "tags": ["nestjs", "prisma", "postgres"]
  }'

```
Notes
	•	All protected endpoints require a valid JWT access token in the  Authorization  header using the Bearer scheme.
	•	If you use a different login than  vova1 , replace it in the SQL update command.
	•	If your access token expires, log in again or use the refresh endpoint to get a new token pair.

## Swagger

After starting the app on port (4000 as default) you can open
in your browser OpenAPI documentation by typing http://localhost:4000/doc/.
For more information about OpenAPI/Swagger please visit https://swagger.io/.

## AI endpoints

After configuring `GEMINI_API_KEY` and starting the application, the following AI endpoints are available:

### Article-based AI endpoints

- `POST /ai/articles/:articleId/summarize`
- `POST /ai/articles/:articleId/translate`
- `POST /ai/articles/:articleId/analyze`

### General AI endpoints

- `POST /ai/generate`
- `GET /ai/usage`

## RAG endpoints

### RAG endpoints

- `POST /ai/rag/index`
- `POST /ai/rag/search`
- `POST /ai/rag/chat`
- `DELETE /ai/rag/index/articles/:articleId`

### RAG configuration

•	Gemini generation + Gemini embeddings are configured via  .env .

•	Chunking is configured via  RAG_CHUNK_SIZE  and  RAG_CHUNK_OVERLAP  environment variables.


Open Swagger UI at:

[http://localhost:4000/doc](http://localhost:4000/doc)

### Example requests

#### Summarize article

```json
{
  "maxLength": "medium"
}
```

#### Translate article

```json
{
  "targetLanguage": "es",
  "sourceLanguage": "en"
}
```

#### Analyze article

```json
{
  "task": "review"
}
```

#### Generate free-form response

```json
{
  "prompt": "Write 3 tags for a NestJS Prisma article",
  "sessionId": "demo-1"
}
```

## Testing

After application running open new terminal and enter:

To run all tests without authorization

```
npm run test
```

To run only one of all test suites

```
npm run test -- <path to suite>
```

To run all test with authorization

```
npm run test:auth
```

To run only specific test suite with authorization

```
npm run test:auth -- <path to suite>
```

To run refresh token tests

```
npm run test:refresh
```

To run RBAC (role-based access control) tests

```
npm run test:rbac
```

### Auto-fix and format

```
npm run lint
```

```
npm run format
```


## Notes

- AI routes require authorization with Bearer token.
- `GET /ai/usage` is intended for admin users.
- `POST /ai/generate` supports short-term in-memory conversation context via `sessionId`.
- Summarize and translate responses are cached in memory.
- AI rate limiting is enabled and may return `429 Too Many Requests` with `Retry-After` header.