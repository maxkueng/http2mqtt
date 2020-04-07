import Joi from '@hapi/joi';

export const macAddressSchema = (): Joi.Schema => (
  Joi.alternatives().try(
    Joi.string().hex().length(12).uppercase(),
    Joi.string().replace(':', '').hex().length(12)
      .uppercase(),
  )
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertSchema<T>(schema: Joi.Schema, input: any): asserts input is T {
  const { error } = schema.validate(input);
  if (error) {
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validate<T>(schema: Joi.Schema, input: any): T {
  const {
    error,
    value,
  } = schema.validate(input);

  if (error) {
    throw error;
  }

  return value;
}
