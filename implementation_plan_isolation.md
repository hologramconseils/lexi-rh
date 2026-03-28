# Implementation Plan - Resource Isolation by Employer Workspace

This plan outlines the changes required to ensure that each employer/HR account in Lexi-RH has its own isolated document repository, and that the AI (search) only uses documents from the active workspace.

## User Review Required

> [!IMPORTANT]
> - Each **Employer** account will now be linked to a unique **Workspace**.
> - **Employee** accounts will need to be linked to an Employer's Workspace to access their specific documents.
> - Current documents in the database will be assigned to a default workspace (e.g., that of the admin) during migration.
> - "Global" documents (like the Labor Code) must currently be uploaded to each employer's workspace if you want them accessible, as per your request to NOT mix global documents unless associated with the account.

## Proposed Changes

### Core / Backend

#### [NEW] [workspace.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/app/models/workspace.py)
- Define a `Workspace` model with `id`, `name`, and `created_at`.

#### [MODIFY] [user.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/app/models/user.py)
- Add `workspace_id` foreign key.
- Update `to_dict` to include `workspace_id`.

#### [MODIFY] [document.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/app/models/document.py)
- Add `workspace_id` foreign key.
- Update `to_dict` to include `workspace_id`.

#### [MODIFY] [auth.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/app/routes/auth.py)
- Update `register`: if role is `employer`, create a new `Workspace` and link the user.
- If role is `employee`, for now, create a dummy or allow optional workspace (needs clarification on how employees join an employer).

#### [MODIFY] [documents.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/app/routes/documents.py)
- Update `upload_document` to assign the `current_user.workspace_id`.
- Update `list_documents`, `delete_document`, `search_documents`, and `suggest_documents` to filter by `current_user.workspace_id`.

#### [MODIFY] [pg_search_service.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/app/services/pg_search_service.py)
- Update `search`, `_search_postgres`, `_search_sqlite`, and `suggest` methods to accept `workspace_id`.
- Inject the `workspace_id` filter into the SQL queries.

### Data Management

#### [NEW] [migrate_workspaces.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/migrate_workspaces.py)
- Script to create initial workspaces for existing users and assign existing documents to them to avoid data loss.

## Open Questions

> [!QUESTION]
> 1. How should **Employees** be linked to an **Employer's** workspace? Should they be assigned manually by the employer, or use an invite code?
> 2. For **Global** documents (e.g., Code du travail), should they be copied to every new workspace automatically, or should there be a specialized "System Workspace" that all accounts can read from (but not write to)? The current request says "No global documents unless associated with the account", so I will assume manual upload or script-based replication for now.

## Verification Plan

### Automated Tests
- Create test users with different roles (two separate employers).
- Upload different documents to each employer workspace.
- Verify that search results for Employer A only show documents from Workspace A.
- Verify that Employer B cannot see or search documents from Workspace A.

### Manual Verification
1. Login as Employer A, upload a "Convention A".
2. Login as Employer B, upload a "Convention B".
3. Search from Employer A's dashboard: ensure only "Convention A" appears.
4. Verify that existing admin accounts still work and can see their own workspace documents.
