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

    cy.get('[data-field="name"]').children().first().should('have.text', 'Name')
    cy.get('[data-field="username"]')
      .children()
      .first()
      .should('have.text', 'User Name')
    cy.get('[data-field="email"]')
      .children()
      .first()
      .should('have.text', 'Email')
    cy.get('[data-field="company"]')
      .children()
      .first()
      .should('have.text', 'Company/Agency')
    cy.get('[data-field="role"]')
      .children()
      .first()
      .should('have.text', 'User Role')
    cy.get('[data-field="revoke"]').children().first().should('have.text', '')

    cy.wait(3000)

    cy.get('.MuiDataGrid-row').should('have.length.gt', 0) // should have > 0 rows when page loads
    cy.get('.MuiDataGrid-row').each(($row) => {
      cy.wrap($row).find('[data-field="revoke"]').should('have.text', 'Edit')
      cy.wrap($row).find('[data-field="revoke"]').children().first().click()

      /*
            Write tests for the edit modal
        */
      cy.get('#simple-modal-title').should('have.text', 'Edit Roles')
      cy.get('#searchFirstName-label').should('have.text', 'First Name')
      cy.get('#searchFirstName').should('not.have.value', '')

      cy.get('#searchLastName-label').should('have.text', 'Last Name')
      cy.get('#searchLastName').should('not.have.value', '')

      cy.get('#searchUsername-label').should('have.text', 'Username')
      cy.get('#searchUsername').should('not.have.value', '')

      cy.get('#ENMODS_USER')
        .children()
        .last()
        .should('have.text', 'Enmods User')
      cy.get('#ENMODS_ADMIN')
        .children()
        .last()
        .should('have.text', 'Enmods Admin')

      cy.get('#cancelButton').click()
    })
  })

  it('should render the company tab content', () => {
    cy.get('#companyTab').click()
    cy.get('.MuiDataGrid-columnHeader').should('have.length', 4)

    cy.get('[data-field="id"]')
      .children()
      .first()
      .should('have.text', 'Company/Agency ID')
    cy.get('[data-field="name"]')
      .children()
      .first()
      .should('have.text', 'Company/Agency Name')
    cy.get('[data-field="email"]')
      .children()
      .first()
      .should('have.text', 'Email')
    cy.get('[data-field="edit"]').children().first().should('have.text', '')

    cy.get('.MuiDataGrid-row').should('have.length.gt', 0) // should have > 0 rows when page loads

    cy.get('.MuiDataGrid-row').each(($row) => {
      cy.wrap($row).find('[data-field="edit"]').should('have.text', 'Edit')
      cy.wrap($row).find('[data-field="edit"]').children().first().click()

      /*
      TODO:
        - Write tests for the edit modal
        - Need to update this once the logic for the edit modal has been be decided for the company tab
      */
      cy.get('#cancelButton').click()
    })
  })

  it('should show the add modal content', () => {
    cy.get('#addUserButton').click()
    cy.get('#simple-modal-title').should('have.text', 'Grant Roles')
    cy.get('#searchEmail-label').should('have.text', 'Email')
    cy.get('#searchEmail').should('have.value', '')

    cy.get('#searchFirstName-label').should('have.text', 'First Name')
    cy.get('#searchFirstName').should('have.value', '')

    cy.get('#searchLastName-label').should('have.text', 'Last Name')
    cy.get('#searchLastName').should('have.value', '')

    cy.get('#searchUsername-label').should('have.text', 'Username')
    cy.get('#searchUsername').should('have.value', '')

    cy.get('#ENMODS_USER').children().first().children().first().should('have.attr', 'disabled')
    cy.get('#ENMODS_ADMIN').children().first().children().first().should('have.attr', 'disabled')

  })
})
