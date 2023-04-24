beforeEach(() => {
  cy.intercept('/api/**', (req) => {
    const fixture = req.url.split('/').pop()
    return req.reply({
      fixture,
      delay: 300,
    })
  })
})
