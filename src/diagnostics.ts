import * as tslint_module from 'tslint';
import * as ts_module from 'typescript';

import { TSLINT_ERROR_CODE } from './codes';
import { Settings } from './settings';

export function makeDiagnostic(
    problem: tslint_module.RuleFailure,
    file: ts.SourceFile,
    config: Settings,
    ts: typeof ts_module,
): ts.Diagnostic {
    let message = (problem.getRuleName() !== null)
        ? `${problem.getFailure()} (${problem.getRuleName()})`
        : `${problem.getFailure()}`;

    let category;
    if (config.alwaysShowRuleFailuresAsWarnings === true) {
        category = ts.DiagnosticCategory.Warning;
    } else if ((<any>problem).getRuleSeverity && (<any>problem).getRuleSeverity() === 'error') {
        // tslint5 supports to assign severities to rules
        category = ts.DiagnosticCategory.Error;
    } else {
        category = ts.DiagnosticCategory.Warning;
    }

    let diagnostic: ts.Diagnostic = {
        file: file,
        start: problem.getStartPosition().getPosition(),
        length: problem.getEndPosition().getPosition() - problem.getStartPosition().getPosition(),
        messageText: message,
        category: category,
        source: 'tslint',
        code: TSLINT_ERROR_CODE
    };
    return diagnostic;
}
