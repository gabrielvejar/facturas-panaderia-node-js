require('dotenv').config()
const datosClientes = require('./datosClientes.json')
const diasSinGuias = require('./diasSinGuias.json')
const { getRandomIntInclusive } = require('./utils')
const { login } = require('./commands')

;(async () => {
  const generarFacturas = async (page, dia, mes, anio, cliente) => {}

  const myArgs = process.argv.slice(2)
  const envYear = myArgs[0]
  const envMonth = myArgs[1]
  const envDate = myArgs[2]
  const envStartRut = myArgs[4]
  const envQtyFromStart = myArgs[5]

  console.log('HEADLESS:', process.env.HEADLESS.toLocaleLowerCase() === 'true')
  const dryRunMode = process.env.DRY_RUN.toLocaleLowerCase() === 'true'
  if (dryRunMode) {
    console.log(
      'MODO DE PRUEBAS (proceso completo pero sin firmar documento al final)'
    )
  }

  await browser.close()
})()
