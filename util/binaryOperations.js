module.exports = function() {

  this.getClosestIndex = function(arr, toInsert, compare) {

    if (arr.length === 0) return 0;

    var lo = 0;
    var hi = arr.length - 1;
    var mid = Math.floor(hi / 2);

    while (lo <= hi) {
      var compareResult = compare(arr[mid], toInsert);
      console.log('\t\tComparing ' + [lo, hi, mid, compareResult].join(' '));
      if (compareResult === 0) break;
      if (compareResult === -1) {
        lo = mid + 1;
        mid = Math.floor((lo + hi) / 2);
      }
      if (compareResult === 1) {
        hi = mid - 1;
        mid = Math.floor((lo + hi) / 2);
      }
    }

    console.log('\t\tdone comparing. mid: ' + mid);
    return mid;
  };

  this.insert = function(arr, toInsert, compare) {
    if (arr.length === 0) return [toInsert];
    var index = this.getClosestIndex(arr, toInsert, compare);

    if (index < 0) {
      arr.unshift(toInsert);
    } else if (index === arr.length - 1) {
      arr.push(toInsert);
    } else {
      var finalCompare = this.finalCompare(arr, index, toInsert, compare);
      if (finalCompare === 0) arr.splice(index, 0, toInsert);
      if (finalCompare === -1) arr.splice(index + 1, 0, toInsert);
      if (finalCompare === 1) arr.splice(index - 1, 0, toInsert);
    }

    return arr;
  };

  this.finalCompare = function(arr, index, toCompare, compare) {
    
    console.log('final comparing ', arr, index, toCompare)
    if (index < 0) {
      return compare(arr[0], toCompare);
    } else if (index > arr.length - 1) {
      return compare(arr[arr.length - 1], toCompare);
    } else {
      return compare(arr[index], toCompare);
    }
  };

  this.indexOf = function(arr, searchFor, compare) {
    if (arr.length === 0) return undefined;
    var index = this.getClosestIndex(arr, searchFor, compare);
    if (this.finalCompare(arr, index, searchFor, compare) !== 0) return undefined;
    return index;
  };

  this.exists = function(arr, searchFor, compare) {
    if (arr.length === 0) return false;
    var index = this.getClosestIndex(arr, searchFor, compare);
    return (this.finalCompare(arr, index, searchFor, compare) === 0);
  };

  this.find = function(arr, searchFor, compare) {
    if (arr.length === 0) return undefined;
    var index = this.getClosestIndex(arr, searchFor, compare);
    if (this.finalCompare(arr, index, searchFor, compare) !== 0) return undefined;
    return arr[index];
  };

};