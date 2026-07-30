// Intentionally insecure demo file for DevSecOps presentation.
// This branch must not be merged into develop or main.

const demoToken = "ghp_000000000000000000000000000000000000";

export function runDemoExpression(userInput) {
  return eval(userInput);
}

export function getDemoToken() {
  return demoToken;
}
