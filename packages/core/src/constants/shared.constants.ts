export const DEPENDENCIES_METADATA_KEY = 'design:paramtypes';

export const PROVIDER_TOKEN_METADATA_KEY = 'provider:token';
export const SCOPE_METADATA_KEY = 'provider:scope';
export const INJECTABLE_META_KEY = 'provider:injectable';
export const INJECT_METADATA_KEY = (id: number) => `inject:${id}`;
export const OPTIONAL_METADATA_KEY = (id: number) => `optional:${id}`;
