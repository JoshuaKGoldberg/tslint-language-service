import * as tslint_module from 'tslint';

import { computeRuleFailureKey } from "./failures";

export type CodeFixActions = Map<string, Map<string, tslint_module.RuleFailure>>;

function replacementsAreEmpty(fix: tslint_module.Fix): boolean {
    // in tslint 4 a Fix has a replacement property witht the Replacements
    if ((<any>fix).replacements) {
        return (<any>fix).replacements.length === 0;
    }
    // tslint 5
    if (Array.isArray(fix)) {
        return fix.length === 0;
    }
    return false;
}

export function recordCodeAction(
    problem: tslint_module.RuleFailure,
    file: ts.SourceFile,
    codeFixActions: CodeFixActions,
) {
    let fix: tslint_module.Fix = null;

    // tslint can return a fix with an empty replacements array, these fixes are ignored
    if (problem.getFix && problem.getFix() && !replacementsAreEmpty(problem.getFix())) { // tslint fixes are not available in tslint < 3.17
        fix = problem.getFix(); // createAutoFix(problem, document, problem.getFix());
    }

    if (!fix) {
        return;
    }

    let documentAutoFixes: Map<string, tslint_module.RuleFailure> = codeFixActions.get(file.fileName);
    if (!documentAutoFixes) {
        documentAutoFixes = new Map<string, tslint_module.RuleFailure>();
        codeFixActions.set(file.fileName, documentAutoFixes);
    }
    documentAutoFixes.set(computeRuleFailureKey(problem.getStartPosition().getPosition(), problem.getEndPosition().getPosition()), problem);
}
