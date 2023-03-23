import { SceneObject } from '../../core/types';
import { FormatVariable } from '../interpolation/formatRegistry';

export interface MacroVariableConstructor {
  new (name: string, sceneObject: SceneObject): FormatVariable;
}
