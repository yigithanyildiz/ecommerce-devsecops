# Security Controls

This project uses multiple DevSecOps controls across pull request validation, test deployment, and production release.

## Pull Request Security

### Secret Scanning

Gitleaks runs on pull requests to detect accidental secrets before code is merged.

### SAST

Semgrep runs as a static application security testing step during pull request validation. It scans the codebase using OWASP-oriented rules and produces a SARIF report.

### Container And Configuration Scanning

Trivy runs during pull request validation to scan the repository filesystem for vulnerable packages, container configuration issues, embedded secrets, and infrastructure misconfigurations. High and critical findings fail the pipeline, while a SARIF report is uploaded as a workflow artifact.

### Dependency Audit

`npm audit --audit-level=high` runs during backend and admin web validation to detect high and critical severity vulnerable npm dependencies.

The audit gate is enforced in pull request validation, TEST deployment, and PROD deployment workflows. Low and moderate findings remain visible in audit output and Dependabot alerts, but they do not fail the pipeline under the current policy.

## Runtime Security

### Security Headers

The backend uses Helmet to set common HTTP security headers.

### CORS

CORS is restricted through the `CORS_ORIGIN` environment variable. Wildcard CORS is not used in test or production.

### Cache Control

API responses include no-store cache directives to reduce the risk of sensitive API responses being cached.

### Nginx Server Tokens

Nginx `server_tokens` is disabled on the VM to avoid leaking the exact Nginx and operating system version.

## DAST

OWASP ZAP Baseline runs after the TEST deployment and health check. Reports are uploaded as GitHub Actions artifacts.

## Access Control

The API uses JWT authentication. Administrative product creation is protected by role-based authorization and requires the `ADMIN` role.

## Production Controls

Production deployment is performed through the `develop -> main` flow and protected by manual approval gates.
