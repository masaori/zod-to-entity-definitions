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
  name: string;
  description?: string;
  columns: T;
};

export type StructConfig<T extends z.ZodRawShape> = {
  name: string;
  description?: string;
  columns: T;
};

export type JsonConfig<T extends z.ZodTypeAny> = {
  name: string;
  description?: string;
  schema: T;
};

// Augment ZodType to store metadata
// Note: Using bracket notation to add properties at runtime, avoiding type parameter conflicts
type ZodTypeWithMetadata = z.ZodTypeAny & {
  [SCHEMA_TYPE_SYMBOL]?: 'entity' | 'struct' | 'json';
  [SCHEMA_NAME_SYMBOL]?: string;
  [SCHEMA_DESCRIPTION_SYMBOL]?: string;
};

// Branded type to carry entity name at type level
declare const ENTITY_NAME_BRAND: unique symbol;
export type EntitySchema<
  TName extends string,
  TShape extends z.ZodRawShape,
> = z.ZodObject<TShape> & {
  readonly [ENTITY_NAME_BRAND]: TName;
};

/**
 * Creates an entity schema with metadata
 */
export function entity<const TConfig extends EntityConfig<z.ZodRawShape>>(
  config: TConfig
): EntitySchema<TConfig['name'], TConfig['columns']> {
  const schema = z.object(config.columns) as ZodTypeWithMetadata;
  schema[SCHEMA_TYPE_SYMBOL] = 'entity';
  schema[SCHEMA_NAME_SYMBOL] = config.name;
  if (config.description !== undefined) {
    schema[SCHEMA_DESCRIPTION_SYMBOL] = config.description;
  }
  return schema as EntitySchema<TConfig['name'], TConfig['columns']>;
}

/**
 * Creates a struct schema with metadata
 * @deprecated Use `json()` instead, which accepts any Zod schema via the `schema` parameter
 */
export function struct<T extends z.ZodRawShape>(config: StructConfig<T>): z.ZodObject<T> {
  const schema = z.object(config.columns) as ZodTypeWithMetadata;
  schema[SCHEMA_TYPE_SYMBOL] = 'struct';
  schema[SCHEMA_NAME_SYMBOL] = config.name;
  if (config.description !== undefined) {
    schema[SCHEMA_DESCRIPTION_SYMBOL] = config.description;
  }
  return schema as z.ZodObject<T>;
}

/**
 * Creates a json schema with metadata, accepting any Zod schema
 */
export function json<T extends z.ZodTypeAny>(config: JsonConfig<T>): T {
  const schema = config.schema as ZodTypeWithMetadata;
  schema[SCHEMA_TYPE_SYMBOL] = 'json';
  schema[SCHEMA_NAME_SYMBOL] = config.name;
  if (config.description !== undefined) {
    schema[SCHEMA_DESCRIPTION_SYMBOL] = config.description;
  }
  return config.schema;
}

/**
 * Helper functions to check schema metadata
 */
export function getSchemaType(schema: z.ZodTypeAny): 'entity' | 'struct' | 'json' | undefined {
  return (schema as ZodTypeWithMetadata)[SCHEMA_TYPE_SYMBOL];
}

export function getSchemaName(schema: z.ZodTypeAny): string | undefined {
  return (schema as ZodTypeWithMetadata)[SCHEMA_NAME_SYMBOL];
}

export function getSchemaDescription(schema: z.ZodTypeAny): string | undefined {
  return (schema as ZodTypeWithMetadata)[SCHEMA_DESCRIPTION_SYMBOL];
}
