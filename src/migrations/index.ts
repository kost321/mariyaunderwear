import * as migration_20260618_141301 from './20260618_141301';
import * as migration_20260908_075419_color_models from './20260908_075419_color_models';
import * as migration_20260909_100000_settings_global from './20260909_100000_settings_global';
import * as migration_20260909_140000_description_to_html from './20260909_140000_description_to_html';
import * as migration_20260917_210000_related_products from './20260917_210000_related_products';
import * as migration_20260920_160352_care_html from './20260920_160352_care_html';
import * as migration_20260924_180000_sizes_stock_wholesale_price from './20260924_180000_sizes_stock_wholesale_price';

export const migrations = [
  {
    up: migration_20260618_141301.up,
    down: migration_20260618_141301.down,
    name: '20260618_141301',
  },
  {
    up: migration_20260908_075419_color_models.up,
    down: migration_20260908_075419_color_models.down,
    name: '20260908_075419_color_models',
  },
  {
    up: migration_20260909_100000_settings_global.up,
    down: migration_20260909_100000_settings_global.down,
    name: '20260909_100000_settings_global',
  },
  {
    up: migration_20260909_140000_description_to_html.up,
    down: migration_20260909_140000_description_to_html.down,
    name: '20260909_140000_description_to_html',
  },
  {
    up: migration_20260917_210000_related_products.up,
    down: migration_20260917_210000_related_products.down,
    name: '20260917_210000_related_products',
  },
  {
    up: migration_20260920_160352_care_html.up,
    down: migration_20260920_160352_care_html.down,
    name: '20260920_160352_care_html',
  },
  {
    up: migration_20260924_180000_sizes_stock_wholesale_price.up,
    down: migration_20260924_180000_sizes_stock_wholesale_price.down,
    name: '20260924_180000_sizes_stock_wholesale_price',
  },
];
