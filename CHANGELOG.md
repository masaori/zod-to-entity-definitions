# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-22

### Added
- Initial implementation of zod-to-entity-definitions library
- Zod schema extensions: `.pk()`, `.unique()`, `.ref()`
- Factory functions: `entity()` and `struct()`
- Generator functions: `generateEntities()` and `generateRelations()`
- Type definitions for EntityDefinition and EntityRelation
- Comprehensive test suite with 10 test cases
- Full TypeScript strict mode support with exactOptionalPropertyTypes
- Biome + Prettier for linting and formatting
- ESM and CJS build outputs
- Complete documentation (README, ARCHITECTURE, example)

### Features
- Framework-agnostic entity definitions
- Entity nesting validation
- Reference integrity validation
- Support for nullable, optional, array, and enum fields
- Symbol-based metadata storage to avoid property name conflicts

### Security
- Zero security vulnerabilities (verified with CodeQL)
