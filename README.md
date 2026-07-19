# zod-to-entity-definitions

A TypeScript library that allows you to define data models using Zod with extended metadata (Primary Key, Foreign Key, Unique) and convert them into framework-agnostic Entity Definitions (ER models).

## Features

- 🔧 **Zod Extensions**: Add `.pk()`, `.unique()`, and `.ref()` methods to Zod schemas
- 🏗️ **Entity & Struct Factories**: Define entities and reusable struct types
- 🔄 **Automatic Generation**: Convert Zod schemas to entity definitions and relations
- 🔒 **Type-Safe**: Full TypeScript support with strict typing
- 📦 **Framework Agnostic**: Generate generic entity definitions usable by any framework
- ✅ **Validation**: Built-in validation for entity nesting and reference integrity

## Installation

### Installation

Install the package from npm:

```bash
npm install @masaori/zod-to-entity-definitions zod
```

## Quick Start

```typescript
import { z } from 'zod';
import {
  entity,
  struct,
  generateEntities,
  generateRelations,
} from '@masaori/zod-to-entity-definitions';

// 1. Define a Struct (reusable component)
const Address = struct({
  name: 'AddressStruct',
  description: 'Common address',
  columns: {
    city: z.string(),
    street: z.string(),
  },
});

// 2. Define Entities
const Company = entity({
  name: 'Company',
  columns: {
    id: z.string().pk(),
    name: z.string(),
    address: Address, // Using struct is OK
  },
});

const User = entity({
  name: 'User',
  columns: {
    id: z.string().pk(),
    email: z.string().email().unique(),
    companyId: z.string().ref(Company), // Reference to Company entity
  },
});

// 3. Generate Entity Definitions
const definitions = generateEntities([Company, User]);

// 4. Generate Relations
const relations = generateRelations(definitions);

console.log(JSON.stringify(definitions, null, 2));
console.log(JSON.stringify(relations, null, 2));
```

> 📝 **See the [examples](./examples) directory for complete working examples with generated JSON output.**

## API Reference

### Zod Extensions

The library extends Zod schemas with the following methods:

#### `.pk()`

Marks a field as the Primary Key.

```typescript
id: z.string().pk();
```

#### `.unique()`

Marks a field as Unique.

```typescript
email: z.string().email().unique();
```

#### `.ref(targetEntity, targetColumn?)`

Marks a field as a Foreign Key reference to another entity.

- `targetEntity`: Must be a schema created with `entity()`
- `targetColumn`: Optional, defaults to "id"

```typescript
companyId: z.string().ref(Company);
managerId: z.string().ref(User, 'userId');
```

##### Array (to-many) references

Wrapping a reference in `z.array(...)` marks it as an array (to-many) foreign key.
The generated `ReferencedObject` property and the corresponding `referTos` / `referredBys`
carry `isArray: true`; single (scalar) references omit the field, so existing output is
unchanged.

```typescript
// any of these forms are recognized as an array reference
productIds: z.array(z.string().ref(Product));
productIds: z.string().ref(Product).array();
productIds: z.array(z.string()).ref(Product);
```

```jsonc
// generated property
{ "isReference": true, "name": "productIds", "targetEntityDefinitionName": "Product", "isArray": true, ... }
```

> **Behavior change:** array references were already accepted by earlier versions, but were
> emitted **without** `isArray` — indistinguishable from a scalar reference (the to-many
> information was silently dropped). From this version they carry `isArray: true`. Scalar
> reference output is unchanged. If you rely on exact-equality snapshots of generated output
> for schemas that use array references, those snapshots will need updating.

### Factory Functions

#### `entity(config)`

Creates an entity schema with metadata.

```typescript
type EntityConfig<T extends z.ZodRawShape> = {
  name: string;
  description?: string;
  columns: T;
  // Composite (multi-column) unique constraints. Column names are type-checked against `columns`.
  uniques?: (keyof T & string)[][];
};
```

#### `struct(config)`

Creates a struct schema for reusable components.

```typescript
type StructConfig<T extends z.ZodRawShape> = {
  name: string;
  description?: string;
  columns: T;
};
```

### Generator Functions

#### `generateEntities(schemas)`

Parses Zod schemas and returns an array of `EntityDefinition`.

**Validation Rules:**

1. Entities cannot directly embed other entities (must use `.ref()`)
2. `.ref()` must point to valid entity schemas

```typescript
const definitions = generateEntities([Company, User]);
```

#### `generateRelations(definitions)`

Analyzes entity definitions to construct relation maps.

```typescript
const relations = generateRelations(definitions);
```

## Type Definitions

### EntityDefinition

```typescript
type EntityDefinition = {
  name: string;
  description?: string;
  properties: EntityPropertyDefinition[];
};
```

### EntityPropertyDefinition

Union type representing different property types:

- `EntityPropertyDefinitionPrimaryKey`: Primary key field
- `EntityPropertyDefinitionPrimitive`: boolean, number, string, Date
- `EntityPropertyDefinitionTypedStruct`: Reference to a struct type
- `EntityPropertyDefinitionReferencedObject`: Foreign key reference (carries `isArray?: true` for array / to-many references)

### EntityRelation

```typescript
type EntityRelation = {
  entityName: string;
  referTos: EntityRelationReferTo[];
  referredBys: EntityRelationReferredBy[];
};
```

## Advanced Usage

### Nullable and Optional Fields

```typescript
const User = entity({
  name: 'User',
  columns: {
    id: z.string().pk(),
    nickname: z.string().optional(), // Optional field
    bio: z.string().nullable(), // Nullable field
  },
});
```

### Array Fields

```typescript
const User = entity({
  name: 'User',
  columns: {
    id: z.string().pk(),
    tags: z.array(z.string()),
    scores: z.array(z.number()).optional(),
  },
});
```

### Enum Fields

```typescript
const User = entity({
  name: 'User',
  columns: {
    id: z.string().pk(),
    role: z.enum(['admin', 'user', 'guest']),
  },
});
```

### Composite Unique Constraints

Single-column uniqueness uses `.unique()` on the column. For **multi-column (composite)** uniqueness, declare it at the entity level with `uniques`. Column names are type-checked against `columns`.

```typescript
const CustomerSegmentProductVariantOffering = entity({
  name: 'CustomerSegmentProductVariantOffering',
  columns: {
    id: z.string().pk(),
    productVariantId: z.string().ref(ProductVariant),
    customerSegmentId: z.string().ref(CustomerSegment),
    price: z.number(),
  },
  // (productVariantId, customerSegmentId) must be unique together
  uniques: [['productVariantId', 'customerSegmentId']],
});
```

The constraint is emitted on the generated `EntityDefinition` as `compositeUniqueConstraints`:

```jsonc
{
  "name": "CustomerSegmentProductVariantOffering",
  "properties": [ /* ... */ ],
  "compositeUniqueConstraints": [["productVariantId", "customerSegmentId"]]
}
```

- Multiple constraints are supported: `uniques: [['a', 'b'], ['c', 'd']]`.
- Each group must list **at least 2 distinct, existing** columns (otherwise `generateEntities` throws). Use `.unique()` for single-column uniqueness.
- When no `uniques` are declared, `compositeUniqueConstraints` is omitted from the output (existing consumers are unaffected).

### Complex Relations

```typescript
const Department = entity({
  name: 'Department',
  columns: {
    id: z.string().pk(),
    name: z.string(),
  },
});

const Employee = entity({
  name: 'Employee',
  columns: {
    id: z.string().pk(),
    name: z.string(),
    departmentId: z.string().ref(Department),
  },
});

const Project = entity({
  name: 'Project',
  columns: {
    id: z.string().pk(),
    name: z.string(),
    leadId: z.string().ref(Employee),
    departmentId: z.string().ref(Department),
  },
});
```

## Validation Rules

### ❌ Entity Nesting (Not Allowed)

```typescript
const User = entity({
  name: 'User',
  columns: {
    id: z.string().pk(),
    company: Company, // ❌ Error: Direct entity embedding not allowed
  },
});
```

### ✅ Use References Instead

```typescript
const User = entity({
  name: 'User',
  columns: {
    id: z.string().pk(),
    companyId: z.string().ref(Company), // ✅ Correct: Use .ref()
  },
});
```

### ❌ Invalid References

```typescript
const Address = struct({
  name: 'Address',
  columns: { city: z.string() },
});

const User = entity({
  name: 'User',
  columns: {
    id: z.string().pk(),
    addressId: z.string().ref(Address), // ❌ Error: Can't reference struct
  },
});
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm check-types

# Linting
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Build
pnpm build
```

## CI/CD

This project uses GitHub Actions for continuous integration and deployment.

### Workflows

1. **Commit Message Validation** (`.github/workflows/commit-check.yml`)
   - Runs on all PRs
   - Validates commit messages using [Conventional Commits](https://www.conventionalcommits.org/)
   - Ensures all commits are linear (no merge commits)

2. **Lint and Test** (`.github/workflows/lint-test.yml`)
   - Runs on all PRs and pushes to main
   - Executes linting, type checking, and tests
   - Must pass before merging

3. **Publish to GitHub Packages** (`.github/workflows/publish.yml`)
   - Manual workflow trigger only (workflow_dispatch)
   - Automatically determines version bump using semantic versioning
   - Publishes to GitHub Packages with automatic changelog generation
   - Version bumps follow Conventional Commits:
     - `feat:` → minor version bump
     - `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `build:`, `ci:`, `chore:` → patch version bump
     - `BREAKING CHANGE:` → major version bump

### Publishing to GitHub Packages

Publishing is automated via GitHub Actions. To publish a new version:

1. **Required tokens**: No additional tokens needed!
   - The workflow uses the built-in `GITHUB_TOKEN` which is automatically provided by GitHub Actions
   - The `GITHUB_TOKEN` has the necessary permissions to:
     - Write to the repository (create tags, update files)
     - Publish to GitHub Packages
     - Create GitHub releases
   - **No manual token configuration required** - it works out of the box

2. **Trigger the publish workflow**:
   - Go to the Actions tab in GitHub
   - Select "Publish to GitHub Packages" workflow
   - Click "Run workflow" on the main branch

3. **Automated process**:
   - The workflow will analyze commit messages since the last release
   - Automatically determine the version bump (major/minor/patch)
   - Update `package.json` and `CHANGELOG.md`
   - Create a git tag and GitHub release
   - Publish to GitHub Packages

### Commit Message Format

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples:

- `feat: add new entity validation`
- `fix: correct reference resolution`
- `docs: update README with examples`
- `feat!: remove deprecated API` (breaking change)

### Pre-publish Checklist

The package includes a `prepublishOnly` script that automatically runs before publishing:

- Type checking (`pnpm check-types`)
- Linting (`pnpm lint`)
- Tests (`pnpm test`)
- Build (`pnpm build`)

All these checks must pass before the package can be published.

## License

MIT
