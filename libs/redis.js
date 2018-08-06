const Store = require("./store");
const Redis = require("ioredis");
class RedisStore extends Store {
    constructor(conf) {
        super();
        //this.redis = new Redis();
        //[ioredis] Unhandled error event: Error: read ECONNRESET
        this.redis =new Redis({
            port: conf.port, 
            host: conf.host, 
            password: conf.password,
            reconnectOnError:function(err) {
                console.log('reconnectOnError',err.message)
                return true;
            },
            retryStrategy: function (times) {
                //console.log('times',times)
                return 6000//Math.min(times * 50, 2000);
            }
        });
        this.redis.on('connect',function(){
            console.log('Redis connected!')
        })
    }

    async get(sid, ctx) {
        let data = await this.redis.get(`SESSION:${sid}`);
        
        return JSON.parse(data);
    }

    async set(session, { sid =  this.getID(24), maxAge = 1000000 } = {}, ctx) {
        try {
            // Use redis set EX to automatically drop expired sessions
            await this.redis.set(`SESSION:${sid}`, JSON.stringify(session), 'EX', maxAge / 1000);
        } catch (e) {}
        return sid;
    }

    async destroy(sid, ctx) {
        return await this.redis.del(`SESSION:${sid}`);
    }
}

module.exports=RedisStore;