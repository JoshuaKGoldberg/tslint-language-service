import * as path from 'path';
import * as tslint_module from 'tslint';

/**
 * @returns Key to identify a rule failure.
 */
export function computeRuleFailureKey(start: number, end: number): string {
    return `[${start},${end}]`;
}

/**
* Filter failures for the given document
*/
export function filterFailuresForDocument(documentPath: string, failures: tslint_module.RuleFailure[]): tslint_module.RuleFailure[] {
    let normalizedPath = path.normalize(documentPath);
    // we only show diagnostics targetting this open document, some tslint rule return diagnostics for other documents/files
    let normalizedFiles = new Map<string, string>();
    return failures.filter(failure => {
        let fileName = failure.getFileName();
        if (!normalizedFiles.has(fileName)) {
            normalizedFiles.set(fileName, path.normalize(fileName));
        }
        return normalizedFiles.get(fileName) === normalizedPath;
    });
}
