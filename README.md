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

docker compose build --no-cache app
docker compose up -d

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

```
npm start
```

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