# keycloak-api-key

This project aims to enable a "google cloud api key" like system with keycloak.
Most of the times you only want to authenticate your users via keycloak and it is quite easy to do. 
Sometimes your backends implements asynchronus workflows, or event-driven workers. As no users are involved in those processes
we have to find a way to authenticate our backends if they have to call protected services.


## How to setup the accounts : 
https://stackoverflow.com/questions/52230634/issuing-api-keys-using-keycloak

## Install : 
as this project is still a WIP it is not published to NPM
```
npm install git+https://github.com/hublot-io/keycloak-api-key.git
```

## Usage : 

We provide 2 APIS.
The first one let you manage the authentication & the storage of the auth token, the second one manages it for you.

### first API:
```javascript
const {fetch, authenticate} = require('keycloak-api-key')

authenticate('https://keycloak.test/auth/realms/test', 'test', 'secret').then((token) => {
    fetch(token, 'https://api.com/value', {method: 'GET'}).then(([json, newToken])=>{
        // if our first token was expired, the newToken is an updated one. It may have been renewed, or we have authenticated
        // an other time if the renew_token was expired
    })
})

```

### second API: 
```javascript
createService('https://keycloak.test/auth/realms/test', 'test', 'secret').then((service)=>{
    service.fetch('http://api.com/value', { method: 'GET' }).then(json => {
        // when using the service, we dont have to manage the token ourselves
    })

})
```