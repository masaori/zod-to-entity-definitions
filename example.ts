/**
 * Example usage of zod-to-entity-definitions
 *
 * Run this file with:
 * npx tsx example.ts
 */

import { z } from 'zod';
import { entity, struct, generateEntities, generateRelations } from './src/index';

// 1. Define a Struct (reusable component)
const Address = struct({
  configType: 'struct',
  name: 'AddressStruct',
  description: 'Common address structure',
  columns: {
    city: z.string(),
    street: z.string(),
    zipCode: z.string().optional(),
  },
});

// 2. Define Entities
const Company = entity({
  configType: 'entity',
  name: 'Company',
  description: 'Company entity',
  columns: {
    id: z.string().pk(),
    name: z.string(),
    address: Address,
    founded: z.date(),
  },
});

const Department = entity({
  configType: 'entity',
  name: 'Department',
  columns: {
    id: z.string().pk(),
    name: z.string(),
    companyId: z.string().ref(Company),
  },
});

const User = entity({
  configType: 'entity',
  name: 'User',
  description: 'User entity representing employees',
  columns: {
    id: z.string().pk(),
    email: z.string().email().unique(),
    name: z.string(),
    role: z.enum(['admin', 'manager', 'employee']),
    departmentId: z.string().ref(Department),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean(),
  },
});

// 3. Generate Entity Definitions
console.log('='.repeat(60));
console.log('ENTITY DEFINITIONS');
console.log('='.repeat(60));
const definitions = generateEntities([Company, Department, User, Address]);
console.log(JSON.stringify(definitions, null, 2));

// 4. Generate Relations
console.log('\n' + '='.repeat(60));
console.log('ENTITY RELATIONS');
console.log('='.repeat(60));
const relations = generateRelations(definitions);
console.log(JSON.stringify(relations, null, 2));

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Total Entities: ${definitions.length}`);
console.log(`Total Relations: ${relations.length}`);
console.log(`\nEntities: ${definitions.map((d) => d.name).join(', ')}`);
