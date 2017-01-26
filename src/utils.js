export const chain = (data, f) => data.reduce((acc, v) => acc.concat(f(v)), []);

const hasProp = obj => prop => Object.prototype.hasOwnProperty.call(obj, prop);

export const hasAny = (obj, props) => props.some(hasProp(obj));

export const mapObj = (obj, fn) =>
  Object.keys(obj).reduce((acc, k) => ({ ...acc, [k]: fn(obj[k]) }), {});

export function toLower(s) {
  if (typeof s !== 'string') return s;
  return s.toLowerCase();
}

export function unornull(a) {
  return a === undefined || a === null;
}
