if (process.env.NODE_ENV !== 'test') throw new Error('Test accounts may only be seeded with NODE_ENV=test.');
console.log('Provide isolated test fixtures from the test runner; no credentials are committed.');
