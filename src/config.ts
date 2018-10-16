import * as path from 'path';
import * as tslint_module from 'tslint';

import { Settings } from './settings';

export interface ConfigCache {
    configFilePath: string | null;
    configuration: tslint_module.Configuration.IConfigurationFile | null;
    filePath: string | null;
    isDefaultConfig: boolean;
}

export function fixRelativeConfigFilePath(config: Settings, projectRoot: string): Settings {
    if (!config.configFile) {
        return config;
    }
    if (path.isAbsolute(config.configFile)) {
        return config;
    }
    config.configFile = path.join(projectRoot, config.configFile);
    return config;
}

export function getConfigurationFailureMessage(err: any): string {
    let errorMessage = `unknown error`;
    if (typeof err.message === 'string' || err.message instanceof String) {
        errorMessage = <string>err.message;
    }
    return `tslint: Cannot read tslint configuration - '${errorMessage}'`;
}

export function getConfiguration(filePath: string, configFileName: string, config: Settings, configCache: ConfigCache): any {
    if (configCache.configuration && configCache.filePath === filePath) {
        return configCache.configuration;
    }

    let isDefaultConfig = false;
    let configuration;
    let configFilePath = null;

    isDefaultConfig = tslint_module.Configuration.findConfigurationPath(configFileName, filePath) === undefined;
    let configurationResult = tslint_module.Configuration.findConfiguration(configFileName, filePath);

    // between tslint 4.0.1 and tslint 4.0.2 the attribute 'error' has been removed from IConfigurationLoadResult
    // in 4.0.2 findConfiguration throws an exception as in version ^3.0.0
    if ((<any>configurationResult).error) {
        throw (<any>configurationResult).error;
    }
    configuration = configurationResult.results;

    // In tslint version 5 the 'no-unused-variable' rules breaks the TypeScript language service plugin.
    // See https://github.com/Microsoft/TypeScript/issues/15344
    // Therefore we remove the rule from the configuration.
    //
    // In tslint 5 the rules are stored in a Map, in earlier versions they were stored in an Object
    if (config.disableNoUnusedVariableRule === true || config.disableNoUnusedVariableRule === undefined) {
        if (configuration.rules && configuration.rules instanceof Map) {
            configuration.rules.delete('no-unused-variable');
        }
        if (configuration.jsRules && configuration.jsRules instanceof Map) {
            configuration.jsRules.delete('no-unused-variable');
        }
    }

    configFilePath = configurationResult.path;

    configCache = {
        filePath: filePath,
        isDefaultConfig: isDefaultConfig,
        configuration: configuration,
        configFilePath: configFilePath
    };
    return configCache.configuration;
}
