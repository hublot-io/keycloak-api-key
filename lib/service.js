import { fetch, authenticate }from './keycloak'

export function createStore () {
    let authToken = null
    return {
        updateToken (newToken) {
            authToken = newToken
        },
        getToken () {
            return authToken
        }
    }
}

export function createService (keycloakRoot, serviceName, secret) {
    let store = createStore()
    return authenticate(keycloakRoot, serviceName, secret).then(authToken => {
        store.updateToken(authToken)
        return {
            fetch (url, options) {
                return fetch(store.getToken(), url, options).then(([response, token]) => {
                    store.updateToken(token)
                    return response
                })
            },
        }
    })
}

