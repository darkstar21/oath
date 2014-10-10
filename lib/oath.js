
// Since objects only compare === to the same object (i.e. the same reference)
// we can do something like this instead of using integer enums because we can't
// ever accidentally compare these to other values and get a false-positive.
//
// For instance, `rejected === resolved` will be false, even though they are
// both {}.
var rejected = {}, resolved = {}, waiting = {};

// This is a promise. It's a value with an associated temporal
// status. The value might exist or might not, depending on
// the status.
var Promise = function (value, status) {
	this.value = value;
	this.toDo = [];
	this.rejects = [];
	if(status){
		this.status = status;
	} else{
		this.status = waiting;
	}
};

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.
Promise.prototype.then = function (success, _failure) {
	if(this.status === waiting){
		this.toDo.push(success);
		this.toDo.push(_failure);
	} else if(this.status === resolved){
		this.status = waiting;
		success(this.value);
		this.status = resolved;
	}
};


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
	if(this.status === waiting){
		this.rejects.push(failure);
	} else if(this.status === rejected){
		failure(this.value);
	}
};



// This is the object returned by defer() that manages a promise.
// It provides an interface for resolving and rejecting promises
// and also provides a way to extract the promise it contains.
var Deferred = function (promise) {
	if(promise){
		this.promise = promise;
	} else{
		this.promise = new Promise();
	}
};

// Resolve the contained promise with data.
//
// This will be called by the creator of the promise when the data
// associated with the promise is ready.
Deferred.prototype.resolve = function (data) {
	this.promise.value = data;
	this.promise.status = resolved;
	this.promise.then(this.promise.toDo.shift(), this.promise.toDo.shift());
};

// Reject the contained promise with an error.
//
// This will be called by the creator of the promise when there is
// an error in getting the data associated with the promise.
Deferred.prototype.reject = function (error) {
	this.promise.value = error;
	this.promise.status = rejected;
	this.promise.catch(this.promise.rejects.shift());
};

// The external interface for creating promises
// and resolving them. This returns a Deferred
// object with an empty promise.
var defer = function () {
	return new Deferred(new Promise());
};


module.exports.defer = defer;

