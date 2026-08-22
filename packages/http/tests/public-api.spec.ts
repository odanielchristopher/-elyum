import { describe, expect, it } from 'vitest';

import {
  BadRequestException,
  Body,
  compileController,
  ControllerExecutionError,
  ControllerCompilationError,
  createParamDecorator,
  Delete,
  executeController,
  Get,
  Head,
  Headers,
  HttpExecutionContext,
  httpResult,
  Options,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
} from '@elyum/http';
import * as HttpPublicApi from '@elyum/http';

describe('@elyum/http public API', () => {
  it('should expose the supported HTTP building blocks', () => {
    // Arrange
    const publicExports = [
      BadRequestException,
      Body,
      compileController,
      executeController,
      httpResult,
      ControllerCompilationError,
      ControllerExecutionError,
      createParamDecorator,
      Delete,
      Get,
      Head,
      Headers,
      HttpExecutionContext,
      Options,
      Param,
      Patch,
      Post,
      Put,
      Query,
      Request,
      Response,
      Route,
    ];

    // Act
    const exportTypes = publicExports.map(
      (publicExport) => typeof publicExport,
    );

    // Assert
    expect(exportTypes).toEqual(publicExports.map(() => 'function'));
  });

  it('should not expose the removed resource, guard, or adapter APIs', () => {
    expect(HttpPublicApi).not.toHaveProperty('HttpAdapter');
    expect(HttpPublicApi).not.toHaveProperty('Resource');
    expect(HttpPublicApi).not.toHaveProperty('UseGuards');
  });
});
