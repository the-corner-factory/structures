# services

Application-wide services for business logic, API calls, and data management. Their instances are owned by the application and used across features.

## Example

- `dal.service.ts`: Data access layer for API communication.
- `session.service.ts`: Manages user session and authentication state.

## Usage

Provide application-wide instances in root. If a service is instantiated and used solely in one child folder, move its definition and registration to that owner instead. Reusable definitions with independent consumer-owned instances belong in `shared/services/`.
