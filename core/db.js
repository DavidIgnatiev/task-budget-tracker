// Tasks Data Base:
// id - unique for each task
// title - name of the task
// description - description of the task
// status - in which column is the task(finished, in progress, should be done)
// dependencies - list of the dependencies on other tasks

// Transactions in Budget Data Base:
// id - unique for each transaction
// amount - how much was spent/received
// category - category
// date - date of the transaction
// description - description of transaction


export class AppDatabase {
    constructor() {
        this.db = null;
        this.dbName = "DashBoardDB";
        this.version = 2;
    }

    connect() {
        if (this.db) return Promise.resolve(this.db);

        let promise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = request.result;

                if (!db.objectStoreNames.contains("tasks")) {
                    const tasksStore = db.createObjectStore("tasks", { keyPath: "id" });
                    tasksStore.createIndex("status", "status");
                }

                if (!db.objectStoreNames.contains("transactions")) {
                    const transactionsStore = db.createObjectStore("transactions", { keyPath: "id" });
                    transactionsStore.createIndex("date", "date", { unique: false });
                    transactionsStore.createIndex("type", "type", { unique: false });
                }
            };

            request.onerror = function (event) {
                reject(event);
            }

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            }
        });

        return promise;
    }

    async add(storeName, data) {
        const db = await this.connect();
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);

        let promise = new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = function () {
                resolve(data);
            }

            request.onerror = function(event) {
                reject(event);
            }
        });
        
        return promise;
    }

    async get(storeName, id) {
        const db = await this.connect();
        let promise = new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(id); 

            request.onsuccess = function () {
                resolve(request.result);
            }

            request.onerror = function (event) {
                reject(event);
            }
        });

        return promise;
    }



    async getAll(storeName) {
        const db = await this.connect();
        let promise = new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();
            request.onsuccess = function () {
                resolve(request.result);
            }

            request.onerror = function (event) {
                reject(event);
            }
        });

        return promise;
    }

    async update(storeName, data) {
        return this.add(storeName, data)
    }

    async delete(storeName, id) {
        const db = await this.connect();
        let promise = new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite");
            const objectStore = transaction.objectStore(storeName);

            const deleteRequest = objectStore.delete(id);
            deleteRequest.onsuccess = function () {
                resolve(id);
            }

            deleteRequest.onerror = function (event) {
                reject(event);
            }
        });

        return promise;
    }
}



// Custom Stack data structure implementation
export class Stack {
    constructor() {
        this.items = [];
    }

    push(element) {
        this.items.push(element);
    }

    pop() {
        if (this.isEmpty()) return null;
        return this.items.pop();
    }

    isEmpty() {
        return this.items.length === 0;
    }
}



