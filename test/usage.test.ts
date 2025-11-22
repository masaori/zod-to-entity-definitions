import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { entity, generateEntities, generateRelations, struct } from '../src';

describe('zod-to-entity-definitions', () => {
  describe('Basic Usage', () => {
    it('should define entities and generate definitions', () => {
      // Define a Struct
      const Address = struct({
        configType: 'struct',
        name: 'AddressStruct',
        description: 'Common address',
        columns: {
          city: z.string(),
          street: z.string(),
        },
      });

      // Define Entities
      const Company = entity({
        configType: 'entity',
        name: 'Company',
        columns: {
          id: z.string().pk(),
          name: z.string(),
          address: Address,
        },
      });

      const User = entity({
        configType: 'entity',
        name: 'User',
        columns: {
          id: z.string().pk(),
          email: z.string().email().unique(),
          companyId: z.string().ref(Company),
        },
      });

      // Generate definitions
      const definitions = generateEntities([Company, User, Address]);

      expect(definitions).toHaveLength(2);

      // Check Company entity
      const companyDef = definitions.find((d) => d.name === 'Company');
      expect(companyDef).toBeDefined();
      expect(companyDef?.description).toBe(undefined);
      expect(companyDef?.properties).toHaveLength(3);

      const companyId = companyDef?.properties.find((p) => p.name === 'id');
      expect(companyId).toMatchObject({
        isReference: false,
        propertyType: 'Id',
        name: 'id',
      });

      const companyName = companyDef?.properties.find((p) => p.name === 'name');
      expect(companyName).toMatchObject({
        isReference: false,
        propertyType: 'string',
        name: 'name',
        isUnique: false,
        isNullable: false,
        isArray: false,
      });

      const companyAddress = companyDef?.properties.find((p) => p.name === 'address');
      expect(companyAddress).toMatchObject({
        isReference: false,
        propertyType: 'typedStruct',
        name: 'address',
        structTypeName: 'AddressStruct',
        isUnique: false,
        isNullable: false,
        isArray: false,
      });

      // Check User entity
      const userDef = definitions.find((d) => d.name === 'User');
      expect(userDef).toBeDefined();
      expect(userDef?.properties).toHaveLength(3);

      const userId = userDef?.properties.find((p) => p.name === 'id');
      expect(userId).toMatchObject({
        isReference: false,
        propertyType: 'Id',
        name: 'id',
      });

      const userEmail = userDef?.properties.find((p) => p.name === 'email');
      expect(userEmail).toMatchObject({
        isReference: false,
        propertyType: 'string',
        name: 'email',
        isUnique: true,
        isNullable: false,
        isArray: false,
      });

      const userCompanyId = userDef?.properties.find((p) => p.name === 'companyId');
      expect(userCompanyId).toMatchObject({
        isReference: true,
        name: 'companyId',
        targetEntityDefinitionName: 'Company',
        isUnique: false,
        isNullable: false,
      });
    });

    it('should generate relations', () => {
      const Company = entity({
        configType: 'entity',
        name: 'Company',
        columns: {
          id: z.string().pk(),
          name: z.string(),
        },
      });

      const User = entity({
        configType: 'entity',
        name: 'User',
        columns: {
          id: z.string().pk(),
          email: z.string().email().unique(),
          companyId: z.string().ref(Company),
        },
      });

      const definitions = generateEntities([Company, User]);
      const relations = generateRelations(definitions);

      expect(relations).toHaveLength(2);

      // Check User relations
      const userRelation = relations.find((r) => r.entityName === 'User');
      expect(userRelation).toBeDefined();
      expect(userRelation?.referTos).toHaveLength(1);
      expect(userRelation?.referTos[0]).toMatchObject({
        entityName: 'Company',
        propertyName: 'companyId',
        isUnique: false,
      });
      expect(userRelation?.referredBys).toHaveLength(0);

      // Check Company relations
      const companyRelation = relations.find((r) => r.entityName === 'Company');
      expect(companyRelation).toBeDefined();
      expect(companyRelation?.referTos).toHaveLength(0);
      expect(companyRelation?.referredBys).toHaveLength(1);
      expect(companyRelation?.referredBys[0]).toMatchObject({
        entityName: 'User',
        propertyName: 'companyId',
        isUnique: false,
      });
    });
  });

  describe('Error Cases', () => {
    it('should throw error when entity is directly nested', () => {
      const Company = entity({
        configType: 'entity',
        name: 'Company',
        columns: {
          id: z.string().pk(),
          name: z.string(),
        },
      });

      const User = entity({
        configType: 'entity',
        name: 'User',
        columns: {
          id: z.string().pk(),
          company: Company, // Direct nesting not allowed
        },
      });

      expect(() => generateEntities([User, Company])).toThrow('contains a direct entity embedding');
    });

    it('should throw error when .ref() points to non-entity', () => {
      const Address = struct({
        configType: 'struct',
        name: 'AddressStruct',
        columns: {
          city: z.string(),
        },
      });

      const User = entity({
        configType: 'entity',
        name: 'User',
        columns: {
          id: z.string().pk(),
          addressId: z.string().ref(Address), // Struct is not allowed
        },
      });

      expect(() => generateEntities([User, Address])).toThrow('pointing to a non-entity schema');
    });

    it('should throw error when .ref() points to raw Zod object', () => {
      const rawObject = z.object({
        id: z.string(),
      });

      const User = entity({
        configType: 'entity',
        name: 'User',
        columns: {
          id: z.string().pk(),
          refId: z.string().ref(rawObject),
        },
      });

      expect(() => generateEntities([User])).toThrow('pointing to a non-entity schema');
    });
  });

  describe('Advanced Features', () => {
    it('should handle nullable and optional fields', () => {
      const User = entity({
        configType: 'entity',
        name: 'User',
        columns: {
          id: z.string().pk(),
          nickname: z.string().optional(),
          bio: z.string().nullable(),
        },
      });

      const definitions = generateEntities([User]);
      const userDef = definitions[0];

      const nickname = userDef?.properties.find((p) => p.name === 'nickname');
      expect(nickname).toMatchObject({
        isReference: false,
        propertyType: 'string',
        name: 'nickname',
        isNullable: true,
      });

      const bio = userDef?.properties.find((p) => p.name === 'bio');
      expect(bio).toMatchObject({
        isReference: false,
        propertyType: 'string',
        name: 'bio',
        isNullable: true,
      });
    });

    it('should handle array fields', () => {
      const User = entity({
        configType: 'entity',
        name: 'User',
        columns: {
          id: z.string().pk(),
          tags: z.array(z.string()),
          scores: z.array(z.number()).optional(),
        },
      });

      const definitions = generateEntities([User]);
      const userDef = definitions[0];

      const tags = userDef?.properties.find((p) => p.name === 'tags');
      expect(tags).toMatchObject({
        isReference: false,
        propertyType: 'string',
        name: 'tags',
        isArray: true,
        isNullable: false,
      });

      const scores = userDef?.properties.find((p) => p.name === 'scores');
      expect(scores).toMatchObject({
        isReference: false,
        propertyType: 'number',
        name: 'scores',
        isArray: true,
        isNullable: true,
      });
    });

    it('should handle enum fields', () => {
      const User = entity({
        configType: 'entity',
        name: 'User',
        columns: {
          id: z.string().pk(),
          role: z.enum(['admin', 'user', 'guest']),
        },
      });

      const definitions = generateEntities([User]);
      const userDef = definitions[0];

      const role = userDef?.properties.find((p) => p.name === 'role');
      expect(role).toMatchObject({
        isReference: false,
        propertyType: 'string',
        name: 'role',
        acceptableValues: ['admin', 'user', 'guest'],
      });
    });

    it('should handle various primitive types', () => {
      const Entity1 = entity({
        configType: 'entity',
        name: 'Entity1',
        columns: {
          id: z.string().pk(),
          flag: z.boolean(),
          count: z.number(),
          createdAt: z.date(),
        },
      });

      const definitions = generateEntities([Entity1]);
      const def = definitions[0];

      const flag = def?.properties.find((p) => p.name === 'flag');
      expect(flag).toMatchObject({
        propertyType: 'boolean',
      });

      const count = def?.properties.find((p) => p.name === 'count');
      expect(count).toMatchObject({
        propertyType: 'number',
      });

      const createdAt = def?.properties.find((p) => p.name === 'createdAt');
      expect(createdAt).toMatchObject({
        propertyType: 'Date',
      });
    });

    it('should handle complex relations', () => {
      const Department = entity({
        configType: 'entity',
        name: 'Department',
        columns: {
          id: z.string().pk(),
          name: z.string(),
        },
      });

      const Employee = entity({
        configType: 'entity',
        name: 'Employee',
        columns: {
          id: z.string().pk(),
          name: z.string(),
          departmentId: z.string().ref(Department),
        },
      });

      const Project = entity({
        configType: 'entity',
        name: 'Project',
        columns: {
          id: z.string().pk(),
          name: z.string(),
          leadId: z.string().ref(Employee),
          departmentId: z.string().ref(Department),
        },
      });

      const definitions = generateEntities([Department, Employee, Project]);
      const relations = generateRelations(definitions);

      // Check Department relations
      const deptRelation = relations.find((r) => r.entityName === 'Department');
      expect(deptRelation?.referTos).toHaveLength(0);
      expect(deptRelation?.referredBys.length).toBeGreaterThanOrEqual(2);

      // Check Employee relations
      const empRelation = relations.find((r) => r.entityName === 'Employee');
      expect(empRelation?.referTos).toHaveLength(1);
      expect(empRelation?.referredBys).toHaveLength(1);

      // Check Project relations
      const projRelation = relations.find((r) => r.entityName === 'Project');
      expect(projRelation?.referTos).toHaveLength(2);
      expect(projRelation?.referredBys).toHaveLength(0);
    });
  });
});
