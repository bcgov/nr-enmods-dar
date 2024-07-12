/// <reference types="cypress" />
const testData = [
  {
    numFiles: 1,
    filepath: 'cypress/testUploadFiles/cypressTestTxt.txt',
    description: 'drag and drop one text file',
    filename: ['cypressTestTxt.txt'],
  },
  {
    numFiles: 1,
    filepath: 'cypress/testUploadFiles/cypressTestCSV.csv',
    description: 'drag and drop one csv file',
    filename: ['cypressTestCSV.csv'],
  },
  {
    numFiles: 1,
    filepath: 'cypress/testUploadFiles/cypressTestXLSX.xlsx',
    description: 'drag and drop one xlsx file',
    filename: ['cypressTestXLSX.xlsx'],
  },
  {
    numFiles: 3,
    filepath: [
      'cypress/testUploadFiles/cypressTestTxt.txt',
      'cypress/testUploadFiles/cypressTestCSV.csv',
      'cypress/testUploadFiles/cypressTestXLSX.xlsx',
    ],
    description: 'drag and drop one text file, csv and xlsx file',
    filename: [
      'cypressTestTxt.txt',
      'cypressTestCSV.csv',
      'cypressTestXLSX.xlsx',
    ],
  },
]

describe('File Upload page functionality', () => {
  beforeEach(function () {
    cy.viewport('macbook-16')
    cy.kcLogout().kcLogin()
  })

  it('should be on the submit page', () => {
    cy.get('.MuiTypography-h3').should(
      'have.text',
      'Electronic Data Transfer - Upload',
    )
  })

  testData.forEach((data) => {
    it('should ' + data.description, () => {
      cy.get('#file-upload').selectFile(data.filepath, {
        action: 'drag-drop',
      })

      if (data.numFiles == 1) {
        cy.get('#file-list-dropdown > label').should(
          'have.text',
          '1 files selected',
        )
      } else if (data.numFiles == 3) {
        cy.get('#file-list-dropdown > label').should(
          'have.text',
          '3 files selected',
        )
      }

      cy.get('#select-all-checkbox').should('be.checked')
      cy.get('#select-all-text').should('have.text', 'Select All')

      for (var i = 0; i < data.numFiles; i++) {
        cy.get('#selected-file-' + i)
          .children()
          .first()
          .should('have.text', data.filename[i])
        cy.get('#delete-file-' + i).should('exist')
        cy.get('#selected-file-' + i + '-checkbox').should('be.checked')
        cy.get('#selected-file-' + i + '-text').should(
          'have.text',
          'Receive Email Conformation',
        )
        cy.get('#selected-file-' + i + '-validate').should(
          'have.text',
          'Validate',
        )
        cy.get('#selected-file-' + i + '-submit').should('have.text', 'Submit')

        cy.get('#all-files-validate').should('have.text', 'Validate All')
        cy.get('#all-files-submit').should('have.text', 'Submit All')
      }
    })
  })
})
