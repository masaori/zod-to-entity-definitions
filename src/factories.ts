/**
 * Factory functions for creating entity and struct schemas
 */
import { z } from 'zod';

// Symbols for schema metadata
const SCHEMA_TYPE_SYMBOL = Symbol('zod-schema-type');
const SCHEMA_NAME_SYMBOL = Symbol('zod-schema-name');
const SCHEMA_DESCRIPTION_SYMBOL = Symbol('zod-schema-description');

export const SCHEMA_METADATA_SYMBOLS = {
  TYPE: SCHEMA_TYPE_SYMBOL,
  NAME: SCHEMA_NAME_SYMBOL,
  DESCRIPTION: SCHEMA_DESCRIPTION_SYMBOL,
} as const;

export type EntityConfig<T extends z.ZodRawShape> = {
  configType: 'entity';
  name: string;
  description?: string;
  columns: T;
};

export type StructConfig<T extends z.ZodRawShape> = {
  configType: 'struct';
  name: string;
  description?: string;
  columns: T;
};

// Augment ZodObject to store metadata
// Note: Using bracket notation to add properties at runtime, avoiding type parameter conflicts
type ZodObjectWithMetadata = z.ZodObject<z.ZodRawShape> & {
  [SCHEMA_TYPE_SYMBOL]?: 'entity' | 'struct';
  [SCHEMA_NAME_SYMBOL]?: string;
  [SCHEMA_DESCRIPTION_SYMBOL]?: string;
};

/**
 * Creates an entity schema with metadata
 */
export function entity<T extends z.ZodRawShape>(config: EntityConfig<T>): z.ZodObject<T> {
  const schema = z.object(config.columns) as ZodObjectWithMetadata;
  schema[SCHEMA_TYPE_SYMBOL] = 'entity';
  schema[SCHEMA_NAME_SYMBOL] = config.name;
  if (config.description !== undefined) {
    schema[SCHEMA_DESCRIPTION_SYMBOL] = config.description;
  }
  return schema as z.ZodObject<T>;
}

/**
 * Creates a struct schema with metadata
 */
export function struct<T extends z.ZodRawShape>(config: StructConfig<T>): z.ZodObject<T> {
  const schema = z.object(config.columns) as ZodObjectWithMetadata;
  schema[SCHEMA_TYPE_SYMBOL] = 'struct';
  schema[SCHEMA_NAME_SYMBOL] = config.name;
  if (config.description !== undefined) {
    schema[SCHEMA_DESCRIPTION_SYMBOL] = config.description;
  }
  return schema as z.ZodObject<T>;
}

/**
 * Helper functions to check schema metadata
 */
export function getSchemaType(schema: z.ZodTypeAny): 'entity' | 'struct' | undefined {
  if (schema instanceof z.ZodObject) {
    return (schema as ZodObjectWithMetadata)[SCHEMA_TYPE_SYMBOL];
  }
  return undefined;
}

export function getSchemaName(schema: z.ZodTypeAny): string | undefined {
  if (schema instanceof z.ZodObject) {
    return (schema as ZodObjectWithMetadata)[SCHEMA_NAME_SYMBOL];
  }
  return undefined;
}

export function getSchemaDescription(schema: z.ZodTypeAny): string | undefined {
  if (schema instanceof z.ZodObject) {
    return (schema as ZodObjectWithMetadata)[SCHEMA_DESCRIPTION_SYMBOL];
  }
  return undefined;
}
