/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions */
import Pivoter from 'pivoter';

import input from './data.json';

const subDataPoints = [
  { title: 'Quantity', value: x => x && x.quantity, formatter: x => x },
  { title: 'Amount', value: x => (x && (x.sum / x.count)) || 0, formatter: x => Number(x).toFixed(0) },
];

const dataPoints = [
  { title: 'Economy', value: x => x && x.Economy, subDataPoints },
  { title: 'Regular', value: x => x && x.Regular, subDataPoints },
  { title: 'Deluxe', value: x => x && x.Deluxe, subDataPoints },
  { title: 'Grand Total', value: x => x && x.total, subDataPoints },
];

const allGroups = [
  { name: 'Manufacturer', selector: x => x[2] },
  { name: 'Category', selector: x => x[4] },
  { name: 'Entity', selector: x => x[0] },
  { name: 'Product', selector: x => x[1] },

];

function reducer(data, row) {
  const type = row[3];
  const value = row[6];
  const quantity = row[5];

  const dataTotal = data.total || {};
  const dataType = data[type] || {};
  return {
    ...data,
    total: {
      count: (dataTotal.count || 0) + 1,
      sum: (dataTotal.sum || 0) + value,
      quantity: (dataTotal.quantity || 0) + quantity,
    },
    [type]: {
      count: (dataType.count || 0) + 1,
      sum: (dataType.sum || 0) + value,
      quantity: (dataType.quantity || 0) + quantity,
    },
  };
}

const pivoter = new Pivoter({ reducer, groups: [], dataPoints, input });

function range(start, end, step = 1) {
  const a = [];
  for (let i = start; i < end; i += step) a.push(i);
  return a;
}

function leaves(data, points) {
  return points.reduce((acc, point) => {
    const value = data[point.title];
    if (!point.subDataPoints) {
      const formatter = point.formatter || (x => x);
      return [...acc, value === undefined ? '' : formatter(value)];
    }
    return [...acc, ...leaves(value, point.subDataPoints)];
  }, []);
}

function titles(points, base = '') {
  return points.reduce((acc, v) => {
    if (!v.subDataPoints) {
      return [...acc, `${base}${v.title}`];
    }
    return [...acc, ...titles(v.subDataPoints, `${v.title}.`)];
  }, []);
}

let opens = [];
const keyOpen = key => opens.some(o => o === key);

let config = {};

pivoter.subscribe((data, configFromPivoter) => {
  config = configFromPivoter;
  const groupSorts = config.groupSorts;
  const sortBy = config.dataSortBy;
  const dir = config.dataSortDir;

  const headers = `
    <tr>
      ${config.groups.map((g, i) => `<th class="${groupSorts ? `sorted-${(groupSorts[i] || 'asc')}` : ''} group-header">${g.name}<span class="delete"></span></th>`).join('')}
      ${titles(config.dataPoints).map(t => `<th class="${sortBy === t ? `sorted-${dir}` : ''} data-header">${t}</th>`).join('')}
    </tr>
  `;

  const toKey = path => path.join('PATHSEPARATOR');

  const content = data.flattened.map((row) => {
    const parentKey = toKey(row.path.slice(0, -1));
    if (row.level !== 0 && !keyOpen(parentKey)) return '';

    const key = toKey(row.path);
    const open = keyOpen(key);
    const classFromOpen = open ? 'open' : 'closed';
    const openClass = row.subGroups ? classFromOpen : '';
    return `<tr class="group level-${row.level}">
      ${range(0, row.level).map(() => '<td></td>').join('')}
      <td class="group ${openClass}" data-path="${key}">${row.path.slice(-1)}</td>
      ${range(0, (config.groups.length - 1) - row.level).map(() => '<td></td>').join('')}
      ${leaves(row.data, dataPoints).map(l => `<td class="data">${l}</td>`).join('')}
    </tr>`;
  });

  const footer = `<tr>
    ${config.groups.length > 0 ? '<td>Grand Total</td>' : ''}
    ${range(0, config.groups.length - 1).map(() => '<td></td>').join('')}
    ${leaves(data.total.data, dataPoints).map(l => `<td class="footer-data">${l}</td>`).join('')}
  </tr>
  `;

  document.getElementById('pivot-table').innerHTML = `${headers}${content.join('')}${footer}`;

  const buttons = allGroups
    .filter(g => !config.groups.some(pg => pg.name === g.name))
    .map(g => `<button class="btn btn-primary">${g.name}</button>`);

  document.getElementById('buttons').innerHTML = `${buttons.join('')}`;
});


const otherDir = d => (d === 'asc' ? 'desc' : 'asc');

document.getElementById('pivot-table').addEventListener('click', (e) => {
  const target = e.target.closest('.data-header');
  if (target) {
    const dataSortBy = (target).innerText;
    const dir = otherDir(config.dataSortDir);
    const dataSortDir = dataSortBy === config.dataSortBy ? dir : 'asc';
    pivoter.update({ dataSortDir, dataSortBy });
  }
});

document.getElementById('pivot-table').addEventListener('click', (e) => {
  if (e.target.classList.contains('delete')) {
    const target = e.target.closest('.group-header');
    const groupName = target.innerText;
    pivoter.update({ groups: config.groups.filter(g => g.name !== groupName) });
  }
});

document.getElementById('pivot-table').addEventListener('click', (e) => {
  const target = e.target.closest('.group-header');
  if (target) {
    if (!config.groupSorts) {
      pivoter.update({ groupSorts: range(0, config.groups.length).map(() => 'asc') });
    } else {
      const index = [...target.parentNode.children].indexOf(target);
      const groupSorts = config.groups
        .map((v, i) => config.groupSorts[i] || 'asc')
        .map((v, i) => (i === index ? otherDir(v) : v));
      pivoter.update({ groupSorts });
    }
  }
});

const isOpen = t => t.classList.contains('open');
const isClosed = t => t.classList.contains('closed');

document.getElementById('pivot-table').addEventListener('click', (e) => {
  const target = e.target.closest('.group');
  if (target) {
    const open = isOpen(target);
    const closed = isClosed(target);
    if (!open && !closed) return;
    if (open) {
      opens = opens.filter(o => !o.startsWith(target.dataset.path));
    } else {
      opens.push(target.dataset.path);
    }
    pivoter.update();
  }
});

document.getElementById('buttons').addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (target) {
    const name = target.innerText;
    const group = allGroups.find(g => g.name === name);
    pivoter.update({ groups: config.groups.concat(group) });
  }
});
