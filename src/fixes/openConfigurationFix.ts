import * as ts_module from 'typescript';

import { ConfigCache } from '../config';

export function addOpenConfigurationFix(fixes: ts_module.CodeAction[], configCache: ConfigCache) {
    // the Open Configuration code action is disabled since there is no specified API to open an editor
    let openConfigFixEnabled = false;
    if (openConfigFixEnabled && configCache && configCache.configFilePath) {
        fixes.push({
            description: `Open tslint.json`,
            changes: [{
                fileName: configCache.configFilePath,
                textChanges: []
            }]
        });
    }
}
