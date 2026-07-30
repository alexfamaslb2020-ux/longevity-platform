import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testRegex: ".*\\.spec\\.(ts|tsx)$",
  collectCoverageFrom: ["src/**/*.(ts|tsx)", "!src/**/*.d.ts"],
};

export default config;
