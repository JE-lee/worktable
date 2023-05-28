import { flatten } from './share'
import { CellPosition, Column } from './types'
import { Validator } from './Validator'
import type { Row } from './Row'
import { TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME } from './event'
export class BaseWorktable extends Validator {
  static rid = 1
  columns: Column[] = []
  rows: Row[] = []
  rowsMap: Record<string, Row> = {}

  protected getRaws() {
    return this.rows.map((row) => row.getRaw())
  }

  public getRowByRid(rid: string | number) {
    return this.rowsMap[rid]
  }

  public getCell(pos: CellPosition) {
    return this.rowsMap[pos.rid]?.data[pos.field]
  }

  public updateRowsMap() {
    const rowsMap: Record<string, Row> = {}
    flatten(this.rows).forEach((row) => {
      rowsMap[row.rid] = row
    })
    this.rowsMap = rowsMap
  }

  validate() {
    this.notifyTableEvent(TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME.ON_VALIDATE_START)
    return this.validateAll()
      .then(() => {
        this.notifyTableEvent(TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME.ON_VALIDATE_SUCCESS)
        return this.getRaws()
      })
      .catch((err) => {
        this.notifyTableEvent(
          TABLE_EFFECT_NAMESPACE,
          TABLE_EVENT_NAME.ON_VALIDATE_FAIL,
          this.getValidateErrors()
        )
        throw err
      })
      .finally(() => {
        this.notifyTableEvent(TABLE_EFFECT_NAMESPACE, TABLE_EVENT_NAME.ON_VALIDATE_FINISH)
      })
  }
}
