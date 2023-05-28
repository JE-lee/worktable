import Wrapper from './WorktableWrapper'
import { CLASS_PREFIX } from '../../src/shared'

const firstRow = '.el-table__row:first-of-type'

describe('<Worktable/>', () => {
  beforeEach(() => {
    cy.mount(Wrapper)
    cy.intercept('/api/products.json').as('getProducts')
  })
  it('initial render', () => {
    // header
    cy.get('.worktable .el-table__header tr > .el-table__cell:first-of-type').contains('序号')
    cy.get('.worktable .el-table__header tr > .el-table__cell .required').then((els) => {
      const before = window.getComputedStyle(els[0], 'before')
      const contentValue = before?.getPropertyValue('content')
      expect(contentValue).to.eql('"*"')
    })

    cy.get(`${firstRow} [data-seq]`).contains('1')
    // count
    cy.get(`${firstRow} [data-count]`).should('have.prop', 'value', '10')
    cy.get(`${firstRow} [data-province] input`).should('have.prop', 'disabled', true)
    cy.get(`${firstRow} [data-city] input`).should('have.prop', 'disabled', true)
    cy.get(`${firstRow} [data-area] input`).should('have.prop', 'disabled', true)
  })

  it('validate', () => {
    cy.get('#validate').click()
    shouldHaveErrorFeedback(`${firstRow} [data-product]`)

    // clear input of count
    cy.get(`${firstRow} [data-count]`).clear()
    shouldHaveErrorFeedback(`${firstRow} [data-count]`)
    getFeedback(`${firstRow} [data-count]`).contains('缺少数量')

    cy.get(`${firstRow} [data-count]`).type('99')
    cy.get(`${firstRow} [data-isgroup]`).click()
    getFeedback(`${firstRow} [data-count]`).contains('组合商品数量不能大于1')

    cy.get(`${firstRow} [data-count]`).clear().type('1')
    shouldNotHaveErrorFeedback(`${firstRow} [data-count]`)
  })

  it('save', () => {
    // select product
    cy.get(`${firstRow} [data-product] > .el-input > .el-input__inner`).click()

    cy.get('.data-product-dropdown .el-select-dropdown__item:first-of-type')
      .contains('牙膏')
      .should('be.visible')
      .click()

    cy.get(`${firstRow} [data-product] > .el-input > .el-input__inner`).should(
      'have.prop',
      'value',
      '牙膏'
    )

    cy.get(`${firstRow} [data-productcode]`).contains('toothpaste')
    cy.get(`${firstRow} [data-province] input`).should('have.prop', 'disabled', false)

    // linkage of address
    cy.intercept('/api/addr.json').as('getAddrs')
    cy.get(`${firstRow} [data-province] input`).click()
    cy.get('.data-province-dropdown').should('have.descendants', '.el-select-dropdown__item')
    // select province
    cy.get('.data-province-dropdown .el-select-dropdown__item:nth-of-type(3)').click()

    cy.get(`${firstRow} [data-city]`).click()
    // select city
    cy.get('.data-city-dropdown .el-select-dropdown__item:nth-of-type(1)').click()

    // select area
    cy.get(`${firstRow} [data-area]`).click()
    cy.get('.data-area-dropdown .el-select-dropdown__item:nth-of-type(1)').click()

    // input creator
    cy.get(`${firstRow} [data-creator]`).click().type('lucas')

    // view data
    const expectBody = {
      isGroup: false,
      count: 10,
      creator: 'lucas',
      productCode: 'toothpaste',
      productName: '牙膏',
      productionArea: '02',
      productionCity: '01',
      productionProvince: '13',
      seq: 1,
    }
    cy.intercept('/api/save', (req) => {
      expect(JSON.parse(req.body)[0]).to.include(expectBody)
      req.reply('ok')
    })
    cy.get('#save').click()
  })

  it('pagination', () => {
    const btn = cy.get('#add')
    for (let i = 0; i < 10; i++) {
      btn.click()
    }

    cy.get('#validate').click()

    cy.get(`.${CLASS_PREFIX}-pagination__jumper.is-error`).should('be.visible').click()
    cy.get(`.${CLASS_PREFIX}-pagination__selector__option.is-error`)
      .should('have.length', 2)
      .should('be.visible')

    // jump to page 2
    cy.get(`.${CLASS_PREFIX}-pagination__selector__option.is-error`).eq(1).click()
    cy.get('.el-table__row').should('have.length', 1)
  })

  it('tree', () => {
    cy.get(`.el-table__row:last-of-type .cell`).should('not.have.text')
    cy.get(`${firstRow} [data-isgroup]`).click()
    cy.get(`${firstRow} #add-child`).scrollIntoView().click()

    cy.get('.el-table__row').should('be.visible').should('have.length', 2)
    cy.get(`.el-table__row`).eq(1).find('.cell').last().should('not.have.text')
    cy.get(`.el-table__row`).eq(1).find('[data-isgroup]').contains('-')

    // remove
    cy.get(`${firstRow} [data-isgroup]`).click()
    cy.get('.el-table__row').should('be.visible').should('have.length', 1)
  })

  it('toggleColumnVisibility', () => {
    const first = '.worktable .el-table__header tr > .el-table__cell:first-of-type'
    const second = '.worktable .el-table__header tr > .el-table__cell:nth-of-type(2)'
    cy.get(`${first} .cell span`).should('have.text', '序号')
    cy.get(`${second} .cell span`).should('have.text', '商品')
    // hide the first two columns
    cy.get('#toggleColumnVisibility').click()
    cy.get(`${first} .cell span`).should('not.have.text', '序号')
    cy.get(`${second} .cell span`).should('not.have.text', '商品')
    // show the first two columns
    cy.get('#toggleColumnVisibility').click()
    cy.get(`${first} .cell span`).should('have.text', '序号')
    cy.get(`${second} .cell span`).should('have.text', '商品')
  })
})

function shouldHaveErrorFeedback(selector: string) {
  cy.getCellBy(selector)
    .should('have.descendants', '.el-form-item.is-error')
    .find('.el-form-item__error')
    .should('be.visible')
}

function shouldNotHaveErrorFeedback(selector: string) {
  cy.getCellBy(selector).should('not.have.descendants', '.el-form-item.is-error')
}

function getFeedback(selector: string) {
  return cy.getCellBy(selector).find('.el-form-item__error')
}
