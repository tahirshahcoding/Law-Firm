from rest_framework import serializers

class ReportFilterSerializer(serializers.Serializer):
    """
    Validates incoming query parameters for all report endpoints.
    Translates raw params into safe Django ORM filters, while rigorously enforcing 
    role-based scope limits so staff cannot scrape outside their access level.
    """
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    staff_id = serializers.IntegerField(required=False, allow_null=True)
    status = serializers.CharField(required=False, allow_null=True, max_length=50)
    court_id = serializers.IntegerField(required=False, allow_null=True)
    category = serializers.CharField(required=False, allow_null=True, max_length=100)

    def to_orm_filters(self, user, prefix=''):
        """
        Converts the validated filter data into Django ORM kwargs.
        Applies strict role scoping based on the requesting user.
        `prefix` allows appending these filters across relationships (e.g. 'invoice__case__')
        """
        data = self.validated_data
        filters = {}

        # Safe attribute mapping
        if data.get('start_date'):
            # We map generic start_date to created_at by default, 
            # though some reports might override this to 'date' or 'payment_date'
            filters[f'{prefix}created_at__gte'] = data['start_date']
        if data.get('end_date'):
            filters[f'{prefix}created_at__lte'] = data['end_date']
        if data.get('status'):
            filters[f'{prefix}status'] = data['status']
        if data.get('court_id'):
            filters[f'{prefix}court_id'] = data['court_id']
        if data.get('category'):
            filters[f'{prefix}category'] = data['category']

        # Scoping Enforcement
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', '')

        # High-privilege roles can filter by any staff member
        if role in ('Admin', 'Senior Partner', 'Manager'):
            if data.get('staff_id'):
                filters[f'{prefix}assigned_to'] = data['staff_id']
        else:
            # Low-privilege roles are forcibly scoped to their OWN ID, 
            # ignoring whatever staff_id they passed in the query params.
            filters[f'{prefix}assigned_to'] = user.id

        return filters
