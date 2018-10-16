import * as ts_module from "../node_modules/typescript/lib/tsserverlibrary";
import * as tslint_module from 'tslint';
import * as mockRequire from 'mock-require';

import { TSLINT_ERROR_CODE } from "./codes";
import { fixRelativeConfigFilePath } from "./config";
import { createProxy } from "./proxy/createProxy";
import { Settings } from "./settings";

function init(modules: { typescript: typeof ts_module }) {
    const ts = modules.typescript;

    let codeFixActions = new Map<string, Map<string, tslint_module.RuleFailure>>();
    let registeredCodeFixes = false;

    let configCache = {
        filePath: <string>null,
        configuration: <any>null,
        isDefaultConfig: false,
        configFilePath: <string>null
    };

    // Work around the lack of API to register a CodeFix
    function registerCodeFix(action: codefix.CodeFix) {
        return (ts as any).codefix.registerCodeFix(action);
    }

    if (!registeredCodeFixes && ts && (ts as any).codefix) {
        registerCodeFixes(registerCodeFix);
        registeredCodeFixes = true;
    }

    function registerCodeFixes(registerCodeFix: (action: codefix.CodeFix) => void) {
        // Code fix for that is used for all tslint fixes
        registerCodeFix({
            errorCodes: [TSLINT_ERROR_CODE],
            getCodeActions: (_context: any) => {
                return null;
            }
        });
    }

    function create(info: ts.server.PluginCreateInfo) {
        info.project.projectService.logger.info("tslint-language-service loaded");

        let config: Settings = fixRelativeConfigFilePath(info.config, info.project.getCurrentDirectory());

        if(config.mockTypeScriptVersion) {
            mockRequire('typescript', ts);
        }
        const tslint = require('tslint')

        // Set up decorator
        return createProxy({ codeFixActions, config, configCache, info, tslint, ts });
    }

    return { create };
}

export = init;

/* @internal */
// work around for missing API to register a code fix
namespace codefix {

    export interface CodeFix {
        errorCodes: number[];
        getCodeActions(context: any): ts.CodeAction[] | undefined;
    }
}
