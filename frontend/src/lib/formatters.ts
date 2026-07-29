export function formatCaseTitle(caseObj: any): string {
  if (!caseObj) return 'Unknown Case';
  
  const client = caseObj.client_name || caseObj.client__name || caseObj.case__client__name || 'Unknown Client';
  const opponent = caseObj.opponent_name || 'Unknown Opponent';
  
  return `${client} vs. ${opponent}`;
}

export function formatCaseTitleWithNumber(caseObj: any): string {
  const title = formatCaseTitle(caseObj);
  const number = caseObj.case_number ? ` (${caseObj.case_number})` : '';
  return `${title}${number}`;
}
