import * as tslint_module from 'tslint';

export function getReplacement(failure: tslint_module.RuleFailure, at:number): tslint_module.Replacement {
    return getReplacements(failure.getFix())[at];
}

export function getReplacements(fix: tslint_module.Fix): tslint_module.Replacement[]{
    let replacements: tslint_module.Replacement[] = null;
    // in tslint4 a Fix has a replacement property with the Replacements
    if ((<any>fix).replacements) {
        // tslint4
        replacements = (<any>fix).replacements;
    } else {
        // in tslint 5 a Fix is a Replacement | Replacement[]
        if (!Array.isArray(fix)) {
            replacements = [<any>fix];
        } else {
            replacements = fix;
        }
    }
    return replacements;
}

export function convertReplacementToTextChange(repl: tslint_module.Replacement): ts.TextChange {
    return {
        newText: repl.text,
        span: { start: repl.start, length: repl.length }
    };
}
