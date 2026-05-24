# Bugfix Requirements Document

## Introduction

After a staff user uploads a profile picture via the Settings → My Profile page, the avatar displays as a broken image icon instead of the actual photo. This affects the profile settings page, the top navigation bar avatar, and the Users management table. The bug manifests in two related failure modes: (1) the avatar URL returned by the backend is either missing or not resolvable by the browser, and (2) the frontend `AuthContext` user state is never refreshed after a successful upload, so the new avatar URL is never propagated to the UI components that depend on it.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user uploads a profile picture and the backend has no `request` object available in the serializer context THEN the system returns a relative path (e.g. `/media/avatars/photo.jpg`) instead of an absolute URL, which the browser cannot load cross-origin from the frontend

1.2 WHEN a user successfully saves their profile with a new avatar via `PUT /api/users/me/` THEN the system does not update the `AuthContext` user state with the new avatar URL, so the top navigation bar and profile page continue to show the broken/old avatar until a full page reload

1.3 WHEN the application is running in production with `DEBUG=False` and `USE_S3=False` THEN the system does not serve files under the `/media/` URL path because the media static route is only registered when `DEBUG=True`, making all uploaded avatar files inaccessible via HTTP

1.4 WHEN a user's avatar URL points to `http://localhost:8000/media/...` and the frontend is deployed to a different origin THEN the system renders a broken image because the browser cannot resolve the localhost URL in a non-local environment

### Expected Behavior (Correct)

2.1 WHEN the serializer builds the avatar URL and no `request` object is available in context THEN the system SHALL construct a fully-qualified absolute URL using the configured backend host, so the browser can load the image cross-origin

2.2 WHEN a user successfully saves their profile with a new avatar THEN the system SHALL refresh the `AuthContext` user state with the updated user data (including the new avatar URL) returned by the API response, so all avatar-displaying components update immediately without a page reload

2.3 WHEN the application is running with `USE_S3=False` (local disk storage) THEN the system SHALL serve files under the `/media/` URL path regardless of the `DEBUG` setting, so uploaded avatars are accessible in all environments

2.4 WHEN the backend returns an avatar URL THEN the system SHALL always return a fully-qualified absolute URL (including scheme and host) that is reachable from the frontend's origin, not a localhost URL or a relative path

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user has no avatar uploaded THEN the system SHALL CONTINUE TO display the user's initial letter as a fallback avatar in the navigation bar, profile page, and users table

3.2 WHEN a user updates their username, email, or password without changing their avatar THEN the system SHALL CONTINUE TO preserve the existing avatar and display it correctly after the save

3.3 WHEN a user uploads a new avatar file THEN the system SHALL CONTINUE TO show a local preview of the selected image immediately (before the form is submitted), using the browser's object URL

3.4 WHEN the application is running in production with `USE_S3=True` THEN the system SHALL CONTINUE TO store and serve avatar files via the configured S3/Supabase storage backend, unaffected by any changes to the local disk serving logic

3.5 WHEN an admin updates another user's avatar via the Users management page (`PUT /api/users/admin/<id>/`) THEN the system SHALL CONTINUE TO save the avatar file and return the correct absolute URL in the response

---

## Bug Condition Pseudocode

**Bug Condition Function** — identifies inputs that trigger the broken avatar:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AvatarUploadRequest
  OUTPUT: boolean

  // Bug triggers when ANY of the following is true:
  RETURN (
    X.serializer_context.request IS NULL                  // no request → relative URL
    OR X.auth_context_refreshed_after_save = FALSE        // stale user state in frontend
    OR (X.use_s3 = FALSE AND X.debug = FALSE              // media not served in prod
        AND X.media_route_registered = FALSE)
  )
END FUNCTION
```

**Property: Fix Checking**

```pascal
// For all avatar upload requests that hit the bug condition:
FOR ALL X WHERE isBugCondition(X) DO
  result ← uploadAvatar'(X)
  ASSERT result.avatar_url IS NOT NULL
  ASSERT result.avatar_url STARTS WITH 'http'            // absolute URL
  ASSERT result.avatar_url IS resolvable from frontend origin
  ASSERT frontend_user_state.avatar = result.avatar_url  // context updated
END FOR
```

**Property: Preservation Checking**

```pascal
// For all requests that do NOT hit the bug condition:
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT uploadAvatar(X) = uploadAvatar'(X)              // behavior unchanged
END FOR
```
