/// <reference types="cypress" />
describe('Home page visit', () => {
  it('should visit landing page', () => {
    cy.visit('http://localhost:5173')
    cy.url().then((url) => {
      console.log(url.toString())
    })
    // cy.get('a').contains('IDIR')
  })
});

// describe('Login as user', () => {
//   it ('should visit IDIR loging page', () => {
//     var url = cy.url()
//     cy.visit(url)
//   })
// });
