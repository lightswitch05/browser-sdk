const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const middleware = require('webpack-dev-middleware')
const path = require('path')
const webpack = require('webpack')

const logsConfig = require('../../packages/logs/webpack.config')
const rumConfig = require('../../packages/rum/webpack.config')
const fakeBackend = require('./fake-backend')
const buildEnv = require('.././../build-env')

let port = 3000
const app = express()
app.use(express.static(path.join(__dirname, '../static')))
app.use(express.static(path.join(__dirname, '../app/dist')))

if (process.env.ENV === 'development') {
  port = 8080
  app.use(middleware(webpack(withBuildEnv(rumConfig(null, { mode: 'development' })))))
  app.use(middleware(webpack(withBuildEnv(logsConfig(null, { mode: 'development' })))))
} else {
  // e2e tests
  app.use(express.static(path.join(__dirname, '../../packages/logs/bundle')))
  app.use(express.static(path.join(__dirname, '../../packages/rum/bundle')))
  app.use(bodyParser.text())
  app.use(cors())
  fakeBackend(app)
}

app.listen(port, () => console.log(`server listening on port ${port}.`))

function withBuildEnv(webpackConf) {
  webpackConf.module = {
    ...webpackConf.module,
    rules: [
      ...webpackConf.module.rules,
      ...Object.keys(buildEnv).map((key) => ({
        test: /\.ts$/,
        loader: 'string-replace-loader',
        options: {
          search: `<<< ${key} >>>`,
          replace: buildEnv[key],
        },
      })),
    ],
  }
  return webpackConf
}
