# app

Contains the main application logic, modules, and features. This is where most of the code for your Angular app lives.

- `core/`: Application-wide infrastructure and instances shared across features.
- `shared/`: Reusable definitions, components, directives, and pipes with consumer-owned instances.
- `pages/`: Page owners, including their exclusively used services, state, helpers, and tests.
- `app.component.*`: Root component files for the application.

Ownership takes precedence over instance count: an instance created and used solely within one child folder belongs there. A file move does not change an Angular provider's lifetime; change registration only after reviewing that behavior.

## Module naming rules

When adopting this layout as a local template, this rule checks service and store ownership within `src/app/`. Add other source-module patterns deliberately and exclude framework entry points and public APIs. `owners` identifies the child boundaries; add `features/*` if that directory is used.

```structures-rules
{
  "rules": [
    {
      "id": "service-ownership",
      "match": "**/*.{service,store}.ts",
      "ownership": {
        "core": "core",
        "shared": "shared",
        "owners": ["pages/*", "features/*"]
      }
    }
  ]
}
```

The CLI resolves TypeScript consumers and visible construction sites. It reports provider-lifetime changes and incomplete analysis for review; it only fixes unambiguous file placement and supported references. Configure a root `tsconfig.json` covering the production source before running the ownership check.
