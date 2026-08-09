import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { entity, generateEntities, generateRelations } from '../src';

describe('lazy (thunk) references', () => {
  it('resolves a thunk target to the same definition as a direct target', () => {
    const Author = entity({ name: 'Author', columns: { id: z.string().pk() } });
    const Direct = entity({
      name: 'Direct',
      columns: { id: z.string().pk(), authorId: z.string().ref(Author) },
    });
    const Lazy = entity({
      name: 'Lazy',
      columns: { id: z.string().pk(), authorId: z.string().ref(() => Author) },
    });

    const [directDef, lazyDef] = [generateEntities([Direct])[0], generateEntities([Lazy])[0]];

    expect(lazyDef?.properties[1]).toEqual({ ...directDef?.properties[1] });
  });

  it('expresses a reference cycle that a direct target cannot', () => {
    // `User.lastOrderId -> Order` and `Order.userId -> User`. With direct targets one side
    // has to name a binding that is still in its temporal dead zone.
    const User = entity({
      name: 'User',
      columns: {
        id: z.string().pk(),
        lastOrderId: z
          .string()
          .ref(() => Order)
          .nullable(),
      },
    });
    const Order = entity({
      name: 'Order',
      columns: { id: z.string().pk(), userId: z.string().ref(() => User) },
    });

    const definitions = generateEntities([User, Order]);
    const relations = generateRelations(definitions);

    const userRelation = relations.find((r) => r.entityName === 'User');
    expect(userRelation?.referTos).toEqual([
      { entityName: 'Order', propertyName: 'lastOrderId', isUnique: false },
    ]);
    expect(userRelation?.referredBys).toEqual([
      { entityName: 'Order', propertyName: 'userId', isUnique: false },
    ]);
  });

  it('still rejects a thunk that returns a non-entity schema', () => {
    const NotAnEntity = z.object({ id: z.string() });
    const Broken = entity({
      name: 'Broken',
      columns: { id: z.string().pk(), otherId: z.string().ref(() => NotAnEntity) },
    });

    expect(() => generateEntities([Broken])).toThrow(/non-entity schema/);
  });

  it('supports thunks on array (to-many) references', () => {
    const Tag = entity({ name: 'Tag', columns: { id: z.string().pk() } });
    const Post = entity({
      name: 'Post',
      columns: { id: z.string().pk(), tagIds: z.array(z.string().ref(() => Tag)) },
    });

    const definition = generateEntities([Post])[0];

    expect(definition?.properties[1]).toEqual({
      isReference: true,
      name: 'tagIds',
      targetEntityDefinitionName: 'Tag',
      isUnique: false,
      isNullable: false,
      isArray: true,
    });
  });
});
