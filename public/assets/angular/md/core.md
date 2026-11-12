# core

Owns application-wide infrastructure and instances created once for the application and used across its features. Placement follows ownership and lifetime, not the number of times a class happens to be constructed.

Code instantiated and used exclusively by one child folder belongs in that folder, including a feature-local singleton. Reusable code instantiated independently by several features belongs in `shared/`.

- `guards/`: Route guards for access control.
- `interceptors/`: HTTP interceptors for request/response handling.
- `models/`: Models, enums, and interfaces owned by core infrastructure.
- `services/`: Singleton services for business logic and API calls.
- `utils/`: Helpers owned by core infrastructure; general reusable helpers belong in `shared/`.

## Services
Provide application-wide Angular services in root. A service used only by one feature should be declared and provided at that feature's boundary; moving its file alone does not change its injector lifetime.

```typescript
@Injectable({
  providedIn: 'root',
})
export class SingletonService {
  // Service logic here
}
```
