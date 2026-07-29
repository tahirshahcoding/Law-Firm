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

export const CLOSURE_REASONS = [
  'Won', 'Lost', 'Settled', 'Withdrawn', 'Dismissed', 'Transferred', 'Disposed', 'Compromised'
];

export const getSuggestedNextStage = (currentStage: string) => {
  switch (currentStage) {
    case 'Attendance':
    case 'Motion':
      return 'Submission of W/R/S';
    case 'Submission of W/R/S':
    case 'Arguments on application':
    case 'Scheduling Conference':
      return 'ISSUES';
    case 'ISSUES':
      return 'Plaintiff evidence';
    case 'Plaintiff evidence':
      return 'Defendant evidence';
    case 'Defendant evidence':
      return 'Statement of accused';
    case 'Statement of accused':
      return 'Final arguments';
    case 'Final arguments':
      return 'Order';
    default:
      return currentStage;
  }
};

export const getClosureColor = (reason: string) => {
  switch (reason) {
    case 'Won':        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Lost':       return 'bg-red-50 text-red-700 border-red-200';
    case 'Settled':
    case 'Compromised': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Withdrawn':  return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Dismissed':  return 'bg-slate-100 text-slate-600 border-slate-300';
    case 'Transferred':return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Disposed':   return 'bg-teal-50 text-teal-700 border-teal-200';
    default:           return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};
