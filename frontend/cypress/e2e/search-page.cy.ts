/// <reference types="cypress" />

const paginationTests = [
  {
    pageSize: 5,
  },
  {
    pageSize: 10,
  },
  {
    pageSize: 20,
  },
  {
    pageSize: 50,
  },
  {
    pageSize: 100,
  },
]

describe('File Upload page functionality', () => {
  beforeEach(function () {
    cy.viewport('macbook-16')
    cy.kcLogout().kcLogin()
    cy.get('[href="/dashboard"]').click()
  })

  it('should be on the search page', () => {
    cy.get('[href="/dashboard"]').click()
    cy.get('#pageTitle').should(
      'have.text',
      'Electronic Data Transfer - Dashboard',
    )
  })

  it('should have basic search elements', () => {
    cy.get('#file-name-label').should('exist')
    cy.get('#file-name-input').should('exist').should('have.attr', 'type', 'text')

    cy.get('#submission-date-label').should('exist')
    cy.get('#submission-date-from-label').should('exist')
    cy.get('#submission-date-from-input').should('exist').should('have.attr', 'type', 'date')
    cy.get('#submission-date-to-label').should('exist')
    cy.get('#submission-date-to-input').should('exist').should('have.attr', 'type', 'date')

    cy.get('#submitting-agency-label').should('exist')
    cy.get('#submitting-agency-input').should('exist').children('div').children('input').should('have.attr', 'name', 'dropdown-agency')

    cy.get('#submitting-user-label').should('exist')
    cy.get('#submitting-user-input').should('exist').children('div').children('input').should('have.attr', 'name', 'dropdown-user')

    cy.get('#file-status-code-label').should('exist')
    cy.get('#file-status-code-input').should('exist').children('div').children('input').should('have.attr', 'name', 'dropdown-status')

    cy.get('#search-button').should('exist')
    cy.get('#search-button').should('have.text', 'Search')

    cy.get('#search-result-table').should('exist')
  })

  it('should render the table correctly', () => {
    cy.get('.MuiDataGrid-columnHeader').should('have.length', 9) // should have 9 columns

    /* should have the appropriate column headers */
    cy.get('[data-field="file_name"]').should('have.text', 'File Name')
    cy.get('[data-field="submission_date"]').should('have.text', 'Submission Date')
    cy.get('[data-field="submitter_user_id"]').should('have.text', 'Submitter Username')
    cy.get('[data-field="submitter_agency_name"]').should('have.text', 'Submitter Agency')
    cy.get('[data-field="submission_status_code"]').should('have.text', 'Status')
    cy.get('[data-field="sample_count"]').should('have.text', '# Samples')
    cy.get('[data-field="results_count"]').should('have.text', '# Results')
    cy.get('[data-field="delete"]').should('have.text', 'Delete')
    cy.get('[data-field="messages"]').should('have.text', 'Messages')

    cy.get('.MuiDataGrid-row').should('have.length', 0) // should have 0 rows when page loads

    cy.get('.MuiTablePagination-root .MuiTablePagination-select').should('be.visible').should('have.text', '10')
    cy.get('.MuiTablePagination-root .MuiTablePagination-displayedRows').should('be.visible').should('have.text', '0–0 of 0')
  })

  it('should conduct the search correctly', () => {
    cy.get('#search-button')
      .should('exist')
      .should('have.text', 'Search')
      .click()
    cy.get('.MuiDataGrid-row')
      .its('length')
      .then((numRows) => {
        expect(numRows).to.be.lte(10) // should have at 10 rows for base search
        cy.get('.MuiTablePagination-root .MuiTablePagination-select')
          .should('be.visible')
          .should('have.text', `${numRows}`)
        cy.get('.MuiTablePagination-root .MuiTablePagination-displayedRows')
          .should('be.visible')
          .should('contain', `1–${numRows}`)
      })

    //change number of rows returned
    paginationTests.forEach((test) => {
      cy.get('.MuiTablePagination-root .MuiTablePagination-select').click() // clicking the rows per page dropdown
      cy.get(`[data-value="${test.pageSize}"]`).click() // selecting the page size
      cy.wait(1000) // wait for render

      const totalRecords = cy
        .get('.MuiTablePagination-root .MuiTablePagination-displayedRows')
        .should('be.visible')
        .invoke('text')
        .then((text) => {
          // Extract the total number of records from the text
          const totalRecordsMatch = text.match(/of (\d+)/)
          const totalRecords = totalRecordsMatch
            ? parseInt(totalRecordsMatch[1], 10)
            : null
          const totalPages = Math.ceil(totalRecords / test.pageSize)
          let iterator = 1

          while (iterator < totalPages) {
            cy.get('.MuiDataGrid-row')
              .its('length')
              .then((numRows) => {
                cy.get('.MuiTablePagination-root .MuiTablePagination-select')
                  .should('be.visible')
                  .should('have.text', `${test.pageSize}`)
                
                  if (iterator === totalPages){
                    expect(numRows).to.be.lte(test.pageSize)
                  }else{
                    expect(numRows).to.be.eq(test.pageSize)
                  }
              })
            
            cy.log("GOING NEXT!!!!!!!!!!!!")
            cy.get('[aria-label="Go to next page"]').click()
            iterator += 1

          }
        })
    })
  })
})
