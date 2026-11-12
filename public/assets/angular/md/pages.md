# pages

Page components represent **distinct views or screens within the application**.   
They are typically **associated with a specific route** and are responsible for displaying the content related to that route.

Keep services, state, helpers, and tests used only by one page inside that page's folder. Instantiate or provide them at that page's boundary. Promote an application-wide instance to `core/` only when its lifetime and consumers span the application; use `shared/` for reusable definitions with independent instances.

## Example

```typescript
@component{(
  selector: 'example-page',
  templateUrl: 'example.page.html',
  styleUrl: 'example.page.scss', // Only if fils contains code,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class examplePage {
  // Page logic here
}
```
