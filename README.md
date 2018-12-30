# cache-holepuncher.js

A lightweight dependency-free library for cache hole punching. 

Pull dynamic HMTL snippets in fully cached sites with a single line of code. By default the response is cached browser to avoid unnecessary requests. 


## Install

```bash
npm install cache-holepuncher
```

or

```bash
yarn add cache-holepuncher
```

If you are constained to a non-module environment (e.g. no bundlers such as webpack), pull the latest version of `cache-holepuncher` from `jsdelivr`.

```html
<script src="https://cdn.jsdelivr.net/npm/cache-holepuncher@0.6.0/dist/holepuncher.min.js"></script>
```



## Basic usage

...

### Get single
```html
<div id="single_placeholder_id">
    empty state
</div>

<script>
    punch_one("/some/endpoint", "single_placeholder_id");
</script>
```

### Get multiple
```html
<ul>
    <li class="placeholder" data-callback-url="/some/endpoint/foo">empty state</li>
    <li class="placeholder" data-callback-url="/some/endpoint/bar">empty state</li>
</ul>

<script>
    punch_all(".placeholder", "data-callback-url");
</script>
```

### Flush local cache
```js
document.querySelector("form").addEventListener('submit', e => punch_flush());
```

## Advanced usage

```js
import { HolePuncher } from './holepuncher';

let puncher     = new HolePuncher(options);
let placeholder = document.getElementById(elementId);
let url         = '/some/endpoint';
    
// do something before fetch  
puncher.events.on('before_fetch', e => { 
    const placeholder = e.detail.context;
    placeholder.classList.add('loading');
});

// do something when the data is avaiable
puncher.events.on('fetch_data', e => { 
    // hide loader 
    const placeholder = e.detail.context;
    const response = e.detail.response.clone();
    response.json().then(data => {
        placeholder.innerHTML = data.someAttribute;
        placeholder.classList.remove('loading');
        console.log(data.anotherAttribute)
    }); 
});
    
// fetch html    
puncher.fetch(url, placeholder);   

// fetch json    
puncher.fetch(url, placeholder, { 
    credentials: 'same-origin',
    headers: new Headers({
        'Content-Type': 'application/json'
    })
});      
        
// register listener that flushes the local cache 
document.querySelector("form").addEventListener('submit', e => {
    puncher.flush({verbose: true})
});
    
```

