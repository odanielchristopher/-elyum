import {
  BadRequestException,
  Body,
  createParamDecorator,
  Headers,
  HttpAdapter,
  HttpExecutionContext,
  Param,
  Query,
  Request,
  Resource,
  Response,
} from '@elyum/http';
import { describe, expect, it } from 'vitest';

describe('@elyum/http public API', () => {
  it('should expose the supported HTTP building blocks', () => {
    // Arrange
    const publicExports = [
      BadRequestException,
      Body,
      createParamDecorator,
      Headers,
      HttpAdapter,
      HttpExecutionContext,
      Param,
      Query,
      Request,
      Resource,
      Response,
    ];

    // Act
    const exportTypes = publicExports.map(
      (publicExport) => typeof publicExport,
    );

    // Assert
    expect(exportTypes).toEqual(publicExports.map(() => 'function'));
  });
});
