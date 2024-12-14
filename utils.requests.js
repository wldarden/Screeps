"use strict";
let listUtils = require('utils.list');

module.exports.add = function(arr, priority, data) {
    listUtils.add(arr, {
        priority: priority,
        data: data
    });
}
module.exports.pop = function(arr) {
    if (arr.length === 0)
        return null;

    let bestIndex = null;
    for (let i = 0; i < arr.length; i++) {
        let request = arr[i];
        if (bestIndex === null || request.priority > arr[bestIndex].priority)
            bestIndex = i;
    }

    let bestRequest = arr[bestIndex];
    listUtils.removeAt(arr, bestIndex);
    return bestRequest;
}
