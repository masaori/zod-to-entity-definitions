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

/**
 * A reference target, given either directly or as a thunk.
 *
 * The thunk form exists because entity references form cycles in most real schemas
 * (`Order.userId -> User` and `User.lastOrderId -> Order`). A direct reference has to
 * evaluate the target at module-eval time, which throws for whichever side of the cycle
 * is initialized second. A thunk defers the lookup until `generateEntities()` runs, by
 * which point every module has finished evaluating.
 */
export type RefTarget = z.ZodTypeAny | (() => z.ZodTypeAny);

export type RefMetadata = {
  targetEntity: RefTarget;
  targetColumn: string;
};

/** Resolves a reference target, calling it if it was given as a thunk. */
export function resolveRefTarget(target: RefTarget): z.ZodTypeAny {
  return typeof target === 'function' ? target() : target;
}

// Declare module augmentation for Zod types
declare module 'zod' {
  interface ZodType {
    [PK_SYMBOL]?: boolean;
    [UNIQUE_SYMBOL]?: boolean;
    [REF_SYMBOL]?: RefMetadata;

    pk(): this;
    unique(): this;
    ref(targetEntity: RefTarget, targetColumn?: string): this;
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

z.ZodType.prototype.ref = function (targetEntity: RefTarget, targetColumn = 'id') {
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
