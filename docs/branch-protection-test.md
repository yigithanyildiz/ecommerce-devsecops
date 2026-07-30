# Branch Protection Test

Changes must go through pull requests and required checks.

## Recommended Required Checks

For pull requests into `develop` and `main`, mark these PR validation checks as required:

```text
Backend Validation
Admin Web Validation
Secret Scan
Trivy Security Scan
SAST Semgrep
```

These checks cover backend build/test/audit, admin web build/audit, secret scanning,
container/config scanning, and SAST.

For `main`, also keep the source branch rule:

```text
Only develop can be merged into main.
```

## Severity Gates

Current merge-blocking security policy:

```text
Dependency audit: high/critical npm findings fail
Trivy scan: high/critical findings fail
Secret scan: any detected secret fails
Semgrep: reports SARIF findings for review
```

Low and moderate dependency findings remain visible in Dependabot/audit output but
do not fail the pipeline under the current policy.
