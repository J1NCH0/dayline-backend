import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { isUniqueConstraintViolation } from '../../prisma/utils/is-unique-constraint-violation.util.js';
import { INTERNAL_SERVER_ERROR_MESSAGE } from '../constants/internal-server-error-message.constant.js';
import { UNIQUE_CONFLICT_MESSAGE } from '../constants/unique-conflict-message.constant.js';
import { FormValidationException } from '../exceptions/form-validation.exception.js';
import type { ErrorResponse } from '../types/error-response.type.js';
import type { FormErrorResponse } from '../types/form-error-response.type.js';
import { getHttpExceptionMessage } from '../utils/get-http-exception-message.util.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    response.status(body.status).json(body);
  }

  private toBody(exception: unknown): ErrorResponse | FormErrorResponse {
    if (exception instanceof FormValidationException) {
      return { status: exception.getStatus(), errors: exception.fieldErrors };
    }

    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        error: getHttpExceptionMessage(exception),
      };
    }

    if (isUniqueConstraintViolation(exception)) {
      return { status: HttpStatus.CONFLICT, error: UNIQUE_CONFLICT_MESSAGE };
    }

    this.logger.error(exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: INTERNAL_SERVER_ERROR_MESSAGE,
    };
  }
}
