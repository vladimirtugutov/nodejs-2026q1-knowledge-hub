import { BaseHttpError } from './base-http.error';

export class UnprocessableEntityError extends BaseHttpError {
  constructor(message = 'Unprocessable Entity') {
    super(422, message, 'Unprocessable Entity');
  }
}
