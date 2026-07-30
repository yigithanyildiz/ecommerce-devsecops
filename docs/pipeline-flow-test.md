# Pipeline Flow Test

This document verifies the feature to develop to main delivery flow.

## Flow

```text
feature/* -> pull request -> develop -> TEST deployment
develop -> pull request -> main -> PROD deployment
```

## PR Validation Layer

Pull requests run:

```text
Backend Validation
Admin Web Validation
Secret Scan
Trivy Security Scan
SAST Semgrep
```

Security findings are split across GitHub surfaces:

```text
Dependabot alerts: dependency vulnerabilities
Code scanning: Semgrep and Trivy SARIF findings
Actions logs/artifacts: raw pipeline output and reports
Security advisories: private vulnerability coordination
```
