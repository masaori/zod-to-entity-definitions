import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { entity, generateEntities, generateRelations } from '../src';

describe('ref().nullable() order independence', () => {
  const Company = entity({
    name: 'Company',
    columns: {
      id: z.string().pk(),
      name: z.string(),
    },
  });

  it('should recognize .ref().nullable() as a reference', () => {
    const User = entity({
      name: 'User',
      columns: {
        id: z.string().pk(),
        companyId: z.string().ref(Company).nullable(),
      },
    });

    const definitions = generateEntities([Company, User]);
    const userDef = definitions.find((d) => d.name === 'User');
    const companyIdProp = userDef?.properties.find((p) => p.name === 'companyId');

    expect(companyIdProp).toMatchObject({
      isReference: true,
      name: 'companyId',
      targetEntityDefinitionName: 'Company',
      isNullable: true,
    });
  });

  it('should recognize .nullable().ref() as a reference', () => {
    const User = entity({
      name: 'User',
      columns: {
        id: z.string().pk(),
        companyId: z.string().nullable().ref(Company),
      },
    });

    const definitions = generateEntities([Company, User]);
    const userDef = definitions.find((d) => d.name === 'User');
    const companyIdProp = userDef?.properties.find((p) => p.name === 'companyId');

    expect(companyIdProp).toMatchObject({
      isReference: true,
      name: 'companyId',
      targetEntityDefinitionName: 'Company',
      isNullable: true,
    });
  });

  it('should recognize .ref().optional() as a reference', () => {
    const User = entity({
      name: 'User',
      columns: {
        id: z.string().pk(),
        companyId: z.string().ref(Company).optional(),
      },
    });

    const definitions = generateEntities([Company, User]);
    const userDef = definitions.find((d) => d.name === 'User');
    const companyIdProp = userDef?.properties.find((p) => p.name === 'companyId');

    expect(companyIdProp).toMatchObject({
      isReference: true,
      name: 'companyId',
      targetEntityDefinitionName: 'Company',
      isNullable: true,
    });
  });

  it('should recognize .optional().ref() as a reference', () => {
    const User = entity({
      name: 'User',
      columns: {
        id: z.string().pk(),
        companyId: z.string().optional().ref(Company),
      },
    });

    const definitions = generateEntities([Company, User]);
    const userDef = definitions.find((d) => d.name === 'User');
    const companyIdProp = userDef?.properties.find((p) => p.name === 'companyId');

    expect(companyIdProp).toMatchObject({
      isReference: true,
      name: 'companyId',
      targetEntityDefinitionName: 'Company',
      isNullable: true,
    });
  });

  it('should generate correct relations for .ref().nullable()', () => {
    const User = entity({
      name: 'User',
      columns: {
        id: z.string().pk(),
        companyId: z.string().ref(Company).nullable(),
      },
    });

    const definitions = generateEntities([Company, User]);
    const relations = generateRelations(definitions);

    const userRelation = relations.find((r) => r.entityName === 'User');
    expect(userRelation?.referTos).toHaveLength(1);
    expect(userRelation?.referTos[0]).toMatchObject({
      entityName: 'Company',
      propertyName: 'companyId',
    });

    const companyRelation = relations.find((r) => r.entityName === 'Company');
    expect(companyRelation?.referredBys).toHaveLength(1);
    expect(companyRelation?.referredBys[0]).toMatchObject({
      entityName: 'User',
      propertyName: 'companyId',
    });
  });
});
