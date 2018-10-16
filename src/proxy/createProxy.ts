import * as ts_module from "../../node_modules/typescript/lib/tsserverlibrary";
import * as tslint_module from 'tslint';

import { CodeFixActions } from '../actions';
import { ConfigCache } from '../config';
import { Settings } from '../settings';
import { createGetSemanticDiagnostics } from './semanticDiagnostics';
import { createGetCodeFixesAtPosition } from "./codeFixesAtPosition";

export interface CreateProxyDependencies {
    codeFixActions: CodeFixActions;
    config: Settings;
    configCache: ConfigCache;
    info: ts.server.PluginCreateInfo;
    ts: typeof ts_module;
    tslint: typeof tslint_module;
}

export function createProxy({ codeFixActions, config, configCache, info, ts, tslint }: CreateProxyDependencies) {
    const proxy = Object.create(null) as ts.LanguageService;
    const oldLS = info.languageService;
    for (const k in oldLS) {
        (<any>proxy)[k] = function () {
            return (<any>oldLS)[k].apply(oldLS, arguments);
        }
    }

    proxy.getSemanticDiagnostics = createGetSemanticDiagnostics({
        codeFixActions, config, configCache, info, oldLS, ts, tslint,
    });

    proxy.getCodeFixesAtPosition = createGetCodeFixesAtPosition({
        codeFixActions, config, configCache, info, oldLS, ts, tslint,
    });

    return proxy;
}
