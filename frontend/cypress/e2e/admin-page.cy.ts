/// <reference types="cypress" />

describe('File Upload page functionality', () => {
  beforeEach(function () {
    cy.viewport('macbook-16')
    cy.kcLogout().kcLogin()
    cy.get('[href="/admin"]').click()
  })

  it('should be on the admin page', () => {
    cy.get('#pageTitle').should('have.text', 'Electronic Data Transfer - Admin')
  })

  it('should have basic admin page elements', () => {
    cy.get('#tableTabs').should('exist')
    cy.get('#usersTab')
      .should('exist')
      .should('have.text', 'Users')
      .should('have.class', 'Mui-selected')
    cy.get('#companyTab').should('exist').should('have.text', 'Company')

    cy.get('.MuiDataGrid-root').should('exist')
    cy.get('#addUserButton').should('exist').should('have.text', 'Add User')
  })

  it('should render users tab content', () => {
    cy.get('#usersTab').click()
    cy.get('.MuiDataGrid-columnHeader').should('have.length', 6)

    cy.get('[data-field="name"]').should('have.text', 'Name')
    cy.get('[data-field="username"]').should('have.text', 'User Name')
    cy.get('[data-field="email"]').should('have.text', 'Email')
    cy.get('[data-field="company"]').should('have.text', 'Company/Agency')
    cy.get('[data-field="role"]').should('have.text', 'User Role')
    cy.get('[data-field="revoke"]').should('have.text', '')

    cy.wait(3000)

    cy.get('.MuiDataGrid-row').should('have.length.gt', 0) // should have > 0 rows when page loads
    cy.get('.MuiDataGrid-row').each(($row) => {
        cy.wrap($row).find('[data-field="revoke"]').should('have.text', 'Edit')
        cy.wrap($row).find('[data-field="revoke"]').children().first().click()

        /*
            Write tests for the edit modal 
        */
       cy.get('#simple-modal-title').should('have.text', 'Edit Roles')
       cy.get('#cancelButton').click()
    })
  })
})
