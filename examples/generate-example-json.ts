/**
 * Script to generate example JSON output files from entity definitions
 *
 * Run this file with:
 * npx tsx examples/generate-example-json.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { entity, generateEntities, generateRelations, struct } from '../src/index';

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
const definitions = generateEntities([Company, Department, User, Address]);

// 4. Generate Relations
const relations = generateRelations(definitions);

// 5. Write JSON files
const outputDir = join(__dirname);

writeFileSync(
  join(outputDir, 'entity-definitions.json'),
  JSON.stringify(definitions, null, 2),
  'utf-8'
);

writeFileSync(
  join(outputDir, 'entity-relations.json'),
  JSON.stringify(relations, null, 2),
  'utf-8'
);

console.log('✅ Generated JSON files:');
console.log('  - examples/entity-definitions.json');
console.log('  - examples/entity-relations.json');
console.log(`\n📊 Summary:`);
console.log(`  - Total Entities: ${definitions.length}`);
console.log(`  - Total Relations: ${relations.length}`);
console.log(`  - Entities: ${definitions.map((d) => d.name).join(', ')}`);
