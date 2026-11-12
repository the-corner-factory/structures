# features

Feature modules for distinct areas of the application, such as authentication and dashboard.

Keep code instantiated and used exclusively within a feature inside that feature. This includes feature-local singletons, services, state, helpers, and their tests. Place an instance's registration at the narrowest owning boundary; one instance does not automatically make it application-wide.

- `auth/`: Authentication feature module.
- `dashboard/`: Dashboard feature module.
