/**
 * Simple Redis session store for @fastify/session using ioredis
 * Compatible with Fastify's session interface
 */
export class RedisSessionStore {
  constructor(client) {
    this.client = client
    this.prefix = 'sess:'
    this.ttl = 60 * 60 * 24 * 7 // 7 days in seconds
  }

  /**
   * Get session data by session ID
   */
  async get(sessionId, callback) {
    try {
      const data = await this.client.get(this.prefix + sessionId)
      if (!data) {
        return callback(null, null)
      }
      callback(null, JSON.parse(data))
    } catch (err) {
      callback(err)
    }
  }

  /**
   * Set session data
   */
  async set(sessionId, session, callback) {
    try {
      const data = JSON.stringify(session)
      await this.client.setex(this.prefix + sessionId, this.ttl, data)
      callback(null)
    } catch (err) {
      callback(err)
    }
  }

  /**
   * Destroy session
   */
  async destroy(sessionId, callback) {
    try {
      await this.client.del(this.prefix + sessionId)
      callback(null)
    } catch (err) {
      callback(err)
    }
  }
}
