/* Project-wide published revision and scoped completion indicator.
   Safe to reuse on static GitHub Pages sites; no credentials or external services. */
(function () {
  'use strict';
  const tag = document.currentScript;
  if (!tag || !tag.src || document.getElementById('project-progress-status')) return;
  const root = new URL('./', tag.src);
  const getText = async name => {
    if (!/^[a-zA-Z0-9_./-]+$/.test(name) || name.includes('..')) throw new Error('Invalid progress source');
    const response = await fetch(new URL(name, root), {cache: 'no-store'});
    if (!response.ok) throw new Error('Progress source unavailable');
    return response.text();
  };
  const field = (value, path) => path.split('.').reduce(
    (obj, key) => obj != null ? obj[key] : undefined, value);
  async function revisionFor(config) {
    const src = config.revisionSource;
    if (!src) return String(config.revision || 'Not recorded');
    try {
      const contents = await getText(src.file);
      let value;
      if (src.type === 'json') value = field(JSON.parse(contents), src.path);
      if (src.type === 'text') {
        const result = contents.match(new RegExp(src.pattern, src.flags || 'm'));
        value = result && result[1];
      }
      if (value == null || value === '') throw new Error('Missing revision');
      return String(src.prefix || '') + String(value) + String(src.suffix || '');
    } catch (_) {
      return String(config.revision || 'Not recorded') + ' (last recorded)';
    }
  }
  async function countFor(config) {
    const p = config.progress || {};
    let done = p.completed;
    let total = p.total;
    if (p.source) {
      try {
        const source = JSON.parse(await getText(p.source.file));
        const data = field(source, p.source.path);
        if (p.source.kind === 'array-length') done = data.length;
        if (p.source.kind === 'sum-fields') done = p.source.fields.reduce(
          (n, k) => n + Number(data[k]), 0);
        if (p.source.kind === 'value') done = Number(data);
        if (p.source.totalPath) total = Number(field(source, p.source.totalPath));
        else if (p.source.totalField) total = Number(data[p.source.totalField]);
      } catch (_) {
        // Retain the last independently verified counts in the small manifest.
      }
    }
    const valid = Number.isInteger(done) && Number.isInteger(total) &&
      total > 0 && done >= 0 && done <= total;
    return {done, total, percent: valid ? Math.round(100 * done / total) : null};
  }
  // Roadmap completion is earned only by individually accepted, evidenced gates.
  // A partial gate contributes zero until its explicit acceptance criteria are met.
  function roadmapFor(config) {
    const data = config.roadmap;
    if (!data || !Array.isArray(data.gates) || !data.gates.length) return null;
    const ids = new Set();
    let total = 0, done = 0;
    for (const gate of data.gates) {
      if (!gate || typeof gate.id !== 'string' || !/^[a-z0-9-]{2,64}$/.test(gate.id) ||
          ids.has(gate.id) || typeof gate.label !== 'string' ||
          !gate.label.trim() || !Number.isInteger(gate.weight) || gate.weight < 1 ||
          !['accepted','partial','planned'].includes(gate.status) ||
          typeof gate.evidence !== 'string' || !gate.evidence.trim() ||
          typeof gate.acceptance !== 'string' || !gate.acceptance.trim()) return null;
      ids.add(gate.id);
      total += gate.weight;
      if (gate.status === 'accepted') done += gate.weight;
    }
    // A fixed approved delivery roadmap is 100 points. An invalid or unfinished
    // accounting definition must never appear as a valid percentage.
    if (total !== 100) return null;
    return {data, done, total, percent: done, gates: data.gates};
  }
  // Maintain backward-compatible queue counts when module loading is absent.
  // The optional engineering metric is withheld if its estimator is unavailable.
  function executionFor(config, markdown, roadmap) {
    const e = config.execution;
    if (!e || !roadmap || typeof markdown !== 'string' ||
        !Number.isSafeInteger(e.total) || e.total < 1 || e.total > 999 ||
        typeof e.source !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(e.source) ||
        e.source.includes('..')) return null;
    const lines = markdown.split(/\r?\n/).filter(line => /^\| DHR-\d{3} \|/.test(line));
    if (lines.length !== e.total) return null;
    const perGate = roadmap.gates.map(() => ({done: 0, ready: 0, blocked: 0, total: 0}));
    const counts = {done: 0, ready: 0, blocked: 0, total: e.total};
    const seen = new Set();
    const tasks = Object.create(null);
    for (const line of lines) {
      const cells = line.split('|').slice(1, -1).map(x => x.trim());
      if (cells.length !== 6) return null;
      const id = /^DHR-(\d{3})$/.exec(cells[0]);
      if (!id || seen.has(id[1]) || Number(id[1]) < 1 || Number(id[1]) > e.total)
        return null;
      seen.add(id[1]);
      const status = cells[1] === '**Done**' ? 'done' :
        cells[1] === '**Ready**' ? 'ready' : cells[1] === 'Blocked' ? 'blocked' : null;
      if (!status || !cells[4] ||
          (status === 'done' && !/^\[#\d+\]\(https:\/\/github\.com\//.test(cells[5])))
        return null;
      const refs = cells[2].split(',').map(x => x.trim());
      const parsed = refs.map(x => Number(x));
      if (!refs.length || parsed.some((n, i) => !/^\d{1,2}$/.test(refs[i]) ||
          n < 1 || n > perGate.length) || new Set(parsed).size !== parsed.length)
        return null;
      counts[status]++;
      tasks[id[0]] = {status, gates:parsed};
      for (const n of parsed) {
        const bucket = perGate[n - 1];
        bucket[status]++; bucket.total++;
      }
    }
    if (seen.size !== e.total || counts.done + counts.ready + counts.blocked !== e.total)
      return null;
    return {counts, perGate, tasks, percent: Math.round(1000 * counts.done / e.total) / 10};
  }
  async function developmentFor(config, markdown, roadmap) {
    const execution = executionFor(config, markdown, roadmap);
    try {
      const helpers = await import(new URL('src/implementation-progress.mjs', root).href);
      return {execution, implementation: helpers.implementationFor(config, execution, roadmap)};
    } catch (_) { return {execution, implementation:null}; }
  }
  function make(tagName, className, value) {
    const e = document.createElement(tagName);
    if (className) e.className = className;
    if (value != null) e.textContent = String(value);
    return e;
  }
  async function mount() {
    if (document.getElementById('project-progress-status')) return;
    let config;
    try { config = JSON.parse(await getText('site-progress.json')); }
    catch (_) { return; }
    if (!config || config.schemaVersion !== 1) return;
    const roadmap = roadmapFor(config);
    const [revision, count, queueText] = await Promise.all([
      revisionFor(config), countFor(config),
      config.execution?.source ? getText(config.execution.source).catch(() => null) : Promise.resolve(null)
    ]);
    const {execution, implementation} = await developmentFor(config, queueText, roadmap);
    const style = document.createElement('style');
    style.textContent = `
#project-progress-status{position:fixed;bottom:12px;right:12px;z-index:2147483000;
  max-width:min(350px,calc(100vw - 24px));font:12px/1.4 system-ui,-apple-system,
  "Segoe UI",sans-serif;color:#f1f4f4;text-align:left;isolation:isolate}
#project-progress-status details{background:rgba(18,26,29,.96);border:1px solid #5c6b70;
  border-radius:11px;box-shadow:0 6px 22px #0005;overflow:hidden;backdrop-filter:blur(8px)}
#project-progress-status summary{display:flex;gap:10px;align-items:center;
  list-style:none;cursor:pointer;padding:8px 10px;white-space:normal;flex-wrap:wrap;font-weight:650}
#project-progress-status summary::-webkit-details-marker{display:none}
#project-progress-status summary:focus-visible{outline:2px solid #d9c080;outline-offset:-2px}
#project-progress-status .p-revision{opacity:.85;font-variant-numeric:tabular-nums}
#project-progress-status .p-pct{border-left:1px solid #637074;padding-left:10px;
  color:#c9d4d5;font-variant-numeric:tabular-nums}
#project-progress-status .p-built{border-left:1px solid #637074;padding-left:10px;
  color:#e5ce8d;font-variant-numeric:tabular-nums}
#project-progress-status .p-work{border-left:1px solid #637074;padding-left:10px;
  color:#bcded8;font-variant-numeric:tabular-nums}
#project-progress-status .p-task-summary{font-size:11px;color:#bed1d4;margin:5px 0 7px}
#project-progress-status .p-task-note{font-size:11px;line-height:1.5}
#project-progress-status .p-more{opacity:.7;margin-left:auto;font-size:10px}
#project-progress-status details[open] .p-more{transform:rotate(180deg)}
#project-progress-status .p-detail{padding:2px 12px 12px;border-top:1px solid #526168}
#project-progress-status .p-title{margin:9px 0 4px;font-weight:700}
#project-progress-status .p-detail p{margin:4px 0;color:#c4d0d0}
#project-progress-status progress{width:100%;height:7px;accent-color:#d8bf7f}
#project-progress-status .p-secondary{margin-top:12px;border-top:1px solid #526168;padding-top:8px}
#project-progress-status .p-gates{max-height:184px;overflow-y:auto;margin:8px 0 0;padding:0;list-style:none}
#project-progress-status .p-gates li{display:block;border-bottom:1px dotted #526168;color:#dce4e4}
#project-progress-status .p-gates details{background:none;border:0;border-radius:0;box-shadow:none;backdrop-filter:none}
#project-progress-status .p-gates summary{display:flex;justify-content:space-between;align-items:start;
  gap:8px;padding:5px 0;font-size:12px;font-weight:500;list-style:none;cursor:pointer}
#project-progress-status .p-gates summary:focus-visible{outline:2px solid #d9c080;outline-offset:-2px}
#project-progress-status .p-gates .p-criteria{padding:1px 0 9px;margin:0;color:#c4d0d0;line-height:1.5}
#project-progress-status .p-gates summary span:first-child{min-width:0;flex:1}
#project-progress-status .p-gates span:last-child{white-space:nowrap;opacity:.8;font-variant-numeric:tabular-nums}
#project-progress-status .p-gates .p-accepted span:last-child{color:#b4e1c1}
#project-progress-status .p-detail a{color:#e5ce8d}
#project-progress-status .p-detail a:focus-visible{outline:2px solid #d9c080}
@media print{#project-progress-status{display:none!important}}
`;
    document.head.appendChild(style);
    const frame = make('aside');
    frame.id = 'project-progress-status';
    frame.setAttribute('aria-label', 'Project revision and roadmap completion');
    const details = make('details');
    const summary = make('summary');
    summary.setAttribute('aria-label', 'Show overall project completion estimate, revision, and progress basis');
    summary.append(make('span', 'p-revision', 'Rev ' + revision));
    // One user-facing completion number: estimated total implementation.
    // Formal accepted gate weight remains independently auditable below.
    if (config.implementation) {
      summary.append(make('span', 'p-built', implementation ?
        'Overall ~' + implementation.percent + '%' : 'Overall —'));
    } else {
      summary.append(make('span', 'p-pct', roadmap ?
        'Roadmap ' + roadmap.percent + '%' :
        (config.roadmap ? 'Roadmap —' :
         (count.percent === null ? 'Progress —' : String(count.percent) + '%'))));
    }
    if (config.execution) summary.append(make('span', 'p-work', execution ?
      'Work ' + execution.counts.done + '/' + execution.counts.total : 'Work —'));
    summary.append(make('span', 'p-more', '▾'));
    details.append(summary);
    const body = make('div', 'p-detail');
    if (config.implementation) {
      const built = make('section');
      built.append(make('div', 'p-title', 'Overall project completion · engineering estimate'));
      if (implementation) {
        const bar = make('progress');
        bar.value = implementation.points; bar.max = 100;
        bar.setAttribute('aria-label', 'Estimated implemented work across the full roadmap');
        built.append(bar);
        built.append(make('p', '', '~' + implementation.points +
          ' of 100 roadmap-weighted points represented by merged work'));
        built.append(make('p', 'p-task-note',
          'Estimated from completed queue assignments plus audited partial work already merged to main. Each incomplete gate is normalized by its linked tasks and capped below full completion. Unmerged PRs, deployment checks and unverified gameplay earn no credit.'));
        if (implementation.partialAssignments.length) {
          const label = implementation.partialAssignments.map(x=>
            x.taskId + ' (' + Math.round(x.fraction*100) + '% of its assignment)').join(' · ');
          built.append(make('p', 'p-task-note', 'Audited merged foundations: ' + label));
        }
        const pending = make('a', '', 'See pending pull requests (not counted)');
        pending.href = 'https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/pulls';
        pending.target = '_blank'; pending.rel = 'noopener noreferrer';
        built.append(pending);
      } else built.append(make('p', '',
        'Implementation estimate withheld: work queue or evidence could not be verified.'));
      body.append(built);
    }
    if (roadmap) {
      body.append(make('div', 'p-title', 'Formal milestone acceptance · technical detail'));
      if (roadmap.data.label) body.append(make('p', 'p-task-note', String(roadmap.data.label)));
      const bar = make('progress');
      bar.value = roadmap.done; bar.max = roadmap.total;
      bar.setAttribute('aria-label', 'Accepted overall roadmap weight');
      body.append(bar);
      body.append(make('p', '', roadmap.done + ' of 100 weighted delivery points accepted'));
      if (roadmap.data.scope) body.append(make('p', '', roadmap.data.scope));
      const gates = make('ul', 'p-gates');
      gates.setAttribute('aria-label', 'Roadmap gates and acceptance status');
      for (const [index, gate] of roadmap.gates.entries()) {
        const item = make('li', 'p-' + gate.status);
        const gateDetail = make('details');
        const gateSummary = make('summary');
        gateSummary.setAttribute('aria-label', gate.label + ': view acceptance requirements');
        gateSummary.append(make('span', '', gate.label));
        const sub = execution?.perGate[index];
        const builtGate = implementation?.perGate[index];
        gateSummary.append(make('span', '', gate.status + ' · ' + gate.weight + 'pt' +
          (sub?.total ? ' · ' + sub.done + '/' + sub.total + ' tasks' : '') +
          (builtGate ? ' · ~' + builtGate.percent + '% built' : '')));
        gateDetail.append(gateSummary);
        gateDetail.append(make('p', 'p-criteria', gate.acceptance));
        if (sub?.total) {
          const taskBar = make('progress');
          taskBar.value = sub.done; taskBar.max = sub.total;
          taskBar.setAttribute('aria-label', gate.label + ' linked development tasks completed');
          gateDetail.append(taskBar);
          gateDetail.append(make('p', 'p-task-summary', sub.done + ' completed · ' +
            sub.ready + ' ready · ' + sub.blocked + ' blocked (' +
            Math.round(100 * sub.done / sub.total) + '% of linked tasks)'));
        }
        item.append(gateDetail);
        gates.append(item);
      }
      body.append(gates);
      if (roadmap.data.note) body.append(make('p', '', roadmap.data.note));
      if (roadmap.data.document && /^[a-zA-Z0-9_./-]+$/.test(roadmap.data.document) &&
          !roadmap.data.document.includes('..')) {
        const link = make('a', '', 'Read roadmap and acceptance evidence');
        link.href = 'https://github.com/Diabolicdonut/Dinosaur-Horror-RPG/blob/main/' +
          roadmap.data.document;
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        body.append(link);
      }
    } else if (config.roadmap) {
      body.append(make('p', '', 'Roadmap accounting is invalid; overall percentage withheld.'));
    }
    if (config.execution) {
      const work = make('section', 'p-secondary');
      work.append(make('div', 'p-title', 'Development assignments (not accepted milestones)'));
      if (execution) {
        const b = make('progress');
        b.value = execution.counts.done; b.max = execution.counts.total;
        b.setAttribute('aria-label', 'Completed developer assignments');
        work.append(b);
        work.append(make('p', '', execution.counts.done + ' of ' +
          execution.counts.total + ' assignments complete (' + execution.percent + '%)'));
        work.append(make('p', '', execution.counts.ready + ' ready · ' +
          execution.counts.blocked + ' dependency-blocked'));
        work.append(make('p', 'p-task-note',
          'Each roadmap gate shows completed linked tasks when expanded. A task can support multiple gates; task counts are not weighted points and do not award partial acceptance. The new built estimate uses audited merged-main evidence; review PRs do not count.'));
        const link = make('a', '', 'View development assignments');
        link.href = new URL(config.execution.source, root).href;
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        work.append(link);
      } else work.append(make('p', '',
        'Assignment status unavailable or invalid; accepted roadmap score is unchanged.'));
      body.append(work);
    }
    const phase = make('div', roadmap ? 'p-secondary' : '');
    phase.append(make('div', 'p-title', String(config.progress?.label || 'Tracked milestone')));
    if (count.percent !== null) {
      const bar = make('progress');
      bar.value = count.done; bar.max = count.total;
      bar.setAttribute('aria-label', String(config.progress?.label || 'Progress'));
      phase.append(bar);
      phase.append(make('p', '', count.done + ' of ' + count.total + ' tracked units complete'));
    } else phase.append(make('p', '', 'No defensible completion denominator is recorded.'));
    if (config.progress?.basis) phase.append(make('p', '', config.progress.basis));
    if (config.progress?.note) phase.append(make('p', '', config.progress.note));
    body.append(phase);
    if (config.asOf) body.append(make('p', '', 'Progress reviewed: ' + config.asOf));
    details.append(body); frame.append(details);
    document.body.appendChild(frame);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
