module.exports = {
  rootDir: '../../',
  moduleFileExtensions: [
    'js',
    'ts',
    'json'
  ],
  testMatch: [
    '<rootDir>/src/**/test/unit/**/*.spec.(js|ts)',
  ],
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/ts-jest',
    '^.+\\.ts$': '<rootDir>/node_modules/ts-jest',
  },
  coverageDirectory: '<rootDir>/test/unit/coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/types/*.{js,ts}',
  ],
  moduleNameMapper: {
    '^src(.*)$': '<rootDir>/src$1'
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!lodash)'
  ]
}
