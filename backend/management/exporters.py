import csv
from io import BytesIO
from django.http import HttpResponse
from django.template.loader import render_to_string

try:
    from xhtml2pdf import pisa
except ImportError:
    pisa = None

def sanitize_csv_cell(value):
    """
    Prevents CSV injection vulnerabilities.
    If a cell begins with =, +, -, or @, Excel interprets it as a formula.
    Prefixing with a single quote forces text interpretation.
    """
    if isinstance(value, str) and value and value[0] in ('=', '+', '-', '@'):
        return "'" + value
    return value

def export_to_csv(data, filename, fields=None):
    """
    Converts a list of dicts to a CSV HTTP response securely.
    `data`: List of dictionaries containing row data.
    `filename`: The name of the output file.
    `fields`: List of keys to export. If None, uses keys from the first row.
    """
    if not data:
        return HttpResponse("No data to export.", status=204)
        
    if fields is None:
        fields = list(data[0].keys())

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'

    writer = csv.DictWriter(response, fieldnames=fields)
    writer.writeheader()
    
    for row in data:
        sanitized_row = {k: sanitize_csv_cell(row.get(k, '')) for k in fields}
        writer.writerow(sanitized_row)
        
    return response

def export_to_pdf(template_src, context_dict, filename):
    """
    Renders a secure Django HTML template and converts it to a PDF using xhtml2pdf.
    Server-side rendering neutralizes frontend HTML/CSS injection vulnerabilities.
    """
    if not pisa:
        return HttpResponse("PDF generation library is not installed on the server.", status=501)
        
    html = render_to_string(template_src, context_dict)
    result = BytesIO()
    
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    if not pdf.err:
        response = HttpResponse(result.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
        return response
        
    return HttpResponse("Error generating secure PDF document.", status=500)
