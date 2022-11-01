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
  const envStartRut = myArgs[3]
  const envQtyFromStart = myArgs[4]

  const dir = `./Data/${envYear}/${envMonth}`

  let facturas = []
  datosClientes.forEach(({ rut, dv, nombre }) => {
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
        dv,
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

  let suma = 0
  facturas.forEach((element) => {
    suma = suma + element.total
  })
  console.log('total facturas', suma)

  const hacerFacturas = async (page, envDate, envMonth, envYear, factura) => {
    const { rut, dv, fecha, descripcion, totalNeto, total, nombre } = factura

    const [dia, mes, anio] = fecha.split('/')
    const fechaFactura = `${anio}-${mes}-${dia}`

    const selectorFecha = 'input[name="EFXP_FCH_EMIS"]'

    const selectorRut = '#EFXP_RUT_RECEP'
    const selectorDv = '#EFXP_DV_RECEP'

    const selectorCiudad = 'input[name="EFXP_CIUDAD_RECEP"]'
    const ciudad = 'SANTIAGO'

    const selectorNombreProducto = 'input[name="EFXP_NMB_01"]'
    const nombreProducto = 'Pan corriente'
    const selectorCheckDesc = 'input[name="DESCRIP_01"]'
    const selectorCantidad = 'input[name="EFXP_QTY_01"]'
    const cantidad = '1'
    const selectorPrecio = 'input[name="EFXP_PRC_01"]'
    const selectorDescripcion = '#rowDescripcion_01 > td > textarea'

    const selectorCheckRef = 'input[name="REF_SI_NO"]'

    const selectorFormaDePago = 'select[name="EFXP_FMA_PAGO"]'
    const formaDePagoValue = '1' //contado

    const selectorRazonReferencia = 'input[name="EFXP_RAZON_REF_001"]'
    const razonReferencia = '0'

    const selectorTotal =
      '#invoice > div:nth-child(19) > div:nth-child(8) > div > input'

    await page.goto(
      'https://www1.sii.cl/cgi-bin/Portal001/mipeGenFacEx.cgi?PTDC_CODIGO=33'
    )

    await page.waitForSelector(selectorRut)
    await page.evaluate(
      () => (document.querySelector('input[name="EFXP_RUT_RECEP"]').value = '')
    )
    await page.evaluate(
      () => (document.querySelector('input[name="EFXP_DV_RECEP"]').value = '')
    )

    await page.type(selectorRut, rut)
    await page.type(selectorDv, dv)
    await page.waitForTimeout(1000)
    await page.$eval(selectorDv, (e) => e.blur())
    await page.waitForTimeout(3000)

    await page.evaluate(
      () =>
        (document.querySelector('input[name="EFXP_CIUDAD_RECEP"]').value = '')
    )
    await page.type(selectorCiudad, ciudad)

    await page.evaluate(
      (selectorFecha, fechaFactura) =>
        (document.querySelector(selectorFecha).value = fechaFactura),
      selectorFecha,
      fechaFactura
    )

    await page.type(selectorNombreProducto, nombreProducto)

    await page.evaluate(
      (selectorCheckDesc) => document.querySelector(selectorCheckDesc).click(),
      selectorCheckDesc
    )

    await page.evaluate(
      (selectorCheckRef) => document.querySelector(selectorCheckRef).click(),
      selectorCheckRef
    )

    await page.type(selectorCantidad, cantidad)

    await page.type(selectorPrecio, totalNeto.replace(',', '.'))

    await page.$eval(selectorPrecio, (e) => e.blur())

    // const precioInput = await page.$eval(selectorPrecio, (input) => {
    //   return input.getAttribute('value')
    // })

    // //CHECK INPUT INCLUDES DECIMAL POINT. IF NOT, CHANGE TO DECIMAL COMMA
    // if (!precioInput.includes('.')) {
    //   await page.type(selectorPrecio, totalNeto)
    //   await page.$eval(selectorPrecio, (e) => e.blur())
    // }

    await page.type(selectorDescripcion, descripcion)

    await page.select(selectorFormaDePago, formaDePagoValue)
    const selectorTipoDocReferencia = 'select[name="EFXP_TPO_DOC_REF_001"]'
    const selectorIndDocReferencia = 'input[name="EFXP_IND_GLOBAL_001"]'
    await page.select(selectorTipoDocReferencia, '52')

    await page.type(selectorIndDocReferencia, '1')

    await page.$eval(selectorIndDocReferencia, (e) => e.blur())

    await page.type(selectorRazonReferencia, razonReferencia)

    const totalInput = await page.$eval(selectorTotal, (input) => {
      return input.value
    })

    const totalInputTruncado = totalInput.replace(/.$/, '0')
    const totalTruncado = String(total).replace(/.$/, '0')

    if (
      totalInput.length !== String(total).length ||
      totalInputTruncado !== totalTruncado
    ) {
      console.log('totalInput', totalInput)
      console.log('totalInputTruncado', totalInputTruncado)
      throw Error('Total factura erroneo')
    }

    await page.evaluate(() =>
      document.querySelector('button[name="Button_Update"]').click()
    )

    const selectorConfirm = 'input[name="btnSign"]'
    await page.waitForSelector(selectorConfirm)

    await page.evaluate(() =>
      document.querySelector('input[name="btnSign"]').click()
    )

    const selectorPassword = '#myPass'
    await page.waitForSelector(selectorPassword)
    await page.waitForTimeout(2000)
    await page.evaluate(() => (document.querySelector('#myPass').value = ''))
    await page.type(selectorPassword, process.env.SII_PASSWORD)
    await page.waitForTimeout(500)

    // disable for dry run
    const dryRunMode = process.env.DRY_RUN.toLocaleLowerCase() === 'true'
    if (!dryRunMode) {
      await page.evaluate(() =>
        document.querySelector('button[id="btnFirma"]').click()
      )
      const selectorBotonVer =
        '#my-wrapper > div.web-sii.cuerpo > div > p.text-center > a'
      await page.waitForSelector(selectorBotonVer)
      console.log(`${nombre} - Factura Generada`)
    } else {
      console.log(`${nombre} - Factura NO generada (MODO PRUEBAS)`)
    }
    console.log('Total Factura', totalInput)
  }

  let indexWhile = 0
  if (envStartRut && envStartRut != 1) {
    indexWhile = facturas.findIndex(({ rut }) => {
      return rut === envStartRut
    })
  }
  console.log('envStartRut', envStartRut)
  console.log('indexWhile', indexWhile)

  if (indexWhile == -1) {
    console.log('////////////////////////////////////////////')
    console.log('Rut cliente no encontrado. Revisa bien -.-')
    console.log('////////////////////////////////////////////')
    return
  }

  const length = envQtyFromStart
    ? envQtyFromStart + indexWhile
    : facturas.length
  const maxErrors = 3
  let errorCount = 0

  while (indexWhile < length && errorCount < maxErrors) {
    let browserGlobal
    try {
      // LOGIN
      const { browser, page } = await login()
      browserGlobal = browser
      const factura = facturas[indexWhile]
      console.log('===============')
      console.log(`RUT: ${factura.rut}`)
      await hacerFacturas(page, envDate, envMonth, envYear, factura)
      indexWhile += 1
      errorCount = 0
      //close browser
      await browser.close()
    } catch (error) {
      console.log('Error')
      console.log(error)
      errorCount += 1
      browserGlobal?.close()
    }
  }
})()
