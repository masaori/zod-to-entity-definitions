/**
 * Core generation logic for entity definitions and relations
 */
import { z } from 'zod';
import type { EntitySchema } from './factories';
import { getSchemaDescription, getSchemaName, getSchemaType } from './factories';
import { getRefMetadata, isPrimaryKey, isUnique } from './setupZod';
import type {
  EntityDefinition,
  EntityPropertyDefinition,
  EntityPropertyDefinitionPrimaryKey,
  EntityPropertyDefinitionPrimitive,
  EntityPropertyDefinitionReferencedObject,
  EntityPropertyDefinitionTypedStruct,
  EntityRelation,
  EntityRelationReferTo,
  EntityRelationReferredBy,
} from './types';

/**
 * Helper type to extract entity name from a single EntitySchema
 *
 * For example: EntitySchema<'User', {...}> => 'User'
 * For non-EntitySchema types, returns never
 */
type ExtractEntityName<T> = T extends EntitySchema<infer TName, z.ZodRawShape> ? TName : never;

/**
 * Helper type to extract entity names from an array of schemas
 *
 * This transforms an array of EntitySchema types into a union of their names.
 * For example: [EntitySchema<'User', ...>, EntitySchema<'Company', ...>] => 'User' | 'Company'
 *
 * The pattern works by:
 * 1. Mapping over the array type to extract each entity name
 * 2. Using [number] to create a union of all extracted names
 */
type ExtractEntityNames<T extends readonly z.ZodTypeAny[]> = {
  [K in keyof T]: ExtractEntityName<T[K]>;
}[number];

/**
 * Unwraps a Zod schema to get the innermost type
 * Handles z.optional, z.nullable, z.array
 */
type UnwrapResult = {
  innerSchema: z.ZodTypeAny;
  isNullable: boolean;
  isArray: boolean;
};

function unwrapSchema(schema: z.ZodTypeAny): UnwrapResult {
  let current = schema;
  let isNullable = false;
  let isArray = false;

  // Unwrap layers
  while (true) {
    if (current instanceof z.ZodOptional) {
      isNullable = true;
      current = current.unwrap() as z.ZodTypeAny;
    } else if (current instanceof z.ZodNullable) {
      isNullable = true;
      current = current.unwrap() as z.ZodTypeAny;
    } else if (current instanceof z.ZodArray) {
      isArray = true;
      current = current.element as z.ZodTypeAny;
    } else {
      break;
    }
  }

  return { innerSchema: current, isNullable, isArray };
}

/**
 * Generates entity definitions from Zod schemas
 */
export function generateEntities<const T extends readonly z.ZodTypeAny[]>(
  schemas: T
): EntityDefinition<ExtractEntityNames<T>>[] {
  const definitions: EntityDefinition[] = [];

  for (const schema of schemas) {
    const schemaType = getSchemaType(schema);

    // Only process entity schemas
    if (schemaType !== 'entity') {
      continue;
    }

    const name = getSchemaName(schema);
    if (name === undefined) {
      throw new Error('Entity schema must have a name');
    }

    const description = getSchemaDescription(schema);

    if (!(schema instanceof z.ZodObject)) {
      throw new Error(`Entity "${name}" must be a ZodObject`);
    }

    const properties: EntityPropertyDefinition[] = [];
    const shape = schema.shape;

    for (const [fieldName, fieldSchema] of Object.entries(shape)) {
      if (!(fieldSchema instanceof z.ZodType)) {
        continue;
      }

      const property = parseProperty(fieldName, fieldSchema);
      properties.push(property);
    }

    const entityDefinition: EntityDefinition = {
      name,
      properties,
    };
    if (description !== undefined) {
      entityDefinition.description = description;
    }
    definitions.push(entityDefinition);
  }

  return definitions as EntityDefinition<ExtractEntityNames<T>>[];
}

/**
 * Parses a single property from a Zod schema
 */
function parseProperty(fieldName: string, fieldSchema: z.ZodTypeAny): EntityPropertyDefinition {
  // Unwrap the schema first to handle cases like .ref().nullable() or .nullable().ref()
  const { innerSchema, isNullable, isArray } = unwrapSchema(fieldSchema);

  // Check metadata on both outer and inner schemas to support any order
  const isPk = isPrimaryKey(fieldSchema) || isPrimaryKey(innerSchema);
  const isUniqueField = isUnique(fieldSchema) || isUnique(innerSchema);
  const refMetadata = getRefMetadata(fieldSchema) ?? getRefMetadata(innerSchema);

  // Handle Primary Key
  if (isPk) {
    const property: EntityPropertyDefinitionPrimaryKey = {
      isReference: false,
      propertyType: 'PrimaryKey',
      name: fieldName,
    };
    return property;
  }

  // Handle Foreign Key Reference
  if (refMetadata !== undefined) {
    const { targetEntity } = refMetadata;

    // Validate that targetEntity is an entity
    const targetSchemaType = getSchemaType(targetEntity);
    if (targetSchemaType !== 'entity') {
      throw new Error(
        `Field "${fieldName}" has .ref() pointing to a non-entity schema. Only entity schemas created with entity() can be referenced.`
      );
    }

    const targetEntityName = getSchemaName(targetEntity);
    if (targetEntityName === undefined) {
      throw new Error(`Referenced entity for field "${fieldName}" must have a name`);
    }

    const property: EntityPropertyDefinitionReferencedObject = {
      isReference: true,
      name: fieldName,
      targetEntityDefinitionName: targetEntityName,
      isUnique: isUniqueField,
      isNullable,
    };
    return property;
  }

  // Check if inner schema is an entity (not allowed)
  const innerSchemaType = getSchemaType(innerSchema);
  if (innerSchemaType === 'entity') {
    throw new Error(
      `Field "${fieldName}" contains a direct entity embedding. Entities cannot be directly nested. Use .ref() instead.`
    );
  }

  // Handle struct
  if (innerSchemaType === 'struct') {
    const structName = getSchemaName(innerSchema);
    if (structName === undefined) {
      throw new Error(`Struct schema for field "${fieldName}" must have a name`);
    }

    const property: EntityPropertyDefinitionTypedStruct = {
      isReference: false,
      propertyType: 'typedStruct',
      name: fieldName,
      structTypeName: structName,
      isUnique: isUniqueField,
      isNullable,
      isArray,
    };
    return property;
  }

  // Handle primitives
  const primitiveType = getPrimitiveType(innerSchema);
  if (primitiveType !== null) {
    const acceptableValues = getAcceptableValues(innerSchema);

    const property: EntityPropertyDefinitionPrimitive = {
      isReference: false,
      propertyType: primitiveType,
      name: fieldName,
      isUnique: isUniqueField,
      isNullable,
      isArray,
      acceptableValues,
    };
    return property;
  }

  throw new Error(`Unsupported schema type for field "${fieldName}"`);
}

/**
 * Determines the primitive type from a Zod schema
 */
function getPrimitiveType(schema: z.ZodTypeAny): 'boolean' | 'number' | 'string' | 'Date' | null {
  if (schema instanceof z.ZodString) {
    return 'string';
  }
  if (schema instanceof z.ZodNumber) {
    return 'number';
  }
  if (schema instanceof z.ZodBoolean) {
    return 'boolean';
  }
  if (schema instanceof z.ZodDate) {
    return 'Date';
  }
  if (schema instanceof z.ZodEnum) {
    return 'string';
  }
  return null;
}

/**
 * Extracts acceptable values from z.enum
 */
function getAcceptableValues(schema: z.ZodTypeAny): string[] | null {
  if (schema instanceof z.ZodEnum) {
    return [...schema.options] as string[];
  }
  return null;
}

/**
 * Generates relations from entity definitions
 */
export function generateRelations(definitions: EntityDefinition[]): EntityRelation[] {
  const relations: EntityRelation[] = [];

  // Build a map for quick lookup
  const entityMap = new Map<string, EntityDefinition>();
  for (const def of definitions) {
    entityMap.set(def.name, def);
  }

  // Initialize relations for each entity
  for (const def of definitions) {
    const referTos: EntityRelationReferTo[] = [];
    const referredBys: EntityRelationReferredBy[] = [];

    // Find referTos (outgoing references)
    for (const prop of def.properties) {
      if (prop.isReference) {
        referTos.push({
          entityName: prop.targetEntityDefinitionName,
          propertyName: prop.name,
          isUnique: prop.isUnique,
        });
      }
    }

    // Find referredBys (incoming references)
    for (const otherDef of definitions) {
      if (otherDef.name === def.name) {
        continue;
      }

      for (const prop of otherDef.properties) {
        if (prop.isReference && prop.targetEntityDefinitionName === def.name) {
          referredBys.push({
            entityName: otherDef.name,
            propertyName: prop.name,
            isUnique: prop.isUnique,
          });
        }
      }
    }

    relations.push({
      entityName: def.name,
      referTos,
      referredBys,
    });
  }

  return relations;
}
