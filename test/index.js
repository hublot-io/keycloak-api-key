const test = require('ava')
const nock = require('nock')
const { fetch, authenticate, addSeconds, encodeToken, createTokenFromResponse } = require('../lib/keycloak')


function setupFakeApi () {
    const server = nock('http://api.com')
    server
        .get('/value')
        .reply(function () {
            // const auth = body.req
            const auth = this.req.headers['authorization']
            // "either our hardcoded token, or the fake auth token"
            if (auth === 'Bearer valid' || auth === 'Bearer access_token') {
                const resp = {
                    valid: true
                }
                return [200, resp]
            }
            else {
                return [400, {
                    'error': 'unauthorized_client',
                    'error_description': 'INVALID_CREDENTIALS: Invalid client credentials'
                }]
            }
        }).persist()
}

const keycloakRoot = 'https://keycloak.test/auth/realms/test'
function setupFakeKeyloak () {
    const keycloakUrl = '/protocol/openid-connect/token'
    const server = nock(`${keycloakRoot}`)
    server
        .post(keycloakUrl)
        .reply(function () {
            // const auth = body.req
            const auth = this.req.headers['authorization']
            if (auth === 'Basic dGVzdDpzZWNyZXQ=') {
                const resp = {
                    'access_token': 'access_token',
                    'expires_in': 1200,
                    'refresh_expires_in': 1800,
                    'refresh_token': 'refresh_token',
                    'token_type': 'bearer',
                    'not-before-policy': 0,
                    'session_state': 'ad57bbea-768d-4118-afde-c7bc569f5ba2',
                    'scope': 'profile email'
                }
                return [200, resp]
            }
            else {
                return [400, {
                    'error': 'unauthorized_client',
                    'error_description': 'INVALID_CREDENTIALS: Invalid client credentials'
                }]
            }
        }).persist()
}

test.beforeEach(() => {
    setupFakeApi()
    setupFakeKeyloak()
})

test('fetch must call an url, et return its json content', async t => {
    const defaultToken = {
        token: 'valid',
        refreshToken: 'valid',
        expiresAt: addSeconds(new Date(), 1200),
        refreshExpiresAt: addSeconds(new Date(), 1600),
        serviceName: 'test',
        secret: 'secret',
        keycloakUrl: keycloakRoot
    }
    const validToken = {
        ...defaultToken,
    }
    const [{ valid }] = await fetch(validToken, 'http://api.com/value', { method: 'GET' })
    t.is(valid, true)

    const invalidToken = {
        ...defaultToken,
        token: 'invalid',
    }
    try {
        await fetch(invalidToken, 'http://api.com/value', { method: 'GET' })
    } catch (e) {
        t.pass()
    }


    const invalidDateToken = {
        ...defaultToken,
        expiresAt: addSeconds(new Date(), -20),
        refreshExpiresAt: addSeconds(new Date(), 1600),
    }
    try {
        const [{ valid }] = await fetch(invalidDateToken, 'http://api.com/value', { method: 'GET' })
        t.is(valid, true)
    } catch (e) {
        t.fail()
    }

    const invalidTokenAndRefresh = {
        ...defaultToken,
        expiresAt: addSeconds(new Date(), -20),
        refreshExpiresAt: addSeconds(new Date(), -20)
    }
    try {
        const [{ valid }] = await fetch(invalidTokenAndRefresh, 'http://api.com/value', { method: 'GET' })
        t.is(valid, true)
    }
    catch (e) {
        t.fail()
    }
})


test('addSeconds should add some seconds to a nodejs date', t => {
    const date = new Date()
    t.is(date.getTime(), addSeconds(date, 0).getTime())
    const before = new Date()
    before.setSeconds(10)
    t.is(addSeconds(before, 20).getSeconds(), 30)
})

test('encodeToken returns a base64 encoded version of the string', t => {
    const result = 'dGVzdDp0ZXN0'
    t.is(encodeToken('test', 'test'), result)
})

test('createTokenFromResponse must format the response, and calculate expire times', t => {
    const response = {
        'access_token': 'access_token',
        'expires_in': 1200,
        'refresh_expires_in': 1800,
        'refresh_token': 'refresh_token',
    }
    const date = new Date()
    const formated = createTokenFromResponse(response, date)
    t.is(formated.token, response.access_token)
    t.is(formated.refreshToken, response.refresh_token)
    t.deepEqual(formated.expiresAt, addSeconds(date, response.expires_in))
    t.deepEqual(formated.refreshExpiresAt, addSeconds(date, response.refresh_expires_in))
})


test('Authenticate should return a token when the serviceName & secret are good', t => {
    return Promise.all([
        authenticate(keycloakRoot, 'test', 'secret').then((json) => {
            t.pass()
        }),
        authenticate(keycloakRoot, 'test', 'fake').catch(error => {
            t.pass()
        }),
    ])
})