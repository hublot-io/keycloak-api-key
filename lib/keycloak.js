const request = require('request')

const connectUrl = 'protocol/openid-connect/token'

function handleResponse (error, response, body) {
    if (error) return Promise.reject(error)
    const statusCode = response.statusCode
    const json = JSON.parse(body)
    if (statusCode < 200 || statusCode >= 300) return Promise.reject(json)
    return Promise.resolve(json)
}





/**
 * 
 * @param {import('../index').IAuth} config 
 * @param {String} url 
 * @param {Object} options 
 */
function fetchWithToken (config, url, options) {
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
            request({
                url,
                ...options,
                headers: {
                    Authorization: `Bearer ${updatedConfig.token}`,
                    ...options.headers
                }
            }, (...args) => handleResponse(...args)
                .then(json => {
                    return resolve([json, updatedConfig])
                })
                .catch(reject)
            )
        })
    })
}







function encodeToken (serviceName, secret) {
    return Buffer.from(`${serviceName}:${secret}`).toString('base64')
}

function addSeconds (date, seconds) {
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
function createTokenFromResponse ({ access_token, expires_in, refresh_expires_in, refresh_token }, serviceName, secret, keycloakUrl, now = new Date()) {
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
function renewToken (config, now = new Date()) {
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
            return request.post({
                url,
                method: 'POST',
                headers: {
                    'cache-control': 'no-cache',
                    Authorization: `Basic ${encodedToken}`,
                    Accept: '*/*',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                    client_id: updatedConfig.serviceName,
                    grant_type: 'refresh_token',
                    refresh_token: updatedConfig.refreshToken

                }

            }, (...args) => {
                handleResponse(...args).then((json) => {
                    return resolve(createTokenFromResponse(json, updatedConfig.serviceName, config.secret, updatedConfig.keycloakUrl))
                }).catch(reject)
            })
        })
    })
}


function authenticate (keycloakUrl, serviceName, secret) {
    const url = `${keycloakUrl}/${connectUrl}`
    const encodedToken = encodeToken(serviceName, secret)

    return new Promise((resolve, reject) => {
        return request.post({
            url,
            method: 'POST',
            headers: {
                'cache-control': 'no-cache',
                Authorization: `Basic ${encodedToken}`,
                Accept: '*/*',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                grant_type: 'client_credentials',
            }

        }, (...args) => {
            handleResponse(...args).then((json) => {
                return resolve(createTokenFromResponse(json, serviceName, secret, keycloakUrl))
            }).catch(reject)
        })
    })
}
module.exports = {
    fetch: fetchWithToken,
    renew: renewToken,
    authenticate,
    addSeconds,
    encodeToken,
    createTokenFromResponse
}