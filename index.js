'use strict'

const fs = require('fs-extra')
const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const Logger = require('koa-logger')
const KoaIlp = require('koa-ilp')
const DigestStream = require('digest-stream')
const tempy = require('tempy')
const BigNumber = require('bignumber.js')
const plugin = require('ilp-plugin')()

const app = new Koa()
const router = new Router()
const ilp = new KoaIlp({ plugin })

app.use(Logger())
app.use(router.routes())
app.use(router.allowedMethods())

const SHA256_REGEX = /^[0-9a-fA-F]{64}$/

const digestToPath = (digest) =>
  path.resolve(__dirname, 'data', digest.substring(0, 2), digest)

// cost per byte is 750 pico-XRP
const costPerByte = new BigNumber(process.env.UNHASH_COST_PER_GIGABYTE || 0.15) // USD/gb*month
  .div(1.50) // * XRP/USD = XRP/gb*month
  .mul(Math.pow(10, 6)) // * drops/XRP = drops/gb*month
  .div(Math.pow(10, 9)) // * GB/byte = drops/byte*month

const sizeOfInode = new BigNumber(1024)
const minXrpPrice = new BigNumber(1000)
const calculatePrice = (sizeInBytes) => sizeOfInode.add(sizeInBytes).mul(costPerByte).round().toString()

router.get('/.well-known/unhash.json', (ctx) => {
  ctx.body = {
    upload: (process.env.UNHASH_PUBLIC_URI || 'http://localhost:3000') + '/upload'
  }
})

router.options('/upload', ilp.options({ price: async ctx => {
  const sizeInBytes = ctx.get('Unhash-Content-Length') || Math.pow(10, 9)
  ctx.set('Unhash-Content-Length', sizeInBytes)
  return calculatePrice(sizeInBytes)
}}))

router.post(['/', '/upload'], ilp.paid({
  price: ctx => calculatePrice(ctx.get('Content-Length'))
}), async (ctx) => {
  const tempPath = tempy.file()
  console.log('saving to', tempPath)
  console.log('uploading for', ctx.get('Content-Length'))

  const digest = await (new Promise((resolve, reject) => {
    const digestStream = DigestStream('sha256', 'hex', resolve)
    const stream = fs.createWriteStream(tempPath)
    ctx.req.pipe(digestStream).pipe(stream)
  }))

  const digestPath = digestToPath(digest)
  if (await fs.exists(digestPath)) {
    ctx.status = 200
  } else {
    await fs.ensureDir(path.dirname(digestPath))
    await fs.move(tempPath, digestPath)
    ctx.status = 201
  }

  ctx.body = {
    digest
  }
})

router.get('/:hash', async (ctx) => {
  if (SHA256_REGEX.exec(ctx.params.hash)) {
    const digest = ctx.params.hash.toLowerCase()
    const digestPath = digestToPath(digest)

    if (await fs.exists(digestPath)) {
      ctx.status = 200
      ctx.body = fs.createReadStream(digestPath)
    }
  }
})

app.listen(process.env.UNHASH_PORT || 3000)
