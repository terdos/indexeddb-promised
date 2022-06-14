module.exports = function(dbName) {
    var version;
    var doUpgrade;
    var objectStores;

    var debug = false;

    this.setDebug = function() {
        debug = true;
        return this;
    };

    this.setVersion = function(pVersion) {
        version = pVersion;
        return this;
    };

    this.setDoUpgrade = function(pDoUpgrade) {
        doUpgrade = pDoUpgrade;
        return this;
    };

    this.addObjectStore = function(store) {
        if(!objectStores) {
            objectStores = [];
        }

        objectStores.push(store);
        return this;
    };

    this.build = function() {
        if(!doUpgrade) {
            doUpgrade = function(db) {
                objectStores.forEach(function(objStore) {
                    var objectStore = db.createObjectStore(
                        objStore.name,
                        objStore.keyType
                    );

                    if(objStore.indexes) {
                        objStore.indexes.forEach(function(index) {
                            objectStore.createIndex(
                                index.name,
                                index.keyPath,
                                index.options
                            );
                        });
                    }
                });
            };
        }

        var indexeddb = new Indexeddb(dbName, version, doUpgrade);

        if(objectStores) {
            objectStores.forEach(function(store) {
                var objectStore = new ObjectStore(indexeddb.getDb(), store.name);
                indexeddb[store.name] = objectStore;

                if(store.indexes) {
                    store.indexes.forEach(function(index) {
                        indexeddb[store.name + 'By' + capitalize(index.name)] =
                            new Index(indexeddb.getDb(), store.name, index.name);
                    });
                }
            });
        }

        if(debug) {
            var global = Function('return this')();
            global['indexeddbPromised_'+dbName] = indexeddb;
        }

        return indexeddb;
    };

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return this;
};

var ObjectStore = function(db, storeName) {
    this.db = db;
    this.storeName = storeName;

    return this;
}

ObjectStore.prototype.getStoreOrIndex = function(objectStore) {
    return objectStore;
};

ObjectStore.prototype.add = function(record, key) {
    var self = this;
    var resultAdd;
    var operationError;

    return new Promise(function(resolve, reject) {
        self.db.then(function(db) {
            return db.transaction(self.storeName, "readwrite");
        })
        .then(function(transaction) {
            transaction.oncomplete = function(event) {
                resolve(resultAdd);
            };

            transaction.onerror = function(event) {
                reject(
                    new Error(operationError || event.target.errorCode || null)
                );
            };

            var objectStore = transaction.objectStore(self.storeName);
            var storeOrIndex = self.getStoreOrIndex(objectStore);
            var request = storeOrIndex.add(record, key);

            request.onsuccess = function(event) {
                resultAdd = event.target.result;
            };
            request.onerror = function(event) {
                operationError = event.target.errorCode;
            };
        });
    });
};

ObjectStore.prototype.count = function() {
    var self = this;
    var count;
    var operationError;

    return new Promise(function(resolve, reject) {
        self.db.then(function(db) {
            return db.transaction(self.storeName);
        })
        .then(function(transaction) {
            transaction.oncomplete = function(event) {
                resolve(count);
            };

            transaction.onerror = function(event) {
                reject(new Error(
                    operationError || event.target.errorCode || null
                ));
            };

            var objectStore = transaction.objectStore(self.storeName);
            var storeOrIndex = self.getStoreOrIndex(objectStore);
            var request = storeOrIndex.count();

            request.onerror = function(event) {
                operationError = event.target.errorCode;
            };

            request.onsuccess = function(event) {
                count = event.target.result;
            };
        });
    });
}

ObjectStore.prototype.get = function(key) {
    var self = this;
    var getResult;
    var operationError;

    return this.db.then(function(db) {
        return db.transaction(self.storeName);
    })
    .then(function(transaction) {
        return new Promise(function(resolve, reject) {
            transaction.oncomplete = function(event) {
                resolve(getResult);
            };

            transaction.onerror = function(event) {
                reject(new Error(operationError
                    || event.target.errorCode
                    || null));
            };

            var objectStore = transaction.objectStore(self.storeName);
            var storeOrIndex = self.getStoreOrIndex(objectStore);
            var request = storeOrIndex.get(key);

            request.onerror = function(event) {
                operationError = event.target.errorCode;
            };
            request.onsuccess = function(event) {
                getResult = event.target.result;
            };
        });
    });
};

ObjectStore.prototype.delete = function(key) {
    var self = this;
    var operationError;

    return new Promise(function(resolve, reject) {
        self.db.then(function(db) {
            return db.transaction(self.storeName, 'readwrite');
        })
        .then(function(transaction) {
            transaction.oncomplete = function(event) {
                resolve(null);
            };

            transaction.onerror = function(event) {
                reject(
                    new Error(operationError || event.target.errorCode || null)
                );
            };

            var objectStore = transaction.objectStore(self.storeName);
            var storeOrIndex = self.getStoreOrIndex(objectStore);
            var request = storeOrIndex.delete(key);

            request.onerror = function(event) {
                operationError = event.target.errorCode;
            };
        });
    });
};

ObjectStore.prototype.clear = function() {
    var self = this;
    var operationError;

    return new Promise(function(resolve, reject) {
        self.db.then(function(db) {
            return db.transaction(self.storeName, 'readwrite');
        })
        .then(function(transaction) {
            transaction.oncomplete = function(event) {
                resolve(null);
            };

            transaction.onerror = function(event) {
                reject(
                    new Error(operationError || event.target.errorCode || null)
                );
            };

            var objectStore = transaction.objectStore(self.storeName);
            var storeOrIndex = self.getStoreOrIndex(objectStore);
            var request = storeOrIndex.clear();

            request.onerror = function(event) {
                operationError = event.target.errorCode;
            };
        });
    });
};

ObjectStore.prototype.put = function(record, key) {
    var self = this;
    var putResult;
    var operationError;

    return new Promise(function(resolve, reject) {
        self.db.then(function(db) {
            return db.transaction(self.storeName, "readwrite");
        })
        .then(function(transaction) {
            transaction.oncomplete = function(event) {
                resolve(putResult);
            };

            transaction.onerror = function(event) {
                reject(new Error(
                    operationError || event.target.errorCode || null
                ));
            };

            var objectStore = transaction.objectStore(self.storeName);
            var storeOrIndex = self.getStoreOrIndex(objectStore);
            var request = storeOrIndex.put(record, key);

            request.onsuccess = function(event) {
                putResult = event.target.result;
            };

            request.onerror = function(event) {
                operationError = event.target.errorCode;
            };

        });
    });
};

ObjectStore.prototype.getAll = function() {
    var self = this;
    var result = [];
    var operationError;

    return new Promise(function(resolve, reject) {
        self.db.then(function(db) {
            var transaction = db.transaction(self.storeName);

            transaction.oncomplete = function(event) {
                resolve(result);
            };

            transaction.onerror = function(event) {
                reject(
                    new Error(operationError || event.target.errorCode || null)
                );
            };

            var objectStore = transaction.objectStore(self.storeName);
            var cursor = self.getStoreOrIndex(objectStore).openCursor();

            cursor.onsuccess = function(event) {
                var cursorResult = event.target.result;
                if(cursorResult) {
                    result.push(cursorResult.value);
                    cursorResult.continue();
                }
            };

            cursor.onerror = function(event) {
                operationError = event.target.errorCode;
            };

        });
    });
};

ObjectStore.prototype.getAllKeys = function() {
    var self = this;
    var result = [];
    var operationError;

    return new Promise(function(resolve, reject) {
        self.db.then(function(db) {
            var transaction = db.transaction(self.storeName);

            transaction.oncomplete = function(event) {
                resolve(result);
            };

            transaction.onerror = function(event) {
                reject(
                    new Error(operationError || event.target.errorCode || null)
                );
            };

            var objectStore = transaction.objectStore(self.storeName);
            var cursor = self.getStoreOrIndex(objectStore).openCursor();

            cursor.onsuccess = function(event) {
                var cursorResult = event.target.result;
                if(cursorResult) {
                    result.push(cursorResult.key);
                    cursorResult.continue();
                }
            };

            cursor.onerror = function(event) {
                operationError = event.target.errorCode;
            };
        });
    });
};

ObjectStore.prototype.openCursor = function(idbKeyRange, direction) {
    var self = this;

    return this.db.then(function(db) {
        var transaction = db.transaction(self.storeName);
        var objectStore = transaction.objectStore(self.storeName);

        return new Cursor(self.getStoreOrIndex(objectStore), idbKeyRange, direction);
    });
};

ObjectStore.prototype.openProgressiveCursor = function(idbKeyRange, direction) {
    var self = this;

    var defers = [];

    return self.db.then(function(db) {
        return new Promise(function(resolve, reject) {
            self.db = db;

            var transaction = db.transaction(self.storeName);
            var objectStore = transaction.objectStore(self.storeName);

            var countRequest = objectStore.count(idbKeyRange);
            countRequest.onsuccess = function() {
                defers.length = countRequest.result;
                for(var i=0;i < defers.length;i++) {
                    let defer = {};
                    defer.promise = new Promise((resolve, reject) => {
                        defer.resolve = resolve;
                        defer.reject = reject;
                    });
                    defers[i] = defer;
                        
                }
                resolve(defers);
            };
        });
    })
    .then(function(defers) {
        // Need to create a new transaction because the previous one won't be active
        var transaction = self.db.transaction(self.storeName);
        var objectStore = transaction.objectStore(self.storeName);

        return new ProgressiveCursor(
            self.getStoreOrIndex(objectStore),
            idbKeyRange,
            direction,
            defers
        );
    });
};

var Index = function(db, storeName, indexName) {
    ObjectStore.call(this, db, storeName);

    this.indexName = indexName;

    return this;
};

Index.prototype = Object.create(ObjectStore.prototype);
Index.prototype.getStoreOrIndex = function(objectStore) {
    return objectStore.index(this.indexName);
};
Index.prototype.constructor = Index;

var Cursor = function(objectStore, idbKeyRange, direction) {
    return new Promise(function(resolve, reject) {
        var result = [];

        var cursor = objectStore.openCursor(idbKeyRange, direction);

        cursor.onsuccess = function(event) {
            var cursorResult = event.target.result;
            if(cursorResult) {
                result.push({key: cursorResult.key, value: cursorResult.value});
                cursorResult.continue();
            } else {
                this[Symbol.iterator] = function* () {
                    var i = 0;
                    while(i < result.length) {
                        yield result[i];
                        i++;
                    }
                };
                resolve(this);
            }
        };

        cursor.onerror = function(event) {
            reject(new Error(event.target.errorCode || null));
        };
    });
};

var ProgressiveCursor = function(objectStore, idbKeyRange, direction, defers) {

    var self = this;

    var records = [];

    defers.forEach(function(defer) {
        records.push(defer.promise);
    });

    this[Symbol.iterator] = function* () {
        var recordsCount = records.length;
        for(var i=0;i < recordsCount;i++) {
            var record = records.shift();
            yield record;
        }
    };

    objectStore.openCursor(idbKeyRange, direction)
    .onsuccess = function(event) {
        var cursorResult = event.target.result;
        if(cursorResult) {
            var defer = defers.shift();
            defer.resolve({key: cursorResult.key, value: cursorResult.value});
            cursorResult.continue();
        }
    };

    return this;
};

var Indexeddb = function(dbName, version, doUpgrade) {
    this.db = new Promise(function(resolve, reject) {
        var request;

        if(version) {
            request = window.indexedDB.open(dbName, version);
        } else {
            request = window.indexedDB.open(dbName);
        }

        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            if(doUpgrade) {
                doUpgrade(db);
            }
        };
        request.onerror = function(event) {
            reject(new Error(event.target.errorCode || null));
        };
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
    });

    return this;
}

Indexeddb.prototype.getDb = function() {
    return this.db;
};

Indexeddb.prototype.execTransaction = function(
    operations,
    objectStores,
    mode
) {

    return this.db.then(function(db) {
        var queue = Promise.resolve([]);
        var tx = db.transaction(objectStores, mode);

        operations.forEach(function(operation) {
            queue = queue.then((resultsAccumulator) => {
                resultsAccumulator.push(new Promise((resolve, reject) => {
                    var request = operation(tx);

                    if(!request) {
                        resolve(null);
                    } else if('onsuccess' in request && 'onerror' in request) {
                        request.onsuccess = function(event) {
                            resolve(event.target.result);
                        };
                        request.oncomplete = function(event) {
                            resolve(event.target.result);
                        };
                        request.onerror = function(event) {
                            reject(new Error(event.target.errorCode || null));
                        };
                    } else {
                        resolve(request);
                    }
                }));

                return resultsAccumulator;
            });
        });

        return queue;
    }).then((accumulator) => Promise.all(accumulator));

};
