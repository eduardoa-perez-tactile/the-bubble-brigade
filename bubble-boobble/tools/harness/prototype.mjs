export const deferredPrototypeChecks = [
  'full test suites', 'Hermes parity', 'render golden sweeps',
  'replay sweeps', 'all-tier pipeline recordings', 'cooks and cooked smoke',
  'oracle and fixture provenance sweeps',
];

export function prototypePlan(filter, workflow) {
  const selected = filter ?? workflow.prototype?.defaultFilter;
  if (typeof selected !== 'string' || !selected.trim()) throw new Error('Prototype checks require a nonempty test filter');
  return {
    filter: selected,
    args: ['test', '--tier', 't0', '--js', 'v8', '--filter', selected],
    deferred: deferredPrototypeChecks,
  };
}

export function usesPrototypeLane(command, mode) {
  if (!['prototype', 'strict'].includes(mode)) throw new Error(`Unknown harness workflow mode: ${mode}`);
  return command === 'prototype' || mode === 'prototype' && ['quick', 'verify'].includes(command);
}
