/// <reference types="cypress" />
describe('Home page visit', () => {
  beforeEach(function () {
    cy.kcLogin();
  })

  it ('should visit IDIR loging page', () => {
    // cy.kcLogin();
    // cy.visit("http://localhost:5173/")
  })
});

// describe('Login as user', () => {
//   it ('should visit IDIR loging page', () => {
//     var url = cy.url()
//     cy.visit(url)
//   })
// });
