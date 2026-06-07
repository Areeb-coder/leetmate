// process environment polyfill for browser context
// @ts-ignore
const globalObj = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};
// @ts-ignore
globalObj.process = globalObj.process || { env: { NODE_ENV: 'production' } };
export {};
