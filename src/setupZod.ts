/**
 * Extends Zod schemas with metadata methods using declaration merging
 */
import { z } from 'zod';

// Symbols for metadata storage to avoid property name conflicts
const PK_SYMBOL = Symbol('zod-entity-pk');
const UNIQUE_SYMBOL = Symbol('zod-entity-unique');
const REF_SYMBOL = Symbol('zod-entity-ref');

export const METADATA_SYMBOLS = {
  PK: PK_SYMBOL,
  UNIQUE: UNIQUE_SYMBOL,
  REF: REF_SYMBOL,
} as const;

export type RefMetadata = {
  targetEntity: z.ZodTypeAny;
  targetColumn: string;
};

// Declare module augmentation for Zod types
declare module 'zod' {
  interface ZodType {
    [PK_SYMBOL]?: boolean;
    [UNIQUE_SYMBOL]?: boolean;
    [REF_SYMBOL]?: RefMetadata;

    pk(): this;
    unique(): this;
    ref(targetEntity: z.ZodTypeAny, targetColumn?: string): this;
  }
}

// Implement the methods on ZodType prototype
z.ZodType.prototype.pk = function () {
  this[PK_SYMBOL] = true;
  return this;
};

z.ZodType.prototype.unique = function () {
  this[UNIQUE_SYMBOL] = true;
  return this;
};

z.ZodType.prototype.ref = function (targetEntity: z.ZodTypeAny, targetColumn = 'id') {
  this[REF_SYMBOL] = { targetEntity, targetColumn };
  return this;
};

/**
 * Helper functions to check metadata
 */
export function isPrimaryKey(schema: z.ZodTypeAny): boolean {
  return schema[PK_SYMBOL] === true;
}

export function isUnique(schema: z.ZodTypeAny): boolean {
  return schema[UNIQUE_SYMBOL] === true;
}

export function getRefMetadata(schema: z.ZodTypeAny): RefMetadata | undefined {
  return schema[REF_SYMBOL];
}
