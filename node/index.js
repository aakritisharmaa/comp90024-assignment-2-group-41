const Koa = require('koa');
const logger = require('koa-morgan')
const Router = require('koa-router')
// const bodyParser = require('koa-body')()
const rp = require('request-promise')
const fs = require('fs')

const app = new Koa()
const router = new Router()

const admin = process.argv[2]
const pass = process.argv[3]
const server = process.argv[4]
const couchdb2020 = process.argv[5]
const couchdb2014 = process.argv[6]
const authApi2020 = 'http://' + admin + ':' + pass + '@' + server + '/' + couchdb2020
const authApi2014 = 'http://' + admin + ':' + pass + '@' + server + '/' + couchdb2014
const docApi = '/_design/count/_view/count-doc'
const wordApi = '/_design/count/_view/count-word'

const topTweets = JSON.parse(fs.readFileSync('./tweet_gr.json'))
const aurin = JSON.parse(fs.readFileSync('./aurin.json'))

const sa3 = ['Melbourne City', 
    'Port Phillip', 
    'Bayside', 
    'Glen Eira', 
    'Stonnington - West', 
    'Stonnington - East', 
    'Boroondara', 
    'Yarra', 
    'Darebin - South', 
    'Brunswick - Coburg', 
    'Essendon', 
    'Maribyrnong', 
    'Hobsons Bay']

// router

router.get('/', async ctx => {
    ctx.body = {
        'status': 'ok',
        'json': topTweets
    }
})

router.get('/price', async ctx => {
    ctx.body = {
        'status': 'ok',
        'json': aurin
    }
})

router.get('/word', async ctx => {
    var keys = []
    sa3.forEach((sa3) => {
        keys.push('\"' + sa3 + ':' + ctx.request.query.key + '\"')
    })
    keys = '[' + String(keys) + ']'
    // console.log(keys)

    var docOption2020 = {
        mothod: 'GET',
        uri: authApi2020 + docApi,
        qs: {
            reduce: true,
            group: true
        }
    }

    var wordOption2020 = {
        mothod: 'GET',
        uri: authApi2020 + wordApi,
        qs: {
            reduce: true,
            group: true,
            keys: keys
        }
    }

    var docOption2014 = {
        mothod: 'GET',
        uri: authApi2014 + docApi,
        qs: {
            reduce: true,
            group: true
        }
    }

    var wordOption2014 = {
        mothod: 'GET',
        uri: authApi2014 + wordApi,
        qs: {
            reduce: true,
            group: true,
            keys: keys
        }
    }

    var docCounter2020 = {}
    var wordCounter2020 = {}
    var docCounter2014 = {}
    var wordCounter2014 = {}
    var error = null

    await rp(docOption2020)
        .then((body) => {
            JSON.parse(body).rows.forEach((kv) => {
                docCounter2020[kv.key] = kv.value
            })
            console.log(docCounter2020)
        })
        .catch((err) => {
            error = 'Fail to call DB-2020 doc map-reduce.'
            console.log(err)
        })

    if (!error) {
        await rp(wordOption2020)
            .then((body) => {
                JSON.parse(body).rows.forEach((kv) => {
                    wordCounter2020[kv.key.split(':')[0]] = kv.value
                })
                console.log(wordCounter2020)
            })
            .catch((err) => {
                error = 'Fail to call DB-2020 word map-reduce.'
                console.log(err)
            })
    }

    if (!error) {
        await rp(docOption2014)
            .then((body) => {
                JSON.parse(body).rows.forEach((kv) => {
                    docCounter2014[kv.key] = kv.value
                })
                console.log(docCounter2014)
            })
            .catch((err) => {
                error = 'Fail to call DB-2014 doc map-reduce.'
                console.log(err)
            })
    }

    if (!error) {
        await rp(wordOption2014)
            .then((body) => {
                JSON.parse(body).rows.forEach((kv) => {
                    wordCounter2014[kv.key.split(':')[0]] = kv.value
                })
                console.log(wordCounter2014)
            })
            .catch((err) => {
                error = 'Fail to call DB-2014 word map-reduce.'
                console.log(err)
            })
    }
    
    if (error) {
        ctx.body = {
            'status': 'error',
            'json': {
                'message': error
            }
        }
    } else {
        var wordFrequency2020 = {}
        var wordFrequency2014 = {}
        sa3.forEach((sa3) => {
            if (docCounter2020[sa3]) {
                if (!wordCounter2020[sa3]) {
                    wordCounter2020[sa3] = 0
                }
                wordFrequency2020[sa3] = wordCounter2020[sa3] / docCounter2020[sa3]
            } else {
                wordFrequency2020[sa3] = 0
            }
        })
        sa3.forEach((sa3) => {
            if (docCounter2014[sa3]) {
                if (!wordCounter2014[sa3]) {
                    wordCounter2014[sa3] = 0
                }
                wordFrequency2014[sa3] = wordCounter2014[sa3] / docCounter2014[sa3]
            } else {
                wordFrequency2014[sa3] = 0
            }
        })
        ctx.body = {
            'status': 'ok',
            'json': {
                '2014': wordFrequency2014,
                '2020': wordFrequency2020
            }
        }
    }
})

// response

app.use(logger('tiny'))
.use(router.routes())
.use(async ctx => {
  ctx.body = 'Hello World'
})
.listen(3000)