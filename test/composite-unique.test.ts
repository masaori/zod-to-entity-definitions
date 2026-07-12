import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { entity, generateEntities } from '../src';

describe('composite unique constraints', () => {
  it('should emit compositeUniqueConstraints for a single composite unique', () => {
    const Offering = entity({
      name: 'Offering',
      columns: {
        id: z.string().pk(),
        productVariantId: z.string(),
        customerSegmentId: z.string(),
        price: z.number(),
      },
      uniques: [['productVariantId', 'customerSegmentId']],
    });

    const [def] = generateEntities([Offering]);
    expect(def?.compositeUniqueConstraints).toEqual([['productVariantId', 'customerSegmentId']]);
  });

  it('should support multiple composite unique constraints', () => {
    const Rate = entity({
      name: 'Rate',
      columns: {
        id: z.string().pk(),
        segmentId: z.string(),
        zoneId: z.string(),
        method: z.string(),
        code: z.string(),
        version: z.string(),
      },
      uniques: [
        ['segmentId', 'zoneId', 'method'],
        ['code', 'version'],
      ],
    });

    const [def] = generateEntities([Rate]);
    expect(def?.compositeUniqueConstraints).toEqual([
      ['segmentId', 'zoneId', 'method'],
      ['code', 'version'],
    ]);
  });

  it('should omit compositeUniqueConstraints when no uniques are declared', () => {
    const Plain = entity({
      name: 'Plain',
      columns: {
        id: z.string().pk(),
        name: z.string(),
      },
    });

    const [def] = generateEntities([Plain]);
    expect(def?.compositeUniqueConstraints).toBeUndefined();
    // Existing consumers relying on JSON shape must not see the key at all
    expect(Object.hasOwn(def ?? {}, 'compositeUniqueConstraints')).toBe(false);
  });

  it('should not affect single-column uniqueness (still on the property)', () => {
    const User = entity({
      name: 'User',
      columns: {
        id: z.string().pk(),
        email: z.string().unique(),
        tenantId: z.string(),
        externalId: z.string(),
      },
      uniques: [['tenantId', 'externalId']],
    });

    const [def] = generateEntities([User]);
    const email = def?.properties.find((p) => p.name === 'email');
    expect(email).toMatchObject({ name: 'email', isUnique: true });
    expect(def?.compositeUniqueConstraints).toEqual([['tenantId', 'externalId']]);
  });

  it('should throw when a composite unique has fewer than 2 columns', () => {
    const Bad = entity({
      name: 'Bad',
      columns: {
        id: z.string().pk(),
        a: z.string(),
      },
      uniques: [['a']],
    });

    expect(() => generateEntities([Bad])).toThrow('fewer than 2 columns');
  });

  it('should throw when a composite unique references an unknown column', () => {
    const columns = {
      id: z.string().pk(),
      a: z.string(),
      b: z.string(),
    };
    const Bad = entity({
      name: 'Bad',
      columns,
      // Bypass the compile-time keyof guard to exercise the runtime validation
      uniques: [['a', 'nonexistent']] as unknown as (keyof typeof columns & string)[][],
    });

    expect(() => generateEntities([Bad])).toThrow('unknown column "nonexistent"');
  });

  it('should throw when a composite unique has duplicate columns', () => {
    const Bad = entity({
      name: 'Bad',
      columns: {
        id: z.string().pk(),
        a: z.string(),
        b: z.string(),
      },
      uniques: [['a', 'a']],
    });

    expect(() => generateEntities([Bad])).toThrow('duplicate columns');
  });
});
