// binary operations for ordered arrays.
// !-- NOTE: would probably be better to use a tree instead of an array.
// !-- using closest index feels somewhat not okay

module.exports = function() {

  // function used to get the closest index
  // to a given outside item. Expectsan ordered array,
  // an item to find the closest index of in the array,
  // and a compare function used to compare items & determine order.
  // returns the index closest to where the item would be inserted
  // or the index of the item if it's in the array. If two identical items
  // exist in the list, this function returns the closest to the middle.
  this.getClosestIndex = function(arr, toCompare, compare) {

    if (arr.length === 0) return 0;

    // set upper and lower bounds
    var lo = 0;
    var hi = arr.length - 1;

    // set start point for serach
    var mid = Math.floor(hi / 2);

    // while cursors not crossed
    while (lo <= hi) {

      // compare item at mid to 'toCompare'
      var compareResult = compare(arr[mid], toCompare);

      // if match, break loop
      if (compareResult === 0) break;

      // if 'toCompare' larger, set lo to mid+1 and
      // recalculate new mid.
      if (compareResult === -1) {
        lo = mid + 1;
        mid = Math.floor((lo + hi) / 2);
      }

      // if 'toCompare' smaller, set hi to mid-1 and
      // recalculate new mid.
      if (compareResult === 1) {
        hi = mid - 1;
        mid = Math.floor((lo + hi) / 2);
      }

    }

    return mid;
  };


  // function used to insert an item into an ordered array
  // expects an ordered array to insert into, an item to insert,
  // and a compare function to determine order.
  // Gets index of item closest to 'toInsert', then compares the item
  // to 'toInsert' and inserts to left or right accordingly.
  this.insert = function(arr, toInsert, compare) {
    
    if (arr.length === 0) return [toInsert];

    // get index of closest item
    var index = this.getClosestIndex(arr, toInsert, compare);

    // should maybe be === 0.
    // if index is zero, insert at front
    if (index < 0) {
      arr.unshift(toInsert);

    // if index is last item, push to end
    } else if (index === arr.length - 1) {
      arr.push(toInsert);

    // otherwise, compare with item found
    } else {

      var finalCompare = this.finalCompare(arr, index, toInsert, compare);

      // if item is the same, insert to right
      if (finalCompare === 0) arr.splice(index, 0, toInsert);

      // if item is smaller, insert to right
      if (finalCompare === -1) arr.splice(index + 1, 0, toInsert);

      // if item is larger, insert to left
      if (finalCompare === 1) arr.splice(index - 1, 0, toInsert);

    }

    return arr;
  };

  // helper function used to compare an item in the array at index 'index'
  // to 'toCompare' using 'compare' function.
  this.finalCompare = function(arr, index, toCompare, compare) {
    
    // if index is past lower bound, compare to first item
    if (index < 0) {
      return compare(arr[0], toCompare);

    // if index is past upper bound, compare to last item
    } else if (index > arr.length - 1) {
      return compare(arr[arr.length - 1], toCompare);

    // otherwise compare to item at 'index'
    } else {
      return compare(arr[index], toCompare);
    }

  };


  // function used to find the index of an item 'searchFor' in orderd array 'arr'.
  // Gets closest index of item, final compares with closest item
  // returns index if item at closest index is equal to 'searchFor' or -1 if not
  this.indexOf = function(arr, searchFor, compare) {
    if (arr.length === 0) return -1;
    var index = this.getClosestIndex(arr, searchFor, compare);
    return (this.finalCompare(arr, index, searchFor, compare) !== 0) ? -1 : index;
  };

  // helper function used to determine if an item exists in an array.
  // returns true if item at closest index to 'searchFor' is the same, false if not.
  this.exists = function(arr, searchFor, compare) {
    if (arr.length === 0) return false;
    var index = this.getClosestIndex(arr, searchFor, compare);
    return (this.finalCompare(arr, index, searchFor, compare) === 0);
  };

  // helper function used to find the 'searchFor' item in the array.
  // returns undefined if not found, or the item if found.
  // !-- NOTE: doesn't really seem necessary. you have the item already if you call this.
  this.find = function(arr, searchFor, compare) {
    if (arr.length === 0) return undefined;
    var index = this.getClosestIndex(arr, searchFor, compare);
    if (this.finalCompare(arr, index, searchFor, compare) !== 0) return undefined;
    return arr[index];
  };

};


// *** TEST CASES *** //

// var b = new binary();
// var t = [1, 1, 3, 5, 7, 9, 9, 12];
// var comp = function(i, j) {
//   if (i === j) return 0;
//   if (i > j) return 1;
//   if (i < j) return -1;
// };

// console.log('binary exists');
// console.log(b.exists(t, 1, comp), 'true');
// console.log(b.exists(t, 12, comp), 'true');
// console.log(b.exists(t, 9, comp), 'true');
// console.log(b.exists(t, 3, comp), 'true');
// console.log(b.exists(t, 5, comp), 'true');
// console.log(b.exists(t, 13, comp), 'false');
// console.log(b.exists(t, 0, comp), 'false');
// console.log(b.exists(t, -1, comp), 'false');
// console.log(b.exists(t, 6, comp), 'false');
// console.log(b.exists(t, 9.5, comp), 'false');
// console.log(b.exists(t, 2, comp), 'false');

// console.log('binary find');
// console.log(b.find(t, 1, comp), '1');
// console.log(b.find(t, 12, comp), '12');
// console.log(b.find(t, 9, comp), '9');
// console.log(b.find(t, 3, comp), '3');
// console.log(b.find(t, 5, comp), '5');
// console.log(b.find(t, 13, comp), 'undefined');
// console.log(b.find(t, 0, comp), 'undefined');
// console.log(b.find(t, -1, comp), 'undefined');
// console.log(b.find(t, 6, comp), 'undefined');
// console.log(b.find(t, 9.5, comp), 'undefined');
// console.log(b.find(t, 2, comp), 'undefined');

// console.log('binary indexOf');
// console.log(b.indexOf(t, 1, comp), '1');
// console.log(b.indexOf(t, 12, comp), '7');
// console.log(b.indexOf(t, 9, comp), '5');
// console.log(b.indexOf(t, 3, comp), '2');
// console.log(b.indexOf(t, 5, comp), '3');
// console.log(b.indexOf(t, 13, comp), '-1');
// console.log(b.indexOf(t, 0, comp), '-1');
// console.log(b.indexOf(t, -1, comp), '-1');
// console.log(b.indexOf(t, 6, comp), '-1');
// console.log(b.indexOf(t, 9.5, comp), '-1');
// console.log(b.indexOf(t, 2, comp), '-1');

// console.log('binary insert');
// console.log(b.insert(t.slice(0), 1, comp), [1, 1, 1, 3, 5, 7, 9, 9, 12]);
// console.log(b.insert(t.slice(0), 12, comp), [1, 1, 3, 5, 7, 9, 9, 12, 12]);
// console.log(b.insert(t.slice(0), 9, comp), [1, 1, 3, 5, 7, 9, 9, 9, 12]);
// console.log(b.insert(t.slice(0), 3, comp), [1, 1, 3, 3, 5, 7, 9, 9, 12]);
// console.log(b.insert(t.slice(0), 5, comp), [1, 1, 3, 5, 5, 7, 9, 9, 12]);
// console.log(b.insert(t.slice(0), 13, comp), [1, 1, 3, 5, 7, 9, 9, 12, 13]);
// console.log(b.insert(t.slice(0), 0, comp), [0, 1, 1, 3, 5, 7, 9, 9, 12]);
// console.log(b.insert(t.slice(0), -1, comp), [-1, 1, 1, 3, 5, 7, 9, 9, 12]);
// console.log(b.insert(t.slice(0), 6, comp), [1, 1, 3, 5, 6, 7, 9, 9, 12]);
// console.log(b.insert(t.slice(0), 9.5, comp), [1, 1, 3, 5, 7, 9, 9, 9.5, 12]);
// console.log(b.insert(t.slice(0), 2, comp), [1, 1, 2, 3, 5, 7, 9, 9, 12]);

// var c = t.slice(0);
// b.insert(c, 1, comp);
// b.insert(c, 12, comp);
// b.insert(c, 9, comp);
// b.insert(c, 3, comp);
// b.insert(c, 5, comp);
// b.insert(c, 13, comp);
// b.insert(c, 0, comp);
// b.insert(c, -1, comp);
// b.insert(c, 6, comp);
// b.insert(c, 9.5, comp);
// b.insert(c, 2, comp);
// console.log(c, [-1, 0, 1, 1, 1, 2, 3, 3, 5, 5, 6, 7, 9, 9, 9, 9.5, 12, 12, 13]);

