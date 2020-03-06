import getArgv from './config/__fixtures__/argv';
import { getConfig } from './defaults';

jest.mock('../datasource/npm');
try {
  jest.mock('../../config.js');
} catch (err) {
  // file does not exist
}

const defaultConfig = getConfig();

describe('config/index', () => {
  describe('.parseConfigs(env, defaultArgv)', () => {
    let configParser: typeof import('.');
    let defaultArgv: string[];
    beforeEach(() => {
      jest.resetModules();
      configParser = require('./index');
      defaultArgv = getArgv();
      jest.mock('delay');
      require('delay').mockImplementation(() => Promise.resolve());
    });
    it('supports token in env', async () => {
      const env: NodeJS.ProcessEnv = { RENOVATE_TOKEN: 'abc' };
      await configParser.parseConfigs(env, defaultArgv);
    });
    it('supports token in CLI options', async () => {
      defaultArgv = defaultArgv.concat([
        '--token=abc',
        '--pr-footer=custom',
        '--log-context=abc123',
      ]);
      const env: NodeJS.ProcessEnv = {};
      await configParser.parseConfigs(env, defaultArgv);
    });
    it('supports forceCli', async () => {
      defaultArgv = defaultArgv.concat(['--force-cli=true']);
      const env: NodeJS.ProcessEnv = { RENOVATE_TOKEN: 'abc' };
      await configParser.parseConfigs(env, defaultArgv);
    });
    it('supports Bitbucket username/passwod', async () => {
      defaultArgv = defaultArgv.concat([
        '--platform=bitbucket',
        '--username=user',
        '--password=pass',
      ]);
      const env: NodeJS.ProcessEnv = {};
      await configParser.parseConfigs(env, defaultArgv);
    });
    it('massages trailing slash into endpoint', async () => {
      defaultArgv = defaultArgv.concat([
        '--endpoint=https://github.renovatebot.com/api/v3',
      ]);
      const env: NodeJS.ProcessEnv = {};
      const parsed = await configParser.parseConfigs(env, defaultArgv);
      expect(parsed.endpoint).toEqual('https://github.renovatebot.com/api/v3/');
    });
  });
  describe('mergeChildConfig(parentConfig, childConfig)', () => {
    it('merges', () => {
      const parentConfig = { ...defaultConfig };
      const childConfig = {
        foo: 'bar',
        rangeStrategy: 'replace',
        lockFileMaintenance: {
          schedule: ['on monday'],
        },
      };
      const configParser = require('./index');
      const config = configParser.mergeChildConfig(parentConfig, childConfig);
      expect(config.foo).toEqual('bar');
      expect(config.rangeStrategy).toEqual('replace');
      expect(config.lockFileMaintenance.schedule).toEqual(['on monday']);
      expect(config.lockFileMaintenance).toMatchSnapshot();
    });
    it('merges packageRules', () => {
      const parentConfig = { ...defaultConfig };
      Object.assign(parentConfig, {
        packageRules: [{ a: 1 }, { a: 2 }],
      });
      const childConfig = {
        packageRules: [{ a: 3 }, { a: 4 }],
      };
      const configParser = require('./index');
      const config = configParser.mergeChildConfig(parentConfig, childConfig);
      expect(config.packageRules.map(rule => rule.a)).toMatchObject([
        1,
        2,
        3,
        4,
      ]);
    });
    it('handles null parent packageRules', () => {
      const parentConfig = { ...defaultConfig };
      Object.assign(parentConfig, {
        packageRules: null,
      });
      const childConfig = {
        packageRules: [{ a: 3 }, { a: 4 }],
      };
      const configParser = require('./index');
      const config = configParser.mergeChildConfig(parentConfig, childConfig);
      expect(config.packageRules).toHaveLength(2);
    });
    it('handles null child packageRules', () => {
      const parentConfig = { ...defaultConfig };
      parentConfig.packageRules = [{ a: 3 }, { a: 4 }];
      const configParser = require('./index');
      const config = configParser.mergeChildConfig(parentConfig, {});
      expect(config.packageRules).toHaveLength(2);
    });
    it('handles undefined childConfig', () => {
      const parentConfig = { ...defaultConfig };
      const configParser = require('./index');
      const config = configParser.mergeChildConfig(parentConfig, undefined);
      expect(config).toMatchObject(parentConfig);
    });
  });
});