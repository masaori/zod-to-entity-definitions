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

```bash
npm install zod-to-entity-definitions zod
```

## Quick Start

```typescript
import { z } from 'zod';
import { entity, struct, generateEntities, generateRelations } from 'zod-to-entity-definitions';

// 1. Define a Struct (reusable component)
const Address = struct({
  configType: 'struct',
  name: 'AddressStruct',
  description: 'Common address',
  columns: {
    city: z.string(),
    street: z.string(),
  },
});

// 2. Define Entities
const Company = entity({
  configType: 'entity',
  name: 'Company',
  columns: {
    id: z.string().pk(),
    name: z.string(),
    address: Address, // Using struct is OK
  },
});

const User = entity({
  configType: 'entity',
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

### Factory Functions

#### `entity(config)`

Creates an entity schema with metadata.

```typescript
type EntityConfig<T extends z.ZodRawShape> = {
  configType: 'entity';
  name: string;
  description?: string;
  columns: T;
};
```

#### `struct(config)`

Creates a struct schema for reusable components.

```typescript
type StructConfig<T extends z.ZodRawShape> = {
  configType: 'struct';
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
- `EntityPropertyDefinitionReferencedObject`: Foreign key reference

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
  configType: 'entity',
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
  configType: 'entity',
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
  configType: 'entity',
  name: 'User',
  columns: {
    id: z.string().pk(),
    role: z.enum(['admin', 'user', 'guest']),
  },
});
```

### Complex Relations

```typescript
const Department = entity({
  configType: 'entity',
  name: 'Department',
  columns: {
    id: z.string().pk(),
    name: z.string(),
  },
});

const Employee = entity({
  configType: 'entity',
  name: 'Employee',
  columns: {
    id: z.string().pk(),
    name: z.string(),
    departmentId: z.string().ref(Department),
  },
});

const Project = entity({
  configType: 'entity',
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
  configType: 'entity',
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
  configType: 'entity',
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
  configType: 'struct',
  name: 'Address',
  columns: { city: z.string() },
});

const User = entity({
  configType: 'entity',
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
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run check-types

# Linting
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format code
npm run format

# Build
npm run build
```

## License

MIT
