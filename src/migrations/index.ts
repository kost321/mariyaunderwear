import * as migration_20260618_141301 from './20260618_141301';
import * as migration_20260908_075419_color_models from './20260908_075419_color_models';
import * as migration_20260909_100000_settings_global from './20260909_100000_settings_global';

export const migrations = [
  {
    up: migration_20260618_141301.up,
    down: migration_20260618_141301.down,
    name: '20260618_141301',
  },
  {
    up: migration_20260908_075419_color_models.up,
    down: migration_20260908_075419_color_models.down,
    name: '20260908_075419_color_models'
  },
  {
    up: migration_20260909_100000_settings_global.up,
    down: migration_20260909_100000_settings_global.down,
    name: '20260909_100000_settings_global'
  },
];
