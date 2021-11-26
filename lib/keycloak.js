import _fetch from 'isomorphic-fetch'
import {atob, btoa} from 'isomorphic-base64'
const connectUrl = 'protocol/openid-connect/token'

export function handleResponse (body) {
    const statusCode = body.status
    if (statusCode < 200 || statusCode >= 300) return Promise.reject(body)
    return Promise.resolve(body)
}

/**
 * 
 * @param {import('../index').IAuth} config 
 * @param {String} url 
 * @param {Object} options 
 */
export function fetch (config, url, options, body, responseType = 'text') {
    const now = new Date()
    const tokenPromise = (() => {
        if (config.expiresAt.getTime() <= now.getTime()) {
            console.log('The actual auth token is expired, renewing it.')
            return renewToken(config)
        }
        return Promise.resolve(config)
    })()

    return tokenPromise.then((updatedConfig) => {
        return new Promise((resolve, reject) => {
            const headers = new Headers()
            headers.append('Authorization', `Bearer ${updatedConfig.token}`)
            const requestOptions = {
                method: 'POST',
                headers: headers,
                body: body,
                redirect: 'follow',
                ...options
            };
            _fetch(
                url, 
                requestOptions
            )
            .then((response) => handleResponse(response))
            .then(response => response[responseType]() )
            .then(json => resolve([json, updatedConfig]))
            .catch(reject)
        })
    })
}

export function encodeToken (serviceName, secret) {
    return btoa(`${serviceName}:${secret}`)
}

export function addSeconds (date, seconds) {
    const copy = new Date(date)
    copy.setSeconds(copy.getSeconds() + seconds)
    return copy
}

/**
 * 
 * @param {Object} param0 - keycloak  auth config 
 * @param {Date} now
 * @returns {import('../index').IAuth} 
 */
export function createTokenFromResponse ({ access_token, expires_in, refresh_expires_in, refresh_token }, serviceName, secret, keycloakUrl, now = new Date()) {
    const expiresAt = addSeconds(now, expires_in)
    const refreshExpiresAt = addSeconds(now, refresh_expires_in)
    return {
        token: access_token,
        refreshToken: refresh_token,
        expiresAt,
        refreshExpiresAt,
        serviceName,
        secret,
        keycloakUrl
    }
}
/**
 * 
 * @param {import('../index').IAuth} config 
 */
export function renewToken (config, now = new Date()) {
    const tokenPromise = (() => {
        if (config.refreshExpiresAt.getTime() <= now.getTime()) {
            console.log('The actual renew_token is expired, authenticating again.')
            const { keycloakUrl, secret, serviceName } = config
            return authenticate(keycloakUrl, serviceName, secret)
        }
        return Promise.resolve(config)
    })()
    return tokenPromise.then((updatedConfig) => {
        const url = `${updatedConfig.keycloakUrl}/${connectUrl}`
        const encodedToken = encodeToken(updatedConfig.serviceName, config.secret)
        return new Promise((resolve, reject) => {
            const headers = new Headers()
            headers.append('Authorization', `Basic ${encodedToken}`)
            headers.append('Content-Type', 'application/x-www-form-urlencoded' )
            const  urlencoded = new URLSearchParams();
            urlencoded.append("grant_type", "refresh_token");
            urlencoded.append("client_id", updatedConfig.serviceName);
            urlencoded.append("refresh_token", updatedConfig.refreshToken);
            const requestOptions = {
                method: 'POST',
                headers: headers,
                body: urlencoded,
                redirect: 'follow'
            };
            return _fetch(
                url,
                requestOptions
            )
           .then( (response) => handleResponse(response))
        .then((response) => response.text())

            .then((body) => {
                const json = JSON.parse(body)
                const response = createTokenFromResponse(json, updatedConfig.serviceName, config.secret, updatedConfig.keycloakUrl)
                return resolve(response)
            })
            .catch(reject)
        })
    })
}

export function authenticate (keycloakUrl, serviceName, secret) {
    const url = `${keycloakUrl}/${connectUrl}`
    const encodedToken = encodeToken(serviceName, secret)
    const headers = new Headers()
    headers.append('Authorization', `Basic ${encodedToken}`)
    headers.append('Content-Type', 'application/x-www-form-urlencoded' )
    const  urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: urlencoded,
        redirect: 'follow'
    };
    return new Promise((resolve, reject) => {
        _fetch(
            url,
            requestOptions
        ).then((response) => handleResponse(response))
        .then((response) => response.text())
        .then((body) => {
            const json = JSON.parse(body)
            return resolve(createTokenFromResponse(json, serviceName, secret, keycloakUrl))
        }).catch(reject)
    })
}

