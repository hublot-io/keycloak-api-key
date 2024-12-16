const { fetch, authenticate, addSeconds, encodeToken, createTokenFromResponse }= Keycoquelico

const keycloakRoot = 'http://localhost:3000'
describe('fetch must call an url, and return its json content',  function() {

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
    it('should work when the token is valid',(done)=>{
        fetch(validToken, 'http://localhost:3000/value', { method: 'GET' }).then((resp)=>{
            const [body]  = resp
            const { valid } = JSON.parse(body)
            expect(valid).toBe(true)
            done()
        })
    })
    it('should catch when the token is invalid', (done)=>{
        const invalidToken = {
            ...defaultToken,
            token: 'invalid',
        }
        fetch(invalidToken, 'http://localhost:3000/value', { method: 'GET' })
            .then(()=>{}, () => {
                expect(true).toBe(true)
                done()
            })
    })

    it('should renew the token if it is expired', done => {
        const invalidDateToken = {
            ...defaultToken,
            expiresAt: addSeconds(new Date(), -20),
            refreshExpiresAt: addSeconds(new Date(), 1600),
        }
        fetch(invalidDateToken, 'http://localhost:3000/value', { method: 'GET' }).then(resp => {
            const [body] = resp
            const { valid } = JSON.parse(body)
            expect(valid).toBe(true)
            done()
        })
            
    })

    it('auth again if both token & renew have expired', done => {
        const invalidTokenAndRefresh = {
            ...defaultToken,
            expiresAt: addSeconds(new Date(), -20),
            refreshExpiresAt: addSeconds(new Date(), -20)
        }
        fetch(invalidTokenAndRefresh, 'http://localhost:3000/value', { method: 'GET' }).then((resp)=>{
            const [body] = resp
            const { valid } = JSON.parse(body)
            expect(valid).toBe(true)
            done()
        })
    })

  
})