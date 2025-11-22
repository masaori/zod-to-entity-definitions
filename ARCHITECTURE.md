# Architecture

## Overview

This library provides a framework-agnostic way to define data models using Zod with extended metadata (Primary Key, Foreign Key, Unique) and convert them into Entity Definitions (ER models).

## Design Principles

1. **Type Safety First**: Leverage TypeScript's strict type system to prevent errors at compile time
2. **Minimal API Surface**: Keep the public API simple and intuitive
3. **Framework Agnostic**: Generate generic entity definitions that can be consumed by any framework
4. **Separation of Concerns**: Clear separation between schema definition, metadata storage, and generation logic

## Directory Structure

```
src/
├── index.ts              # Public API exports
├── types.ts              # Type definitions for EntityDefinition and EntityRelation
├── setupZod.ts           # Zod extensions (.pk(), .unique(), .ref())
├── factories.ts          # entity() and struct() factory functions
├── generator.ts          # Core generation logic (generateEntities, generateRelations)
└── shared/
    └── lib.ts            # Shared utilities (assertNever, etc.)

test/
└── usage.test.ts         # Integration tests
```

## Module Responsibilities

### setupZod.ts

- Extends Zod schema types using TypeScript declaration merging
- Implements `.pk()`, `.unique()`, `.ref()` methods
- Uses Symbol-based metadata storage to avoid property name conflicts

### factories.ts

- Provides `entity()` and `struct()` factory functions
- Attaches metadata to Zod schemas for later retrieval
- Type-safe configuration objects

### generator.ts

- **generateEntities**: Parses Zod schemas and produces EntityDefinition[]
  - Recursively unwraps z.optional, z.nullable, z.array
  - Validates that entities don't directly embed other entities
  - Validates that .ref() points to valid entity schemas
- **generateRelations**: Analyzes EntityDefinition[] to build relation maps

### types.ts

- Contains all type definitions for the library output
- EntityDefinition, EntityPropertyDefinition variants
- EntityRelation and related types

## Coding Conventions

1. **No `any` type**: Strictly forbidden
2. **No type assertions (`as`)**: Use type predicates instead
3. **Exhaustiveness checking**: Use `assertNever()` in all discriminated union branches
4. **Strict null checks**: Always handle undefined/null explicitly
5. **No lint suppressions**: Never use eslint-disable or @ts-ignore

## Error Handling

- Throw descriptive errors during generation when validation fails
- Provide clear error messages indicating what went wrong and why
