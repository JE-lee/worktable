beforeEach(() => {
  cy.intercept('/api/**', (req) => {
    const fixture = req.url.split('/').pop()
    req.on('before:response', (res) => {
      // force all API responses to not be cached
      res.headers['cache-control'] = 'max-age=2592000'
    })
    return req.reply({
      fixture,
      delay: 300,
    })
  })
})
