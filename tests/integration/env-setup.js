const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, './.env')));
Object.keys(envConfig).forEach((k) => {
  process.env[k] = envConfig[k];
});

const flushDBs = require('./flushDBs');

beforeAll(async () => {
  await flushDBs();
});

afterAll(async () => {
  await flushDBs();
});
