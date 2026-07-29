export const CASE_CATEGORIES = [
  'Civil Trial', 'Criminal Trial', 'Family Trial', 'Complaint Cases',
  'Civil Appeal', 'Criminal Appeal', 'Family Appeal', 'Revenue Cases',
  'Civil Revision', 'Criminal Revision', 'Rent Controller', 'Writ Petition',
  'Quashment', 'Service matter', 'Consumer Court', 'Labour Court',
  'Drug Court', 'Banking Court', 'Taxation / Corporate'
];

export const CASE_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const CASE_STATUSES = [
  'Attendance', 'Motion', 'Framing of Charge', 'Submission of W/R/S',
  'Arguments on application', 'Scheduling Conference', 'ISSUES',
  'Plaintiff evidence', 'Defendant evidence', 'Statement of accused',
  'Final arguments', 'Order', 'Conciliation', 'Re-conciliation'
];

export const COURT_TYPES = ['Supreme Court', 'High Court', 'District Court', 'Civil Court', 'Family Court', 'Sessions Court', 'Consumer Court'];

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Order':
    case 'Conciliation':
    case 'Re-conciliation':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'Framing of Charge':
    case 'Submission of W/R/S':
    case 'Arguments on application':
    case 'Scheduling Conference':
    case 'ISSUES':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'Plaintiff evidence':
    case 'Defendant evidence':
    case 'Statement of accused':
    case 'Final arguments':
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
    case 'Attendance':
    case 'Motion':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  }
};
