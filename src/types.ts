/**
 * Type definitions for Entity Definitions and Relations
 */

export type EntityDefinition<TEntityNames = string> = {
  name: TEntityNames;
  description?: string;
  properties: EntityPropertyDefinition[];
  /**
   * Composite (multi-column) unique constraints declared via `entity({ uniques: [...] })`.
   * Each inner array lists the column names that together must be unique.
   * Single-column uniqueness is represented by `isUnique` on the property instead.
   * Omitted when the entity declares no composite unique constraints.
   */
  compositeUniqueConstraints?: string[][];
};

export type EntityPropertyDefinition =
  | EntityPropertyDefinitionPrimaryKey
  | EntityPropertyDefinitionPrimitive
  | EntityPropertyDefinitionTypedStruct
  | EntityPropertyDefinitionReferencedObject;

export type EntityPropertyDefinitionPrimaryKey = {
  isReference: false;
  propertyType: 'PrimaryKey';
  name: string;
  description?: string;
};

export type EntityPropertyDefinitionPrimitive = {
  isReference: false;
  propertyType: 'boolean' | 'number' | 'string' | 'Date' | 'struct';
  name: string;
  isUnique: boolean;
  isNullable: boolean;
  isArray: boolean;
  acceptableValues: string[] | null;
  description?: string;
};

export type EntityPropertyDefinitionTypedStruct = {
  isReference: false;
  propertyType: 'typedStruct';
  name: string;
  structTypeName: string;
  isUnique: boolean;
  isNullable: boolean;
  isArray: boolean;
  description?: string;
};

export type EntityPropertyDefinitionReferencedObject = {
  isReference: true;
  name: string;
  targetEntityDefinitionName: string;
  isUnique: boolean;
  isNullable: boolean;
  /**
   * Present and `true` only when the reference is an array (a to-many foreign key,
   * e.g. `z.array(z.string().ref(Product))`). Omitted for single (scalar) references.
   * Kept optional and emitted only when `true` so that existing single-reference output
   * is unchanged (backward compatible).
   */
  isArray?: boolean;
  description?: string;
};

export type EntityRelationReferTo<T = string> = {
  entityName: T;
  propertyName: string;
  isUnique: boolean;
  /**
   * Present and `true` only when the referencing property is an array (to-many).
   * Omitted for single references (backward compatible).
   */
  isArray?: boolean;
};

export type EntityRelationReferredBy<T = string> = {
  entityName: T;
  propertyName: string;
  isUnique: boolean;
  /**
   * Present and `true` only when the referencing property on the other entity is an array
   * (to-many). Omitted for single references (backward compatible).
   */
  isArray?: boolean;
};

export type EntityRelation<T = string> = {
  entityName: T;
  referTos: EntityRelationReferTo<T>[];
  referredBys: EntityRelationReferredBy<T>[];
};
