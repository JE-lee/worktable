export enum FIELD_EVENT_NAME {
  ON_FIELD_INIT = 'onFieldInit',
  ON_FIELD_VALUE_CHANGE = 'onFieldValueChange',
  ON_FIELD_INPUT_VALUE_CHANGE = 'onFieldInputValueChange',
  ON_FIELD_VALUE_VALIDATE_START = 'onFieldValueValidateStart',
  ON_FIELD_VALUE_VALIDATE_SUCCESS = 'onFieldValueValidateSuccess',
  ON_FIELD_VALUE_VALIDATE_FAIL = 'onFieldValueValidateFail',
  ON_FIELD_VALUE_VALIDATE_FINISH = 'onFieldValueValidateFinish',
  ON_FIELD_REACT = 'onFieldReact',
}

export const TABLE_EFFECT_NAMESPACE = '__table_effects__'

export enum TABLE_EVENT_NAME {
  ON_FIELD_VALUE_CHANGE = 'onFieldValueChange',
  ON_FIELD_INPUT_VALUE_CHANGE = 'onFieldInputValueChange',
  ON_VALIDATE_START = 'onValidateStart',
  ON_VALIDATE_SUCCESS = 'onValidateSuccess',
  ON_VALIDATE_FAIL = 'onValidateFail',
  ON_VALIDATE_FINISH = 'onValidateFinish',
}
