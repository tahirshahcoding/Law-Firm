from rest_framework.permissions import BasePermission

class HasModulePermission(BasePermission):
    """
    A custom permission class that enforces granular permissions based on the user's role 
    and the 'required_module' attribute defined on the ViewSet.
    """
    message = "You do not have the required permissions for this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Clients don't have 'profile', they have 'client_profile'
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return False
            
        # Admins have unrestricted access
        if profile.role == 'Admin':
            return True
            
        # The ViewSet MUST define `required_module` (e.g. required_module = 'cases')
        module_name = getattr(view, 'required_module', None)
        if not module_name:
            return False # Fail safe: deny if developer forgot to specify module
            
        # Get granular permissions dict for this specific module
        perms = profile.permissions.get(module_name, {})
        
        # Map standard REST HTTP methods to CRUD action keys
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return perms.get('view', False)
        elif request.method == 'POST':
            return perms.get('add', False)
        elif request.method in ('PUT', 'PATCH'):
            return perms.get('edit', False)
        elif request.method == 'DELETE':
            return perms.get('delete', False)
            
        return False

class ReportPermission(BasePermission):
    """
    Specific permission for the Reports hub.
    - Any staff can access 'cases' and 'hearings' reports.
    - Only Admin or Partner can access 'financial' or 'staff_productivity' reports.
    Note: The view MUST define `report_category` (e.g., 'financial').
    """
    message = "You do not have the required role to view this report category."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return False
            
        # Role defaults
        role = profile.role

        category = getattr(view, 'report_category', None)
        if not category:
            return False # Fail safe
            
        if category in ('financial', 'staff_productivity'):
            if role not in ('Admin', 'Senior Partner', 'Accountant'):
                return False
                
        # All staff roles can view 'cases', 'hearings', etc.
        # But if role is 'Client', they shouldn't see internal reports
        if role == 'Client':
            return False
            
        return True
