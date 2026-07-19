export const CASE_CATEGORIES = ['Civil', 'Criminal', 'Family', 'Property', 'Tax', 'Corporate', 'Banking', 'Constitutional', 'Service Matters', 'Consumer Court', 'Cyber Crime', 'Intellectual Property', 'Labour Court', 'Arbitration'];
export const CASE_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const CASE_STATUSES = ['Consultation', 'Case Accepted', 'Documentation Pending', 'Filing in Progress', 'Filed', 'Under Trial', 'Evidence Stage', 'Arguments Stage', 'Judgment Reserved', 'Decided', 'Appeal', 'Closed - Won', 'Closed - Lost', 'Closed - Settled', 'Closed - Withdrawn', 'Closed - Dismissed', 'Archived', 'Active', 'Closed'];
export const COURT_TYPES = ['Supreme Court', 'High Court', 'District Court', 'Civil Court', 'Family Court', 'Sessions Court', 'Consumer Court'];

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Closed - Won':
    case 'Decided':
    case 'Active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'Closed - Lost':
    case 'Closed - Dismissed':
      return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
    case 'Consultation':
    case 'Case Accepted':
    case 'Documentation Pending':
    case 'Closed':
    case 'Archived':
      return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
    case 'Under Trial':
    case 'Evidence Stage':
    case 'Arguments Stage':
    case 'Judgment Reserved':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'Closed - Settled':
    case 'Closed - Withdrawn':
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
    case 'Filing in Progress':
    case 'Filed':
    case 'Appeal':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  }
};
