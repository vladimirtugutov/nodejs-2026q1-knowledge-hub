import { BaseHttpError } from './base-http.error';

export class NotFoundError extends BaseHttpError {
  constructor(message = 'Resource not found') {
    super(404, message, 'Not Found');
  }
}
