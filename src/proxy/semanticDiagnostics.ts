import * as ts_module from "../../node_modules/typescript/lib/tsserverlibrary";
import * as tslint_module from 'tslint';

import { CodeFixActions, recordCodeAction } from "../actions";
import { getConfiguration, getConfigurationFailureMessage, ConfigCache } from "../config";
import { makeDiagnostic } from "../diagnostics";
import { filterFailuresForDocument } from "../failures";
import { Settings } from "../settings";

interface CreateGetSemanticDiagnosticsDependencies {
    codeFixActions: CodeFixActions;
    config: Settings;
    configCache: ConfigCache;
    info: ts.server.PluginCreateInfo;
    oldLS: ts_module.LanguageService;
    ts: typeof ts_module;
    tslint: typeof tslint_module;
}

export function createGetSemanticDiagnostics({ codeFixActions, config, configCache, info, oldLS, ts, tslint }: CreateGetSemanticDiagnosticsDependencies) {
    let configuration: tslint_module.Configuration.IConfigurationFile = null;

    function captureWarnings(message?: any): void {
        // TODO log to a user visible log and not only the TS-Server log
        info.project.projectService.logger.info(`[tslint] ${message}`);
    }

    return (fileName: string) => {
        const prior = oldLS.getSemanticDiagnostics(fileName);

        if (config.supressWhileTypeErrorsPresent && prior.length > 0) {
            return prior;
        }

        try {
            info.project.projectService.logger.info(`Computing tslint semantic diagnostics...`);
            if (codeFixActions.has(fileName)) {
                codeFixActions.delete(fileName);
            }

            if (config.ignoreDefinitionFiles === true && fileName.endsWith('.d.ts')) {
                return prior;
            }

            try {
                configuration = getConfiguration(fileName, config.configFile, config, configCache);
            } catch (err) {
                // TODO: show the reason for the configuration failure to the user and not only in the log
                // https://github.com/Microsoft/TypeScript/issues/15913
                info.project.projectService.logger.info(getConfigurationFailureMessage(err))
                return prior;
            }

            let result: tslint_module.LintResult;

            // tslint writes warning messages using console.warn()
            // capture the warnings and write them to the tslint plugin log
            let warn = console.warn;
            console.warn = captureWarnings;

            try { // protect against tslint crashes
                // TODO the types of the Program provided by tsserver libary are not compatible with the one provided by typescript
                // casting away the type
                let options: tslint_module.ILinterOptions = { fix: false };
                let linter = new tslint.Linter(options, <any>oldLS.getProgram());
                linter.lint(fileName, "", configuration);
                result = linter.getResult();
            } catch (err) {
                let errorMessage = `unknown error`;
                if (typeof err.message === 'string' || err.message instanceof String) {
                    errorMessage = <string>err.message;
                }
                info.project.projectService.logger.info('tslint error ' + errorMessage);
                return prior;
            } finally {
                console.warn = warn;
            }

            if (result.failures.length > 0) {
                const tslintFailures = filterFailuresForDocument(fileName, result.failures);
                if (tslintFailures && tslintFailures.length) {
                    const file = oldLS.getProgram().getSourceFile(fileName);
                    const diagnostics = prior ? [...prior] : [];
                    tslintFailures.forEach(failure => {
                        diagnostics.push(makeDiagnostic(failure, file, config, ts));
                        recordCodeAction(failure, file, codeFixActions);
                    });
                    return diagnostics;
                }
            }
        } catch (e) {
            info.project.projectService.logger.info(`tslint-language service error: ${e.toString()}`);
            info.project.projectService.logger.info(`Stack trace: ${e.stack}`);
        }
        return prior;
    };
}
