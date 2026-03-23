#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, true);
    } else {
      args.set(key, next);
      i++;
    }
  }
  return args;
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function jsType(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v; // "string" | "number" | "boolean" | "object"
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function mergeTypeSets(into, incoming) {
  for (const t of incoming) into.add(t);
}

function inferFromValues(values, opts) {
  // Returns an "inferred" node we can render to TS/Schema
  // inferred types:
  // { kind: 'primitive', types: Set<'string'|'number'|...>, literalEnums?: any[] }
  // { kind: 'array', items: inferred, isEmpty: boolean }
  // { kind: 'object', properties: Map<key, inferred>, required: Set, optionalByMissing: boolean }
  const nonUndef = values.filter(v => v !== undefined);

  if (nonUndef.length === 0) {
    return { kind: "unknown" };
  }

  const sampleTypes = uniq(nonUndef.map(jsType));
  if (sampleTypes.length === 1) {
    const t = sampleTypes[0];
    if (t === "array") {
      const all = nonUndef.filter(Array.isArray);
      const flat = all.flat();
      const items = inferFromValues(flat.slice(0, opts.arraySampleLimit), opts);
      return { kind: "array", items, isEmpty: flat.length === 0 };
    }
    if (t === "object") {
      const allObjs = nonUndef.filter(v => typeof v === "object" && v !== null && !Array.isArray(v));
      return inferObject(allObjs, opts);
    }
    // primitives
    return inferPrimitive(nonUndef, opts);
  }

  // Mixed root types => represent as union
  const inferredByType = new Map();
  for (const v of nonUndef) {
    const t = jsType(v);
    if (!inferredByType.has(t)) inferredByType.set(t, []);
    inferredByType.get(t).push(v);
  }

  // If it's a union of primitives and small enums, keep enums for primitives
  const unionVariants = [];
  for (const [t, vals] of inferredByType.entries()) {
    if (t === "object") unionVariants.push({ kind: "object", inferred: inferObject(vals, opts) });
    else if (t === "array") {
      const flat = vals.flat();
      unionVariants.push({ kind: "array", inferred: { kind: "array", items: inferFromValues(flat.slice(0, opts.arraySampleLimit), opts), isEmpty: flat.length === 0 } });
    } else {
      unionVariants.push({ kind: "primitive", inferred: inferPrimitive(vals, opts) });
    }
  }

  return { kind: "union", unionVariants };
}

function inferPrimitive(values, opts) {
  const types = new Set();
  const literalVals = [];

  for (const v of values) {
    const t = jsType(v);
    if (t === "array" || t === "object") continue;
    types.add(t);
    if (opts.enumMaxValues > 0) literalVals.push(v);
  }

  // Literal enum only for strings/numbers/booleans, and only if "small"
  let enumValues;
  const candidates = uniq(literalVals);
  const allSameKind = candidates.every(v => {
    const t = jsType(v);
    return t === "string" || t === "number" || t === "boolean" || v === null;
  });

  if (allSameKind && candidates.length > 0 && candidates.length <= opts.enumMaxValues) {
    enumValues = candidates;
  }

  return { kind: "primitive", types, literalEnums: enumValues };
}

function inferObject(objs, opts) {
  // objs: array of plain objects
  const allKeys = new Set();
  for (const o of objs) {
    for (const k of Object.keys(o)) allKeys.add(k);
  }

  const properties = new Map();
  const required = new Set();

  for (const key of allKeys) {
    const keyValues = [];
    let presentCount = 0;

    for (const o of objs) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        presentCount++;
        keyValues.push(o[key]);
      }
    }

    const inferred = inferFromValues(keyValues, opts);
    properties.set(key, inferred);

    if (presentCount === objs.length) required.add(key);
  }

  return { kind: "object", properties, required };
}

function escapeTsStringLiteral(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function tsTypeFromInferred(node, opts) {
  if (!node) return "unknown";

  if (node.kind === "unknown") return "unknown";

  if (node.kind === "primitive") {
    const types = Array.from(node.types);

    if (node.literalEnums && types.length === 1) {
      const t0 = types[0];
      if (t0 === "string" || t0 === "number" || t0 === "boolean") {
        if (t0 === "string") {
          const union = node.literalEnums.map(v => `'${escapeTsStringLiteral(v)}'`).join(" | ");
          return union || "string";
        }
        if (t0 === "number") {
          return node.literalEnums.map(v => String(v)).join(" | ") || "number";
        }
        if (t0 === "boolean") {
          return node.literalEnums.map(v => (v === true ? "true" : "false")).join(" | ") || "boolean";
        }
      }
    }

    // fallback union of primitives
    const mapped = types.map(t => {
      if (t === "null") return "null";
      if (t === "string") return "string";
      if (t === "number") return "number";
      if (t === "boolean") return "boolean";
      return "unknown";
    });

    return uniq(mapped).join(" | ") || "unknown";
  }

  if (node.kind === "array") {
    if (node.isEmpty) return "unknown[]";
    return `${tsTypeFromInferred(node.items, opts)}[]`;
  }

  if (node.kind === "object") {
    const lines = [];
    for (const [key, inferred] of node.properties.entries()) {
      const optional = node.required.has(key) ? "" : "?";
      lines.push(`  ${JSON.stringify(key)}${optional}: ${tsTypeFromInferred(inferred, opts)};`);
    }
    if (lines.length === 0) return `{ [k: string]: unknown }`;
    return `{\n${lines.join("\n")}\n}`;
  }

  if (node.kind === "union") {
    const parts = node.unionVariants.map(v => {
      if (v.kind === "object") return tsTypeFromInferred(v.inferred, opts);
      if (v.kind === "array") return tsTypeFromInferred(v.inferred, opts);
      return tsTypeFromInferred(v.inferred, opts);
    });
    return uniq(parts).join(" | ") || "unknown";
  }

  return "unknown";
}

function jsonSchemaFromInferred(node, opts) {
  if (!node) return {};
  if (node.kind === "unknown") return {};

  if (node.kind === "primitive") {
    const types = Array.from(node.types);
    if (node.literalEnums && types.length === 1) {
      const t0 = types[0];
      if (t0 === "string") return { type: "string", enum: node.literalEnums };
      if (t0 === "number") return { type: "number", enum: node.literalEnums };
      if (t0 === "boolean") return { type: "boolean", enum: node.literalEnums };
      if (t0 === "null") return { type: "null" };
    }

    // union primitives => anyOf
    if (types.length > 1) {
      return {
        anyOf: types.map(t => jsonSchemaFromInferred({ kind: "primitive", types: new Set([t]) }, opts))
      };
    }

    const t = types[0];
    if (t === "null") return { type: "null" };
    if (t === "string") return { type: "string" };
    if (t === "number") return { type: "number" };
    if (t === "boolean") return { type: "boolean" };
    return {};
  }

  if (node.kind === "array") {
    if (node.isEmpty) return { type: "array", items: {} };
    return { type: "array", items: jsonSchemaFromInferred(node.items, opts) };
  }

  if (node.kind === "object") {
    const properties = {};
    for (const [k, inferred] of node.properties.entries()) {
      properties[k] = jsonSchemaFromInferred(inferred, opts);
    }
    const required = Array.from(node.required);
    const schema = {
      type: "object",
      properties,
      additionalProperties: false
    };
    if (required.length) schema.required = required;
    return schema;
  }

  if (node.kind === "union") {
    return { anyOf: node.unionVariants.map(v => jsonSchemaFromInferred(v.inferred, opts)) };
  }

  return {};
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const inputPath = args.get("input");
  if (!inputPath) {
    console.error("Usage: node generate-structure.js --input <path> [--format typescript|json-schema] [--out <path>] [--root-name Name] [--items-only] ");
    process.exit(1);
  }

  const format = (args.get("format") || "typescript").toString();
  const outPath = args.get("out");
  const rootName = (args.get("root-name") || "Root").toString();

  const enumMaxValues = Number(args.get("enum-max") ?? 15);
  const arraySampleLimit = Number(args.get("array-sample-limit") ?? 2000);

  const opts = {
    enumMaxValues,
    arraySampleLimit
  };

  const json = readJson(path.resolve(process.cwd(), inputPath));

  // Default: if root is array => infer element object structure
  const itemsOnly = args.has("items-only") || Array.isArray(json);

  let inferred;
  if (Array.isArray(json)) {
    const arr = json;
    inferred = itemsOnly ? inferFromValues(arr.slice(0, arraySampleLimit), opts) : inferFromValues(json.slice(0, arraySampleLimit), opts);
  } else {
    inferred = inferFromValues([json], opts);
  }

  let output = "";

  if (format === "typescript") {
    if (Array.isArray(json) && !itemsOnly) {
      // root array type
      const itemType = tsTypeFromInferred(inferFromValues(json.slice(0, arraySampleLimit), opts), opts);
      output = `export type ${rootName} = ${itemType}[];\n`;
    } else {
      output = `export type ${rootName} = ${tsTypeFromInferred(inferred, opts)};\n`;
    }
  } else if (format === "json-schema") {
    const schema = jsonSchemaFromInferred(inferred, opts);
    output = JSON.stringify(schema, null, 2) + "\n";
  } else {
    console.error("Unknown --format. Use 'typescript' or 'json-schema'.");
    process.exit(1);
  }

  if (outPath) {
    const abs = path.resolve(process.cwd(), outPath);
    fs.writeFileSync(abs, output, "utf8");
    console.log(`Wrote: ${abs}`);
  } else {
    process.stdout.write(output);
  }
}

main();