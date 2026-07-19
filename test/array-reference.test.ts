import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { entity, generateEntities, generateRelations } from '../src';

describe('array foreign key references', () => {
  const Product = entity({
    name: 'Product',
    columns: {
      id: z.string().pk(),
      name: z.string(),
    },
  });

  const bundleProp = (columns: z.ZodRawShape, propertyName = 'productIds') => {
    const Bundle = entity({ name: 'Bundle', columns: { id: z.string().pk(), ...columns } });
    const definitions = generateEntities([Product, Bundle]);
    const bundleDef = definitions.find((d) => d.name === 'Bundle');
    return bundleDef?.properties.find((p) => p.name === propertyName);
  };

  it('marks an array reference (element .ref()) with isArray: true', () => {
    const prop = bundleProp({ productIds: z.array(z.string().ref(Product)) });
    expect(prop).toMatchObject({
      isReference: true,
      name: 'productIds',
      targetEntityDefinitionName: 'Product',
      isUnique: false,
      isNullable: false,
      isArray: true,
    });
  });

  it('recognizes .ref().array() as an array reference', () => {
    const prop = bundleProp({ productIds: z.string().ref(Product).array() });
    expect(prop).toMatchObject({
      isReference: true,
      targetEntityDefinitionName: 'Product',
      isArray: true,
    });
  });

  it('recognizes .ref() applied to the array schema (z.array(...).ref())', () => {
    const prop = bundleProp({ productIds: z.array(z.string()).ref(Product) });
    expect(prop).toMatchObject({
      isReference: true,
      targetEntityDefinitionName: 'Product',
      isArray: true,
    });
  });

  it('handles a nullable array reference', () => {
    const prop = bundleProp({ productIds: z.array(z.string().ref(Product)).nullable() });
    expect(prop).toMatchObject({
      isReference: true,
      targetEntityDefinitionName: 'Product',
      isArray: true,
      isNullable: true,
    });
  });

  it('does NOT add isArray to a single (scalar) reference — backward compatible', () => {
    const prop = bundleProp({ productId: z.string().ref(Product) }, 'productId');
    expect(prop).toMatchObject({ isReference: true, targetEntityDefinitionName: 'Product' });
    expect(prop).not.toHaveProperty('isArray');
  });

  it('propagates isArray into relations (referTos and referredBys)', () => {
    const Bundle = entity({
      name: 'Bundle',
      columns: { id: z.string().pk(), productIds: z.array(z.string().ref(Product)) },
    });
    const relations = generateRelations(generateEntities([Product, Bundle]));

    const bundleRelation = relations.find((r) => r.entityName === 'Bundle');
    expect(bundleRelation?.referTos).toHaveLength(1);
    expect(bundleRelation?.referTos[0]).toMatchObject({
      entityName: 'Product',
      propertyName: 'productIds',
      isUnique: false,
      isArray: true,
    });

    const productRelation = relations.find((r) => r.entityName === 'Product');
    expect(productRelation?.referredBys).toHaveLength(1);
    expect(productRelation?.referredBys[0]).toMatchObject({
      entityName: 'Bundle',
      propertyName: 'productIds',
      isUnique: false,
      isArray: true,
    });
  });

  it('does NOT add isArray to relations for single references — backward compatible', () => {
    const User = entity({
      name: 'User',
      columns: { id: z.string().pk(), productId: z.string().ref(Product) },
    });
    const relations = generateRelations(generateEntities([Product, User]));

    const userRelation = relations.find((r) => r.entityName === 'User');
    expect(userRelation?.referTos[0]).not.toHaveProperty('isArray');

    const productRelation = relations.find((r) => r.entityName === 'Product');
    expect(productRelation?.referredBys[0]).not.toHaveProperty('isArray');
  });
});
