/**
 * Type definitions for Entity Definitions and Relations
 */

export type EntityDefinition<TEntityNames = string> = {
  name: TEntityNames;
  description?: string;
  properties: EntityPropertyDefinition[];
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
  description?: string;
};

export type EntityRelationReferTo<T = string> = {
  entityName: T;
  propertyName: string;
  isUnique: boolean;
};

export type EntityRelationReferredBy<T = string> = {
  entityName: T;
  propertyName: string;
  isUnique: boolean;
};

export type EntityRelation<T = string> = {
  entityName: T;
  referTos: EntityRelationReferTo<T>[];
  referredBys: EntityRelationReferredBy<T>[];
};
