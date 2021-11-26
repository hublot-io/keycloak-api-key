
const Hapi = require('@hapi/hapi')

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    })

    server.route([{
        method: 'GET',
        path: '/value',
        options:{cors: true},
        handler:(req, h) => {
            const auth = req.headers['authorization']
            if (auth === 'Bearer valid' || auth === 'Bearer access_token') {
                const resp = {
                    valid: true
                }                
                return h.response(JSON.stringify(resp)).code(200)
            } else {             
                return h.response({
                    'error': 'unauthorized_client',
                    'error_description': 'INVALID_CREDENTIALS: Invalid client credentials'
                }).code(400)
            }
        }
    },{
        method: 'POST',
        path: '/protocol/openid-connect/token',
        options:{cors: true},
        handler: (req, h) => {
            const auth = req.headers['authorization']
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
                return  h.response(JSON.stringify(resp)).code(200)
            }
            else {
                console.log('invalid, sending error')
                return  h.response(JSON.stringify({
                    'error': 'unauthorized_client',
                    'error_description': 'INVALID_CREDENTIALS: Invalid client credentials'
                })).code(400)
            }
        }
    }])
    server.events.on('response', function (request) {
        console.log(request.info.remoteAddress + ': ' + request.method.toUpperCase() + ' ' + request.path + ' --> ' + request.response.statusCode)
    })
    
    await server.start()
    console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()


