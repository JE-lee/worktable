import { flatten } from './share'
import { Column } from './types'
import { Validator } from './Validator'
import type { Row } from './Row'
export class BaseWorktable extends Validator {
  static rid = 1
  columns: Column[] = []
  rows: Row[] = []

  protected getRaws() {
    return this.rows.map((row) => row.getRaw())
  }

  public getRowByRid(rid: string | number) {
    return flatten(this.rows).find((row) => row.rid == rid)
  }

  validate() {
    return this.validateAll().then(() => this.getRaws())
  }
}
