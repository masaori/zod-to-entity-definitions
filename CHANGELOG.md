## [1.1.4](https://github.com/masaori/zod-to-entity-definitions/compare/v1.1.3...v1.1.4) (2025-11-26)

## [1.1.3](https://github.com/masaori/zod-to-entity-definitions/compare/v1.1.2...v1.1.3) (2025-11-24)

## [1.1.2](https://github.com/masaori/zod-to-entity-definitions/compare/v1.1.1...v1.1.2) (2025-11-24)

### Bug Fixes

* update zod usage for v4 compatibility ([236cc10](https://github.com/masaori/zod-to-entity-definitions/commit/236cc1007a53103ba8bb8a24319fbef48a588462))

## [1.1.1](https://github.com/masaori/zod-to-entity-definitions/compare/v1.1.0...v1.1.1) (2025-11-23)

### Bug Fixes

* ignore package.json from lint check ([9ab9062](https://github.com/masaori/zod-to-entity-definitions/commit/9ab90624ed81759ed16270e53c2e4c7ce840ba3e))

## [1.1.0](https://github.com/masaori/zod-to-entity-definitions/compare/v1.0.3...v1.1.0) (2025-11-23)

### Features

* improve generateEntities return type to infer entity names ([5e3d07d](https://github.com/masaori/zod-to-entity-definitions/commit/5e3d07d2b24701fe1bd8a9736399aea04de35a0d))

### Bug Fixes

* remove unnecessary file ([2dadc2b](https://github.com/masaori/zod-to-entity-definitions/commit/2dadc2b733e75a1f94b5487e4949d6f7c2ac7e22))

## [1.0.3](https://github.com/masaori/zod-to-entity-definitions/compare/v1.0.2...v1.0.3) (2025-11-23)

### Bug Fixes

* remove prettier ([e488223](https://github.com/masaori/zod-to-entity-definitions/commit/e488223ec79300f05be9935a07506d38f0d80841))

## [1.0.2](https://github.com/masaori/zod-to-entity-definitions/compare/v1.0.1...v1.0.2) (2025-11-23)

### Bug Fixes

* lint ([dce8fe0](https://github.com/masaori/zod-to-entity-definitions/commit/dce8fe0c332da4ace76e208c8265cdc6db589f7b))
* run lint ([08be8e6](https://github.com/masaori/zod-to-entity-definitions/commit/08be8e6a4c19a5f0a85b74a0ecaf168af1a837ef))

## [1.0.1](https://github.com/masaori/zod-to-entity-definitions/compare/v1.0.0...v1.0.1) (2025-11-23)

### Bug Fixes

- fix package.json formatting to pass Biome linter ([832183d](https://github.com/masaori/zod-to-entity-definitions/commit/832183d1c5f295400abfebeeef9e9efce923cc02))

## 1.0.0 (2025-11-22)

### Features

- add CI dependencies to package.json for reproducible builds ([51c5bd1](https://github.com/masaori/zod-to-entity-definitions/commit/51c5bd1d216189f0d3b4625160fe370cdcce1c4c))
- add GitHub Actions CI workflows for commit check, lint/test, and publish ([7fd5c69](https://github.com/masaori/zod-to-entity-definitions/commit/7fd5c69615f4685e7e9ea1bdc02148229b6bc996))
- change publish destination from npm to GitHub Packages ([ed4fdff](https://github.com/masaori/zod-to-entity-definitions/commit/ed4fdffb308f4646ff05ca8758110b8fb09bc9d2))
- make GitHub Packages public to remove authentication requirement ([9a98805](https://github.com/masaori/zod-to-entity-definitions/commit/9a9880502fbb49ec472d8a29290aae7bde71ff85))

### Bug Fixes

- add explicit GITHUB_TOKEN permissions to workflows for security ([bee695c](https://github.com/masaori/zod-to-entity-definitions/commit/bee695c6bcf499d2ac2ce85886d1348811f708cb))
- add NODE_AUTH_TOKEN for npm auth and simplify release commit message ([cd26b4e](https://github.com/masaori/zod-to-entity-definitions/commit/cd26b4edf6fca8169933c62ca0f67a548c94d4c3))
- properly escape SHA variables and document token usage in workflows ([e32fdab](https://github.com/masaori/zod-to-entity-definitions/commit/e32fdab9333ec1ba8c186800ee83c6687c878db6))

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
