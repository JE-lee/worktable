import Wrapper from './WorktableWrapper'

describe('<Worktable/>', () => {
  beforeEach(() => {
    cy.mount(Wrapper)
    cy.intercept('/api/products.json').as('getProducts')
  })
  it('render', () => {
    // header
    cy.get('.worktable .el-table__header tr > .el-table__cell:first-of-type').contains('序号')
    cy.get('.worktable .el-table__header tr > .el-table__cell .required').then((els) => {
      console.log('els.length', els.length)
      const before = window.getComputedStyle(els[0], 'before')
      const contentValue = before?.getPropertyValue('content')
      expect(contentValue).to.eql('"*"')
    })

    cy.get('.el-table__row:first-of-type [data-seq]').contains('1')
    // count
    cy.get('.el-table__row:first-of-type [data-count]').should('have.prop', 'value', '10')
    cy.get('.el-table__row:first-of-type [data-province] input').should(
      'have.prop',
      'disabled',
      true
    )
    cy.get('.el-table__row:first-of-type [data-city] input').should('have.prop', 'disabled', true)
    cy.get('.el-table__row:first-of-type [data-area] input').should('have.prop', 'disabled', true)
  })

  it('save', () => {
    // product dropdown
    cy.get('.el-table__row:first-of-type [data-product] > .el-input > .el-input__inner').click()
    // loading
    cy.get('.data-product-dropdown .el-select-dropdown__empty').contains('加载中')
    cy.wait('@getProducts')
    cy.get('.data-product-dropdown .el-select-dropdown__item:first-of-type')
      .contains('牙膏')
      .should('be.visible')
      .click()

    cy.get('.el-table__row:first-of-type [data-product] > .el-input > .el-input__inner').should(
      'have.prop',
      'value',
      '牙膏'
    )

    cy.get('.el-table__row:first-of-type [data-productcode]').contains('toothpaste')
    cy.get('.el-table__row:first-of-type [data-province] input').should(
      'have.prop',
      'disabled',
      false
    )

    // linkage of address
    cy.intercept('/api/addr.json').as('getAddrs')
    cy.get('.el-table__row:first-of-type [data-province] input').click()
    cy.wait('@getAddrs')
    cy.get('.data-province-dropdown').should('have.descendants', '.el-select-dropdown__item')
    // select province
    cy.get('.data-province-dropdown .el-select-dropdown__item:nth-of-type(3)').click()
    cy.get('.el-table__row:first-of-type [data-city]')
      .parents('.cell')
      .eq(0)
      .find('.el-icon-loading')
      .should('be.visible')

    cy.wait('@getAddrs')
    cy.get('.el-table__row:first-of-type [data-city]').click()
    // select city
    cy.get('.data-city-dropdown .el-select-dropdown__item:nth-of-type(1)').click()
    cy.get('.el-table__row:first-of-type [data-area]')
      .parents('.cell')
      .eq(0)
      .find('.el-icon-loading')
      .should('be.visible')

    // select area
    cy.wait('@getAddrs')
    cy.get('.el-table__row:first-of-type [data-area]').click()
    cy.get('.data-area-dropdown .el-select-dropdown__item:nth-of-type(1)').click()

    // input creator
    cy.get('.el-table__row:first-of-type [data-creator]').click().type('lucas')

    // view data
    const expectBody = [
      {
        count: 10,
        creator: 'lucas',
        productCode: 'toothpaste',
        productName: '牙膏',
        productionArea: '02',
        productionCity: '01',
        productionProvince: '13',
        seq: 1,
      },
    ]
    cy.intercept('/api/save', (req) => {
      expect(JSON.parse(req.body)).to.deep.equal(expectBody)
      req.reply('ok')
    })
    cy.get('#save').click()
  })
})
