import * as ts_module from "../../node_modules/typescript/lib/tsserverlibrary";
import * as tslint_module from 'tslint';

import { CodeFixActions } from "../actions";
import { ConfigCache } from "../config";
import { computeRuleFailureKey } from "../failures";
import { addRuleFailureFix, addRuleFailureFixAll } from '../fixes/ruleFailureFix';
import { addAllAutoFixable } from '../fixes/addAllAutoFixable';
import { addOpenConfigurationFix } from '../fixes/openConfigurationFix';
import { addDisableRuleFix } from '../fixes/addDisableRuleFix';
import { Settings } from "../settings";

interface CreateGetCodeFixesAtPositionDependencies {
    codeFixActions: CodeFixActions;
    config: Settings;
    configCache: ConfigCache;
    info: ts.server.PluginCreateInfo;
    oldLS: ts_module.LanguageService;
    ts: typeof ts_module;
    tslint: typeof tslint_module;
}

export function createGetCodeFixesAtPosition({ codeFixActions, config, configCache, info, oldLS }: CreateGetCodeFixesAtPositionDependencies) {
    return function (fileName: string, start: number, end: number, errorCodes: number[], formatOptions: ts.FormatCodeSettings, userPreferences: ts.UserPreferences): ReadonlyArray<ts.CodeFixAction> {
        let prior = oldLS.getCodeFixesAtPosition(fileName, start, end, errorCodes, formatOptions, userPreferences);
        if (config.supressWhileTypeErrorsPresent && prior.length > 0) {
            return prior;
        }

        info.project.projectService.logger.info("tslint-language-service getCodeFixes " + errorCodes[0]);
        let documentFixes = codeFixActions.get(fileName);

        if (documentFixes) {
            const fixes = prior ? [...prior] : [];

            let problem = documentFixes.get(computeRuleFailureKey(start, end));
            if (problem) {
                addRuleFailureFix(fixes, problem, fileName);
                addRuleFailureFixAll(fixes, problem.getRuleName(), documentFixes, fileName);
            }
            addAllAutoFixable(fixes, documentFixes, fileName);
            if (problem) {
                addOpenConfigurationFix(fixes, configCache);
                addDisableRuleFix(fixes, problem, fileName, oldLS.getProgram().getSourceFile(fileName));
            }

            return fixes;
        }

        return prior;
    };
}
