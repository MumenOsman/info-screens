// Checks that required env keys exist before running the program
export function validateEnv() {
  const required = [
    "receptionist_key",
    "safety_key",
    "observer_key"
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing env key: ${key}`);
    }
  }
}

// Checks that the key matches the role
export function checkKey(role, key) {
  const keys = {
    receptionist: process.env.receptionist_key,
    safety_official: process.env.safety_key,
    observer: process.env.observer_key
  };

  return keys[role] === key;
}