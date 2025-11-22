/**
 * Core generation logic for entity definitions and relations
 */
import { z } from 'zod';
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
      current = current._def.innerType;
    } else if (current instanceof z.ZodNullable) {
      isNullable = true;
      current = current._def.innerType;
    } else if (current instanceof z.ZodArray) {
      isArray = true;
      current = current._def.type;
    } else {
      break;
    }
  }

  return { innerSchema: current, isNullable, isArray };
}

/**
 * Generates entity definitions from Zod schemas
 */
export function generateEntities(schemas: z.ZodTypeAny[]): EntityDefinition[] {
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

  return definitions;
}

/**
 * Parses a single property from a Zod schema
 */
function parseProperty(fieldName: string, fieldSchema: z.ZodTypeAny): EntityPropertyDefinition {
  const isPk = isPrimaryKey(fieldSchema);
  const isUniqueField = isUnique(fieldSchema);
  const refMetadata = getRefMetadata(fieldSchema);

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

    const { isNullable } = unwrapSchema(fieldSchema);

    const property: EntityPropertyDefinitionReferencedObject = {
      isReference: true,
      name: fieldName,
      targetEntityDefinitionName: targetEntityName,
      isUnique: isUniqueField,
      isNullable,
    };
    return property;
  }

  // Unwrap the schema
  const { innerSchema, isNullable, isArray } = unwrapSchema(fieldSchema);

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
    return [...schema._def.values];
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
