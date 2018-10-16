import * as tslint_module from 'tslint';
import * as ts_module from 'typescript';

import { getReplacements, convertReplacementToTextChange } from '../replacements';

export function getReplacement(failure: tslint_module.RuleFailure, at:number): tslint_module.Replacement {
    return getReplacements(failure.getFix())[at];
}

function sortFailures(failures: tslint_module.RuleFailure[]):tslint_module.RuleFailure[] {
    // The failures.replacements are sorted by position, we sort on the position of the first replacement
    return failures.sort((a, b) => {
        return getReplacement(a, 0).start - getReplacement(b, 0).start;
    });
}

function getNonOverlappingReplacements(documentFixes: Map<string, tslint_module.RuleFailure>): tslint_module.Replacement[] {
    function overlaps(a: tslint_module.Replacement, b: tslint_module.Replacement): boolean {
        return a.end >= b.start;
    }

    let sortedFailures = sortFailures([...documentFixes.values()]);
    let nonOverlapping: tslint_module.Replacement[] = [];
    for (let i = 0; i < sortedFailures.length; i++) {
        let replacements = getReplacements(sortedFailures[i].getFix());
        if (i === 0 || !overlaps(nonOverlapping[nonOverlapping.length - 1], replacements[0])) {
            nonOverlapping.push(...replacements)
        }
    }
    return nonOverlapping;
}

export function addAllAutoFixable(fixes: ts_module.CodeAction[], documentFixes: Map<string, tslint_module.RuleFailure>, fileName: string) {
    const allReplacements = getNonOverlappingReplacements(documentFixes);
    fixes.push({
        description: `Fix all auto-fixable tslint failures`,
        changes: [{
            fileName: fileName,
            textChanges: allReplacements.map(each => convertReplacementToTextChange(each))
        }]
    }); 
}
