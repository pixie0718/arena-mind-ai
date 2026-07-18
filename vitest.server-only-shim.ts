// `server-only` throws unless resolved under Next.js's own "react-server"
// export condition (see node_modules/server-only/package.json), which only
// Next.js's build sets. Vitest never sets it, so every module that imports
// `server-only` would throw during a unit test even though nothing here is
// actually bundling this code for a browser — the guard's premise (are we
// building a client bundle?) doesn't apply to running tests in Node. This
// shim is what `server-only` resolves to instead, aliased in
// vitest.config.ts, matching what Next.js itself does under its
// "react-server" condition (see empty.js in the real package).
export {};
