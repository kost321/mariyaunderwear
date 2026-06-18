import * as migration_20260618_141301 from './20260618_141301';

export const migrations = [
  {
    up: migration_20260618_141301.up,
    down: migration_20260618_141301.down,
    name: '20260618_141301'
  },
];
