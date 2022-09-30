require('dotenv').config()
const datosClientes = require('./datosClientes.json')
const { meses } = require('./const.json')
const { getRandomIntInclusive } = require('./utils')
const { login } = require('./commands')
const fs = require('fs')

;(async () => {
  // const generarFacturas = async (page, dia, mes, anio, cliente) => {}

  const myArgs = process.argv.slice(2)
  const envYear = myArgs[0]
  const envMonth = myArgs[1]
  const envDate = myArgs[2]
  // const envStartRut = myArgs[4]
  // const envQtyFromStart = myArgs[5]

  // console.log('HEADLESS:', process.env.HEADLESS.toLocaleLowerCase() === 'true')
  // const dryRunMode = process.env.DRY_RUN.toLocaleLowerCase() === 'true'
  // if (dryRunMode) {
  //   console.log(
  //     'MODO DE PRUEBAS (proceso completo pero sin firmar documento al final)'
  //   )
  // }

  // await browser.close()

  const dir = `./Data/${envYear}/${envMonth}`

  let facturas = []
  datosClientes.forEach(({ rut, nombre }) => {
    try {
      let rawdata = fs.readFileSync(`${dir}/${rut}.json`)
      let guias = JSON.parse(rawdata)

      console.log(guias)

      let totalFactura = 0
      let descFactura = `Factura Guias de Despacho del Mes de ${meses[envMonth]} de ${envYear} segun detalle Guias de Despacho Electronicas Numeros `

      guias.forEach((guia) => {
        totalFactura += guia.monto
        descFactura = `${descFactura} ${guia.folio},`
      })

      const factura = {
        rut,
        nombre,
        fecha: `${envDate}/${envMonth}/${envYear}`,
        descripcion: descFactura.substring(0, descFactura.length - 1),
        totalNeto: String((totalFactura / 1.19).toFixed(2)).replace('.', ','),
        total: totalFactura,
      }

      console.log('factura', factura)
      facturas.push(factura)
    } catch (error) {
      console.log(`Archivo JSON no encontrado ${dir}/${rut}.json`)
      // console.log(error)
    }
  })

  const dirData = `./Data/`
  if (!fs.existsSync(dirData)) {
    fs.mkdirSync(dirData)
  }

  const dirFacturas = `./Data/Facturas`
  if (!fs.existsSync(dirFacturas)) {
    fs.mkdirSync(dirFacturas)
  }

  fs.writeFile(
    `${dirFacturas}/${envYear}-${envMonth}-${envDate}.json`,
    JSON.stringify(facturas, null, 2),
    (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log(`Archivo JSON de facturas generado`)
      }
    }
  )
})()
