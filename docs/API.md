# NETDRAW REST API

All endpoints are prefixed with `/api/v1`. JSON only.

Swagger UI: `/docs` (served by the backend).

## Health

### `GET /health`

Returns the service status. Always 200 unless the process is dead.

```json
{ "status": "ok", "service": "netdraw-backend", "version": "0.1.0" }
```

### `GET /health/ready`

Returns 200 if the database connection is alive, 503 otherwise.

## Projects

### `GET /projects`

Lists all projects, sorted by most recently updated.

Response:

```json
{
  "projects": [
    {
      "id": "ckxyz...",
      "name": "Enterprise LAN",
      "description": "...",
      "thumbnail": "data:image/png;base64,...",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-02T00:00:00.000Z"
    }
  ]
}
```

### `POST /projects`

Creates a new project.

Request body:

```json
{
  "name": "My diagram",
  "description": "optional",
  "thumbnail": "data:image/png;base64,...",
  "data": { "schema": 1, "layers": [...], "shapes": [...], "connectors": [...], "page": {...} }
}
```

`data` may also be a pre-serialized JSON string (compressed `.ndj` payload).

Response: `201` with `{ "project": { ... } }`.

### `GET /projects/:id`

Fetches a single project, including its full `data` field.

### `PUT /projects/:id`

Updates a project. Same body as `POST /projects`, all fields optional.

### `POST /projects/:id/save`

Alias of `PUT /projects/:id` used by the auto-save loop. Returns `{ saved: true }`.

### `POST /projects/:id/duplicate`

Creates a copy of the project, with `" (copy)"` appended to the name.

### `DELETE /projects/:id`

Hard-deletes a project. Returns `{ deleted: true }`.

## Assets

### `POST /assets/svg`

Sanitizes an SVG and stores it. Returns the cleaned SVG plus its `id`.

Request body:

```json
{
  "svg": "<svg ...>...</svg>",
  "filename": "my-icon.svg",
  "projectId": "ckxyz..." // optional
}
```

The server strips `<script>`, `on*` event handlers, `<foreignObject>` and
DTDs before storing. Any payload above `MAX_UPLOAD_MB` (default 2 MB) is
rejected with `413`.

### `GET /assets/:id`

Returns the cleaned SVG with `Content-Type: image/svg+xml` and long cache
headers.

## Error model

Errors are always JSON:

```json
{ "error": { "code": "not_found", "message": "Project not found" } }
```

| Status | Code                | When                               |
| ------ | ------------------- | ---------------------------------- |
| 400    | `validation_error`  | Zod validation failed              |
| 400    | `bad_request`       | Generic client error               |
| 401    | `unauthorized`      | Auth required (when enabled)       |
| 404    | `not_found`         | Resource not found                 |
| 409    | `conflict`          | Duplicate / state conflict         |
| 413    | `payload_too_large` | Body exceeds `MAX_UPLOAD_MB`       |
| 422    | `invalid_svg`       | SVG payload could not be sanitized |
| 429    | `rate_limited`      | Too many requests                  |
| 500    | `internal_error`    | Server crash                       |

## Rate limiting

Default: 300 requests per minute per IP. Configure with
`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW`.

## CORS

Defaults to `http://localhost:5173,http://localhost:8080`. Set the
`CORS_ORIGIN` env var to a comma-separated list, or `*` for development.
