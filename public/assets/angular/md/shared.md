# shared

Contains reusable code used across different components, pages, and layouts.

Use this folder for reusable definitions and stateless helpers, or services instantiated independently by their consumers. Application-wide instances belong in `core/`. Code instantiated and used solely within one child folder belongs with that child, even if it has only one instance.

- `components/`: Reusable UI elements.
- `directives/`: Custom directives for DOM logic.
- `pipes/`: Data transformation pipes.
- `services/`: Reusable service definitions with consumer-owned instances.
