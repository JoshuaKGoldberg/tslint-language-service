import * as tslint_module from 'tslint';
import * as ts_module from 'typescript';

import { convertReplacementToTextChange, getReplacements } from '../replacements';

function problemToFileTextChange(problem: tslint_module.RuleFailure, fileName: string): ts_module.FileTextChanges {
    let fix = problem.getFix();
    let replacements: tslint_module.Replacement[] = getReplacements(fix);

    return {
        fileName: fileName,
        textChanges: replacements.map(each => convertReplacementToTextChange(each)),
    }
}

export function addRuleFailureFix(fixes: ts_module.CodeAction[], problem: tslint_module.RuleFailure, fileName: string) {
    fixes.push({
        description: `Fix '${problem.getRuleName()}'`,
        changes: [problemToFileTextChange(problem, fileName)]
    });
}

/* Generate a code action that fixes all instances of ruleName.  */
export function addRuleFailureFixAll(fixes: ts_module.CodeAction[], ruleName: string, problems: Map<string, tslint_module.RuleFailure>, fileName: string) {
    const changes: ts_module.FileTextChanges[] = [];

    for (const problem of problems.values()) {
        if (problem.getRuleName() === ruleName) {
            changes.push(problemToFileTextChange(problem, fileName));
        }
    }

    /* No need for this action if there's only one instance.  */
    if (changes.length < 2) {
        return;
    }

    fixes.push({
        description: `Fix all '${ruleName}'`,
        changes: changes,
    });
}
