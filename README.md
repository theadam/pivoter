# Pivoter

The use-whatever-view-you-want javscript pivot table library

## Installation

```
npm install --save pivoter
```

## Usage

To Just create a pivot table of some data, you can use the simple `pivot` function.

```js
import { pivot } from 'pivoter';

const result = pivot(config);
```

To prevent reprocessing the data on every config change, a pivoter can be created.  A pivoter can be passed config changes in an updated method.  This is good for views that are user configurable.

```js
import Pivoter from 'pivoter';

// Create a pivoter from a base config
const pivoter = Pivoter(config);

// Subscribe to data changes
pivoter.subscribe(function(result, config) {
    ...
});

// Change the dataSortDir option (will cause the listener to be called)
pivoter.update({ dataSortDir: 'desc' );
```

## Process Outline

- Input data is grouped and reduced within groups.  The groups of data form a hierarchy of reduced data.  (See the example for a visual).  This is configured mainly by the `reducer` and `groups` config values.  There is more information in the "Config Options" section.
- Data points are created from the raw reduced data in each group. This is configured by the `dataPoints` configuration value.  If none is provided, the reduced value is used.
- Grouped data is flattened and sorted.  The sorting is handled by a few different keys.  They are outlined below in the "Config Options" section.

## Result

The result of pivoting the data is an object with these keys

### total

Contains:

##### reduced

All of the input reduced

##### data

The data points of all of the input

### flattened

The final flattened data as an array.  This can be used for the main content of a pivot table view.

Each entry in the array is an object that contains:

##### path

The path of this group in the hierarchy

##### level

The level of the group in in the hierarchy

##### data

The data points of this group of input

##### points

An array of all of the original input points that went into this group

## Config Options

### input

**Type**: `Array` (*required*)

The data to perform grouping operations on

### groups

**Type**: `Array` (*required*)

An ordered description of how data is grouped into a hierarchy.  Each group has a `name` and a `selector` function.

This set of groups will first group all data by `firstName`, then within those groups with the same first name, data will be grouped by `lastName`.

```js
const groups = {
  { name: 'First Name', selector: x => x.firstName },
  { name: 'Last Name', selector: x => x.lastName },
};
```

### reducer

**Type**: `Function(r: Reduced, i: InputRow) => Reduced` (*required*)

Takes in the previous Reduced value and a single row from the input and produces the new Reduced value.  This is how data gets combined within groups.

### initialValue

**Type**: `Reduced`

**Default**: `{}`

The default starting value when reducing groups of data.

### dataPoints

**Type**: `Array`

Describes how the reduced data is turned into output data.  Each dataPoint entry has a `title` key and may have a `value` key which is a function to select the dataPoint.  `dataPoints` can be nested by using the `subDataPoints` key.

If your data points are:

```js
const dataPoints = [
  { title: 'Monday', value: reduced => reduced.days.monday, subDataPoints: [
    { title: 'Sales', value: monday => monday.data.sales }
  }
]
```

And your reduced data for a group is something like this:

```js
{
  days: {
    ...
    monday: {
      ...
      data: {
        sales: 101,
      },
    },
  },
}
```

The output data for this group would be

```js
{ Monday: { Sales: 101 } }
```

### groupSorts

**Type**: `Array`

Cannot be used with `dataSortsWith` or `dataSortsBy`

This is an array describing how to to sort by the groups in th sorted data.  The elements of the array can be the strings `'asc'` or `'desc'` or a [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).

For the group sorts example above

```js
const groups = {
  { name: 'First Name', selector: x => x.firstName },
  { name: 'Last Name', selector: x => x.lastName },
};
```

`['asc', 'desc']` will sort the top level data points by `firstName` ascending and the subGroups by `lastName` descending.

### dataSortBy

**Type**: `String | Array<String> | Function(d: Data) => Value`

Cannot be used with `dataSortsWith` or `groupSorts`

Describes how to sort the data in each group.


| Type | Description | Example |
|------|-------------|---------|
| String  | it is a `.` delimited string describing a path in the data to find the value to sort on. | `'name.first'` |
| Array of strings | it is a path in the data to find the value to sort on. | `['name', 'first']`
| Function | it takes the data as its argument and returns the value to sort on. | `data => data.name.first` |


### dataSortDir

**Type**: `'asc' | 'desc'`

**default** `'asc'`

The direction to sort when using `dataSortBy`

### dataSortWith

**Type**: `Function(a: Data, b: Data) => (-1 | 0 | 1)`

Cannot be used with `dataSortBy` or `groupSorts`

A [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters) used to sort the data within the groups.

## License

MIT

