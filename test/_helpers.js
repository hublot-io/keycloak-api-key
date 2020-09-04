const nock = require('nock')
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

module.exports = {
    setupFakeApi,
    keycloakRoot,
    setupFakeKeyloak
}