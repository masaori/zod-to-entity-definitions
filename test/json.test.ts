import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { entity, generateEntities, json } from '../src';

describe('json()', () => {
  describe('Basic Usage', () => {
    it('should define a json schema with a union type and use it as an entity property', () => {
      const ChatMessageContent = json({
        name: 'ChatMessageContent',
        description: 'Chat message content',
        schema: z.union([
          z.object({
            message_type: z.literal('text'),
            text: z.string(),
          }),
          z.object({
            message_type: z.literal('error'),
            error_type: z.union([z.literal('generation_error'), z.literal('validation_error')]),
            error_message: z.string(),
          }),
        ]),
      });

      const ChatMessage = entity({
        name: 'ChatMessage',
        columns: {
          id: z.string().pk(),
          content: ChatMessageContent,
        },
      });

      const definitions = generateEntities([ChatMessage]);

      expect(definitions).toHaveLength(1);

      const chatMessageDef = definitions[0];
      expect(chatMessageDef.name).toBe('ChatMessage');

      const contentProp = chatMessageDef.properties.find((p) => p.name === 'content');
      expect(contentProp).toMatchObject({
        isReference: false,
        propertyType: 'typedStruct',
        name: 'content',
        structTypeName: 'ChatMessageContent',
        isUnique: false,
        isNullable: false,
        isArray: false,
      });
    });

    it('should define a json schema with a plain object', () => {
      const Address = json({
        name: 'AddressJson',
        description: 'Address structure',
        schema: z.object({
          city: z.string(),
          street: z.string(),
        }),
      });

      const Company = entity({
        name: 'Company',
        columns: {
          id: z.string().pk(),
          address: Address,
        },
      });

      const definitions = generateEntities([Company]);

      expect(definitions).toHaveLength(1);

      const companyDef = definitions[0];
      const addressProp = companyDef.properties.find((p) => p.name === 'address');
      expect(addressProp).toMatchObject({
        isReference: false,
        propertyType: 'typedStruct',
        name: 'address',
        structTypeName: 'AddressJson',
        isUnique: false,
        isNullable: false,
        isArray: false,
      });
    });

    it('should handle nullable json property', () => {
      const Metadata = json({
        name: 'Metadata',
        schema: z.object({ key: z.string() }),
      });

      const Item = entity({
        name: 'Item',
        columns: {
          id: z.string().pk(),
          metadata: Metadata.nullable(),
        },
      });

      const definitions = generateEntities([Item]);
      const itemDef = definitions[0];
      const metadataProp = itemDef.properties.find((p) => p.name === 'metadata');
      expect(metadataProp).toMatchObject({
        isReference: false,
        propertyType: 'typedStruct',
        name: 'metadata',
        structTypeName: 'Metadata',
        isNullable: true,
      });
    });

    it('should handle optional json property', () => {
      const Metadata = json({
        name: 'Metadata',
        schema: z.object({ key: z.string() }),
      });

      const Item = entity({
        name: 'Item',
        columns: {
          id: z.string().pk(),
          metadata: Metadata.optional(),
        },
      });

      const definitions = generateEntities([Item]);
      const itemDef = definitions[0];
      const metadataProp = itemDef.properties.find((p) => p.name === 'metadata');
      expect(metadataProp).toMatchObject({
        isReference: false,
        propertyType: 'typedStruct',
        name: 'metadata',
        structTypeName: 'Metadata',
        isNullable: true,
      });
    });

    it('should be skipped by generateEntities when passed directly', () => {
      const JsonSchema = json({
        name: 'JsonSchema',
        schema: z.object({ key: z.string() }),
      });

      const User = entity({
        name: 'User',
        columns: {
          id: z.string().pk(),
        },
      });

      const definitions = generateEntities([User, JsonSchema]);

      // json schemas are not entities, so they should be filtered out
      expect(definitions).toHaveLength(1);
      expect(definitions[0].name).toBe('User');
    });

    it('should handle json schema with description', () => {
      const Payload = json({
        name: 'Payload',
        description: 'Event payload data',
        schema: z.object({
          event: z.string(),
          data: z.string(),
        }),
      });

      const Event = entity({
        name: 'Event',
        columns: {
          id: z.string().pk(),
          payload: Payload,
        },
      });

      const definitions = generateEntities([Event]);
      const eventDef = definitions[0];
      const payloadProp = eventDef.properties.find((p) => p.name === 'payload');
      expect(payloadProp).toMatchObject({
        isReference: false,
        propertyType: 'typedStruct',
        name: 'payload',
        structTypeName: 'Payload',
      });
    });
  });
});
