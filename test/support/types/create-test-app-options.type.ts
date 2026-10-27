import type { Type } from '@nestjs/common';
import type { TestingModuleBuilder } from '@nestjs/testing';

export type CreateTestAppOptions = {
  controllers?: Type[];
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
};
