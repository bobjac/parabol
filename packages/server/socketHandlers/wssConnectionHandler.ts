import keepAlive from '../socketHelpers/keepAlive'
import handleDisconnect from './handleDisconnect'
import handleMessage from './handleMessage'
import url from 'url'
import {clientSecret as auth0ClientSecret} from '../utils/auth0Helpers'
import {verify} from 'jsonwebtoken'
import handleConnect from './handleConnect'
import ConnectionContext from '../socketHelpers/ConnectionContext'
import {TREBUCHET_WS} from '@mattkrick/trebuchet-client'
import DataLoaderWarehouse from 'dataloader-warehouse'
import RateLimiter from 'graphql/RateLimiter'

const APP_VERSION = process.env.npm_package_version
export default function connectionHandler(
  sharedDataLoader: DataLoaderWarehouse,
  rateLimiter: RateLimiter
) {
  return async function socketConnectionHandler(socket: UserWebSocket, req) {
    const {headers} = req
    const protocol = headers['sec-websocket-protocol']
    if (protocol !== TREBUCHET_WS) {
      // protocol error
      socket.close(1002)
      return
    }

    const {query} = url.parse(req.url, true)
    let authToken
    try {
      authToken = verify(query.token as string, Buffer.from(auth0ClientSecret, 'base64'))
    } catch (e) {
      // internal error (bad auth)
      socket.close(1011)
      return
    }
    const connectionContext = new ConnectionContext(
      socket,
      authToken,
      sharedDataLoader,
      rateLimiter,
      req.ip
    )
    keepAlive(connectionContext)
    socket.on('message', handleMessage(connectionContext))
    socket.on('close', handleDisconnect(connectionContext))
    const nextAuthToken = await handleConnect(connectionContext)
    socket.send(JSON.stringify({version: APP_VERSION, authToken: nextAuthToken}))
  }
}
