import { defineConfig } from 'cypress'

export default defineConfig({
  viewportHeight: 768,
  viewportWidth: 1080,
  component: {
    devServer: {
      framework: 'vue-cli',
      bundler: 'webpack',
    },
    fixturesFolder: 'mock',
    specPattern: 'test/**/*.cy.{js,jsx,ts,tsx}',
  },
})
