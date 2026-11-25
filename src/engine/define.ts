import type { Results } from './calc';
import type { ParamSpecs } from './params';
import type { QuestionTemplate } from './types';

/**
 * Identity function that gives question templates full type checking: parameter
 * names, result names and answer keys are all checked by TypeScript.
 */
export function defineQuestion<PS extends ParamSpecs, R extends Results>(template: QuestionTemplate<PS, R>): QuestionTemplate<PS, R> {
  return template;
}
