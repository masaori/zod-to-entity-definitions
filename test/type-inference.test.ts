import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { EntityDefinition } from '../src';
import { entity, generateEntities } from '../src';

describe('Type Inference', () => {
  it('should infer entity names in return type', () => {
    // Define entities with specific names
    const Company = entity({
      configType: 'entity',
      name: 'Company',
      columns: {
        id: z.string(),
      },
    });

    const Department = entity({
      configType: 'entity',
      name: 'Department',
      columns: {
        id: z.string(),
      },
    });

    const User = entity({
      configType: 'entity',
      name: 'User',
      columns: {
        id: z.string(),
      },
    });

    const Address = entity({
      configType: 'entity',
      name: 'Address',
      columns: {
        id: z.string(),
      },
    });

    // Generate entities
    const definitions = generateEntities([Company, Department, User, Address]);

    // Type test: definitions should have type EntityDefinition<'Company' | 'Department' | 'User' | 'Address'>[]
    type ExpectedType = EntityDefinition<'Company' | 'Department' | 'User' | 'Address'>[];
    type ActualType = typeof definitions;

    // This assertion verifies that the types are compatible
    const typeCheck: ActualType extends ExpectedType ? true : false = true;
    expect(typeCheck).toBe(true);

    // Runtime test: verify the actual values
    expect(definitions).toHaveLength(4);
    expect(definitions[0].name).toBe('Company');
    expect(definitions[1].name).toBe('Department');
    expect(definitions[2].name).toBe('User');
    expect(definitions[3].name).toBe('Address');

    // Type narrowing test: name should be a union of the specific entity names
    const firstDef = definitions[0];
    const name: 'Company' | 'Department' | 'User' | 'Address' = firstDef.name;
    expect(['Company', 'Department', 'User', 'Address']).toContain(name);
  });

  it('should work with a single entity', () => {
    const User = entity({
      configType: 'entity',
      name: 'User',
      columns: {
        id: z.string(),
      },
    });

    const definitions = generateEntities([User]);

    // Type test: definitions should have type EntityDefinition<'User'>[]
    type ExpectedType = EntityDefinition<'User'>[];
    type ActualType = typeof definitions;

    const typeCheck: ActualType extends ExpectedType ? true : false = true;
    expect(typeCheck).toBe(true);

    // Runtime test
    expect(definitions).toHaveLength(1);
    expect(definitions[0].name).toBe('User');

    // Type narrowing test
    const firstDef = definitions[0];
    const name: 'User' = firstDef.name;
    expect(name).toBe('User');
  });

  it('should handle mixed entity and non-entity schemas', () => {
    const Company = entity({
      configType: 'entity',
      name: 'Company',
      columns: {
        id: z.string(),
      },
    });

    const User = entity({
      configType: 'entity',
      name: 'User',
      columns: {
        id: z.string(),
      },
    });

    // Non-entity schema (plain Zod object)
    const NonEntity = z.object({
      id: z.string(),
    });

    // Generate entities (NonEntity should be filtered out)
    const definitions = generateEntities([Company, User, NonEntity]);

    // Only entities should be included
    expect(definitions).toHaveLength(2);
    expect(definitions[0].name).toBe('Company');
    expect(definitions[1].name).toBe('User');
  });
});
