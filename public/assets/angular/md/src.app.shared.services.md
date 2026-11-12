# services

Reusable service definitions instantiated independently by multiple features. Their consumers own the instances and provider lifetime.

## Example

- `form-draft.service.ts`: Each consuming feature provides its own draft state.

## Usage

Provide these services at their consuming feature or component boundary. An application-wide session or API client belongs in `core/services/`. A service instantiated and used only in one feature belongs inside that feature, including a feature-local singleton. Keep its tests beside it.
