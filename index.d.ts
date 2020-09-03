import { HeaderInit } from 'node-fetch'

interface IAuth {
    token: String;
    refreshToken: String;
    // timestamps
    expiresAt: String;
    refreshExpiresAt: String;
    serviceName: String,
    secret: String,
    keycloakUrl: String
}

export function fetch(url: String, options: HeaderInit, authentication: IAuth): Promise<Object>

export function authenticate(keycloakUrl: String, serviceName: String, secret: String): Promise<IAuth>

export function renew(keycloakUrl: String, serviceName: String, secret: String, auth: IAuth): Promise<IAuth>