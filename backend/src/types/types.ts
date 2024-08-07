/**
 * Type of data returned by CSS user api
 */
export type IdirUserInfo = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  attributes: {
    idir_user_guid: string[];
    idir_username: string[];
    display_name: string[];
  };
};

/**
 * Type returned to the frontend for displaying users on Admin page
 */
export type UserInfo = {
  username: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  idirUsername: string;
  role: string[];
};

export type FileInfo = {
  submission_id: string;
  file_name: string, 
  submission_date: Date,
  submitter_user_id: string,
  submitter_agency_name: string,
  submission_status_code: string,
  sample_count: number,
  results_count: number,
}

export type ResultsWithCount = {
  results: [],
  count: number,
}
