# Examples

This directory contains example usage of the `zod-to-entity-definitions` library.

## Files

### `entities.ts`

Contains example entity and struct definitions that demonstrate the library's features:

- **Address Struct**: A reusable address structure with city, street, and optional zipCode
- **Company Entity**: A company entity with an embedded address struct
- **Department Entity**: A department that references a company
- **User Entity**: A user entity with various field types (string, enum, array, boolean) and a reference to department

Run the example:

```bash
npx tsx examples/entities.ts
```

### `generate-example-json.ts`

Script that generates JSON output files from the entity definitions. This script:

1. Defines the same entities as `entities.ts`
2. Generates entity definitions using `generateEntities()`
3. Generates entity relations using `generateRelations()`
4. Writes the output to JSON files

Run the script:

```bash
npx tsx examples/generate-example-json.ts
```

This will generate:
- `entity-definitions.json` - Complete entity definitions with all properties
- `entity-relations.json` - Relationship mappings between entities

### `entity-definitions.json`

Generated output showing the complete entity definitions. Each entity includes:

- **name**: Entity name
- **description**: Optional entity description
- **properties**: Array of property definitions

Property types include:
- `PrimaryKey`: Primary key fields
- Primitives: `string`, `number`, `boolean`, `Date`
- `typedStruct`: Embedded struct types
- References: Foreign key relationships

Example structure:

```json
{
  "name": "User",
  "description": "User entity representing employees",
  "properties": [
    {
      "isReference": false,
      "propertyType": "PrimaryKey",
      "name": "id"
    },
    {
      "isReference": true,
      "name": "departmentId",
      "targetEntityDefinitionName": "Department",
      "isUnique": false,
      "isNullable": false
    }
  ]
}
```

### `entity-relations.json`

Generated output showing the relationships between entities. Each relation includes:

- **entityName**: Name of the entity
- **referTos**: Array of outgoing references (foreign keys this entity has)
- **referredBys**: Array of incoming references (entities that reference this one)

Example structure:

```json
{
  "entityName": "Department",
  "referTos": [
    {
      "entityName": "Company",
      "propertyName": "companyId",
      "isUnique": false
    }
  ],
  "referredBys": [
    {
      "entityName": "User",
      "propertyName": "departmentId",
      "isUnique": false
    }
  ]
}
```

## Entity Relationship Diagram

The example demonstrates the following relationships:

```
Company (1) ←── (N) Department (1) ←── (N) User
    └─ has embedded Address struct
```

- A Company can have multiple Departments
- A Department belongs to one Company
- A Department can have multiple Users
- A User belongs to one Department
- Company embeds an Address struct (not a reference)
