const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

function createLoader(mocks = {}, globals = {}, sourceOverrides = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} }; cache.set(absolute, module);
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    const source = sourceOverrides[relative] ?? fs.readFileSync(absolute, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const localRequire = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('.') || name.startsWith('@/')) {
        const target = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(path.dirname(absolute), name);
        const resolved = [target, target + '.ts', target + '.tsx'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (!resolved) throw new Error(`Unresolved test module: ${name}`);
        return load(resolved);
      }
      throw new Error(`Provide an explicit runtime adapter for ${name}`);
    };
    new vm.Script(code, { filename: file }).runInNewContext({
      module, exports: module.exports, require: localRequire, console, fetch, Headers, Response,
      AbortController, setTimeout, clearTimeout, __DEV__: false, ...globals,
    });
    return module.exports;
  }
  return load;
}

function hookRuntime() {
  const states = []; let cursor = 0;
  const hooks = {
    createContext: () => ({ Provider: 'Provider' }),
    useState(initial) { const at = cursor++; if (!(at in states)) states[at] = typeof initial === 'function' ? initial() : initial; return [states[at], next => { states[at] = typeof next === 'function' ? next(states[at]) : next; }]; },
    useCallback: callback => callback, useMemo: callback => callback(), useEffect() {},
  };
  const jsx = (type, props) => ({ type, props });
  return { hooks, jsx, render(component, props = {}) { cursor = 0; return component(props); } };
}

function createNativeRuntime(base, fetchImpl = fetch, sourceOverrides = {}) {
  const values = new Map(); const remembered = new Map(); const h = hookRuntime();
  // Only the native bridge is adapted. API, storage serialization, auth and validation are real source.
  const load = createLoader({
    'react-native': { Platform: { OS: 'android' } },
    'expo-secure-store': { getItemAsync: async key => values.get(key) ?? null, setItemAsync: async (key, value) => { values.set(key, value); }, deleteItemAsync: async key => { values.delete(key); } },
    '@react-native-async-storage/async-storage': { getItem: async key => remembered.get(key) ?? null, setItem: async (key, value) => { remembered.set(key, value); }, removeItem: async key => { remembered.delete(key); } },
    '@/config/env': { appEnv: { apiBaseUrl: base } },
    react: h.hooks, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx },
  }, { fetch: fetchImpl }, sourceOverrides);
  const { AuthProvider } = load('src/features/auth/context/auth-provider.tsx');
  return { load, storage: load('src/features/auth/storage/authTokenStorage.ts').authTokenStorage,
    api: load('src/api/apiClient.ts'), auth: load('src/features/auth/api/authApi.ts'),
    family: load('src/features/family/api/familyApi.ts').familyApi,
    context: () => h.render(AuthProvider).props.value };
}
module.exports = { createLoader, hookRuntime, createNativeRuntime };
