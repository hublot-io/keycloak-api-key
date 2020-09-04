const { createService, createStore } = require('../lib/service')
const { setupFakeKeyloak, setupFakeApi, keycloakRoot } = require('./_helpers')
const test = require('ava')

test.beforeEach(() => {
    setupFakeKeyloak()
    setupFakeApi()
})

test('create store will return a store, we can get & update its content', t => {
    const store = createStore()
    t.assert(store.getToken)
    t.assert(store.updateToken)
    store.updateToken({ i: 0 })
    t.is(store.getToken().i, 0)
    store.updateToken({ i: 1 })
    t.is(store.getToken().i, 1)
})

test('create service will create a service, that manages the auth token', async t => {
    const service = await createService(keycloakRoot, 'test', 'secret')
    const response = await service.fetch('http://api.com/value', { method: 'GET' })
    t.is(JSON.parse(response).valid, true)
})