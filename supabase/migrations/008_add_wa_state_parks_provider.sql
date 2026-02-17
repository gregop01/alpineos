-- Add wa_state_parks provider for Washington State Parks
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_provider_check;
ALTER TABLE locations ADD CONSTRAINT locations_provider_check CHECK (
  provider IN (
    'bcparks', 'parks_canada', 'acc', 'ridb', 'rstbc', 'bcmc', 'voc',
    'wa_state_parks', 'commercial', 'other'
  )
);
