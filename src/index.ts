/**
 * Main entry point for zod-to-entity-definitions
 */

// Setup Zod extensions (must be imported first to apply augmentations)
import './setupZod';

// Export factories
export { entity, struct } from './factories';
export type { EntityConfig, StructConfig } from './factories';

// Export generators
export { generateEntities, generateRelations } from './generator';

// Export types
export type {
  EntityDefinition,
  EntityPropertyDefinition,
  EntityPropertyDefinitionId,
  EntityPropertyDefinitionPrimitive,
  EntityPropertyDefinitionTypedStruct,
  EntityPropertyDefinitionReferencedObject,
  EntityRelation,
  EntityRelationReferTo,
  EntityRelationReferredBy,
} from './types';
