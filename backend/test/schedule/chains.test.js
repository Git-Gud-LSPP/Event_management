const { buildChains } = require('../../schedule/schedule.controller');

test('buildChains follows dependsOn from the first troubled task', () => {
  const tasks = [
    { _id: 'a', name: 'AV check', status: 'In Progress', delayMinutes: 15 },
    { _id: 'b', name: 'Sound check', status: 'Blocked', dependsOn: 'a' },
    { _id: 'c', name: 'Rehearsal', status: 'Pending', dependsOn: 'b' },
    { _id: 'd', name: 'Done thing', status: 'Done', dependsOn: 'a' },
    { _id: 'x', name: 'Cycle1', status: 'Blocked', dependsOn: 'y' },
    { _id: 'y', name: 'Cycle2', status: 'Pending', dependsOn: 'x' },
  ];
  const chains = buildChains(tasks);
  const av = chains.find((c) => c.id === 'a');
  expect(av.chain.map((c) => c.id)).toEqual(['b', 'c']);
  expect(av.trigger.type).toBe('delay');
  expect(!chains.some((c) => c.id === 'b')).toBe(true); // b's upstream is troubled, so not a root
  expect(chains.find((c) => c.id === 'x').chain.map((c) => c.id)).toEqual(['y']);
});
