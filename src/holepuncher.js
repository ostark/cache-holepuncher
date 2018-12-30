class Cache {
    constructor(enabled = true) {
        this.name = 'holepuncher';
        this.isSupported = (typeof caches != 'undefined' && enabled);
    }

    async get(key) {
        if (this.isSupported) {
            const cache = await caches.open(this.name);
            return await cache.match(key);
        }
    }

    async put(key, value) {
        if (this.isSupported) {
            const cache = await caches.open(this.name);
            return await cache.put(key, value);
        }
    }

    async delete() {
        if (this.isSupported) {
            return await caches.delete(this.name);
        }
    }
}

class EventDispatcher {
    constructor() {
        const node = document.createDocumentFragment();
        [
            'addEventListener',
            'dispatchEvent',
            'removeEventListener'
        ].forEach(f => this[f] = (...args) => node[f](...args))
    }
    on(name, callback) {
        return this.addEventListener(name, callback);
    }
    fire(name, detail = {}) {
        return this.dispatchEvent(new CustomEvent(name, {
            detail: detail
        }));
    }
}

class HolePuncher {
    constructor({localCache = true, verbose = false} = {}) {
        this.cache = new Cache(localCache);
        this.events = new EventDispatcher();
        this.fetchOptions = {mode: 'no-cors', credentials: 'same-origin'};
        this.log = function (...args) {
            if (verbose === true && self.console && typeof console.log === 'function') {
                args.unshift('[HolePuncher]');
                console.log.apply(null, args);
            }
        }
    }

    /**
     * Fetch and cache
     *
     * @param url
     * @param context
     * @returns {Promise<*>}
     */
    async fetch(url, context) {
        const resp = await this.cache.get(new Request(url));

        if (resp) {
            this.log('Event fetch_data', resp);
            this.events.fire('fetch_data', {'response': resp, 'context': context, 'cached': true});
            return resp;
        }

        this.log('Event before_fetch');
        this.events.fire('before_fetch', {'context': context});

        return fetch(url, this.fetchOptions)
            .then(response => {
                if (response.ok) {
                    const resp = response.clone();
                    this.log('Event fetch_data', response);
                    this.events.fire('fetch_data', {'response': resp, 'context': context, 'cached': false});
                    this.cache.put(url, response);
                    return resp;
                }
            }).catch(error => {
                this.log(error);
            });
    }

    /**
     * Flush cache
     */
    flush() {
        (new Cache()).delete();
        this.log('Event flush');
        this.events.fire('flush');
    }
}


/**
 * Helper methods for quick access
 */

function punch_one(url, elementId, options = {}) {
    const puncher = new HolePuncher(options);
    const element = document.getElementById(elementId);
    puncher.fetch(url)
        .then(resp => resp.text())
        .then(text => {
            element.innerHTML = text;
        });

    return puncher;
}

function punch_all(elementSelector, elementUrlAttribute = 'data-url', options = {}) {
    const puncher = new HolePuncher(options);
    const elements = document.querySelectorAll(elementSelector);
    // Fetch
    elements.forEach(placeholder => {
        puncher.fetch(placeholder.getAttribute(elementUrlAttribute), placeholder);
    });

    // Fetch Callback
    puncher.events.on('fetch_data', e => {
        const placeholder = e.detail.context;
        const reponse = e.detail.response.clone();
        reponse.text().then(text => {
            placeholder.innerHTML = text;
        });
    });
    return puncher;
}

function punch_flush($options = {}) {
    const puncher = new HolePuncher($options);
    puncher.flush();
    return puncher;
}

/**
 * Module export
 */
if (typeof module != 'undefined') {
    module.exports = {HolePuncher, punch_one, punch_all, punch_flush};
}

