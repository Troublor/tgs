import fs from 'fs';
import yaml from 'js-yaml';
import { validateSync } from 'class-validator';
import Config from './schema.js';
import _ from 'lodash';

export default function loadConfig() {
  const fileCandidates = [process.env.TGS_CONFIG, 'config.yaml', 'config.yml'];
  for (const file of fileCandidates) {
    let content: string | undefined;
    try {
      content = file && fs.readFileSync(file, 'utf8');
    } catch (_) {
      continue;
    }
    if (!content) continue;
    const loadedConfig = _.merge(Config.default(), yaml.load(content));
    const errors = validateSync(loadedConfig);
    if (errors.length > 0) {
      throw new Error('config validation failed. errors: ' + errors.toString());
    }
    return loadedConfig;
  }
  return Config.default();
}
