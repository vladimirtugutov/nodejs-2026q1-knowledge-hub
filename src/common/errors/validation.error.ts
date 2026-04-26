import { BaseHttpError } from './base-http.error';

export class ValidationError extends BaseHttpError {
  constructor(message = 'Validation failed') {
    super(400, message, 'Bad Request');
  }
}
