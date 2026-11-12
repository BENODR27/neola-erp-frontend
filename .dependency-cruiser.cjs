module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: { path: '^src/app' },
      to: { circular: true },
    },
    {
      name: 'no-test-imports-in-runtime',
      severity: 'error',
      from: { pathNot: '\\.spec\\.ts$' },
      to: { path: '\\.spec\\.ts$' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    exclude: ['(^|/)dist/', '(^|/)\\.angular/'],
  },
};
