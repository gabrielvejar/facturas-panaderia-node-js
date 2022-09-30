require('dotenv').config()
const fs = require('fs')

const datosClientes = require('./datosClientes.json')
const diasSinGuias = require('./diasSinGuias.json')
const { getRandomIntInclusive } = require('./utils')
const { login } = require('./commands')
const { clickElement, typeOnInput } = require('./actions')

;(async () => {
  const generarInformes = async (page, diaFactura, mes, anio, cliente) => {
    const rutCliente = cliente.rut

    // Abrir buscador
    const selectorBuscador = '#headingFiltro > h5 > a'
    await clickElement(page, selectorBuscador)

    // RUT
    const selectorRut =
      '#collapseFiltro > div > form > div:nth-child(3) > div:nth-child(1) > div > input'
    await typeOnInput(page, selectorRut, rutCliente, 500)

    // Fecha desde
    const selectorFechaDesde =
      '#collapseFiltro > div > form > div:nth-child(5) > div:nth-child(1) > div > input'
    const fechaDesde = `01/${mes}/${anio}`
    await typeOnInput(page, selectorFechaDesde, fechaDesde, 500)

    // Fecha hasta
    const selectorFechaHasta =
      '#collapseFiltro > div > form > div:nth-child(5) > div:nth-child(2) > div > input'
    const fechaHasta = `${diaFactura}/${mes}/${anio}`
    await typeOnInput(page, selectorFechaHasta, fechaHasta, 500)

    // Tipo documento
    const selectorTipoDoc =
      '#collapseFiltro > div > form > div:nth-child(6) > div:nth-child(1) > div > select'
    await page.select(selectorTipoDoc, '52')

    // Botón Buscar
    const selectorBotonBuscar =
      '#collapseFiltro > div > form > div:nth-child(7) > div > input'
    await clickElement(page, selectorBotonBuscar)

    // Botón Informes
    const selectorBotonInformes =
      '#my-wrapper > div.web-sii.cuerpo > div > p > input:nth-child(1)'
    await clickElement(page, selectorBotonInformes)

    //SCRAPPING
    const selectorTabla = 'table#toPrint'
    await page.waitForSelector(selectorTabla)

    const contentJson = await page.evaluate((selectorTabla) => {
      const tbody = document.querySelector(selectorTabla + ' tbody')
      // iterate through the table rows
      const trs = Array.from(tbody.querySelectorAll('tr'))
      let content = []
      // iterate through each row of table
      for (const tr of trs) {
        const tds = Array.from(tr.querySelectorAll('td'))
        const data = tds.map((td) => td.innerText)
        if (tds.length >= 5) {
          // push the data
          content = [
            {
              rut: data[1],
              folio: data[3],
              fecha: data[4],
              monto: Number(data[5]),
            },
            ...content,
          ]
        }
      }
      return content
    }, selectorTabla)

    const dirData = `./Data/`
    if (!fs.existsSync(dirData)) {
      fs.mkdirSync(dirData)
    }

    const dirAnio = `./Data/${anio}`
    if (!fs.existsSync(dirAnio)) {
      fs.mkdirSync(dirAnio)
    }

    const dir = `./Data/${anio}/${mes}`
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    fs.writeFile(
      `${dir}/${cliente.rut}.json`,
      JSON.stringify(contentJson, null, 2),
      (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log(`Data of ${cliente.rut} Scraped`)
        }
      }
    )
  }

  const myArgs = process.argv.slice(2)
  const envYear = myArgs[0]
  const envMonth = myArgs[1]
  const envDate = myArgs[2]
  const envStartRut = myArgs[3]
  const envQtyFromStart = myArgs[4]

  console.log('HEADLESS:', process.env.HEADLESS.toLocaleLowerCase() === 'true')
  const dryRunMode = process.env.DRY_RUN.toLocaleLowerCase() === 'true'
  if (dryRunMode) {
    console.log(
      'MODO DE PRUEBAS (proceso completo pero sin firmar documento al final)'
    )
  }
  // const cliente = datosClientes.find(({ rut }) => rut == envStartRut)
  // console.log('cliente', cliente)
  // generarInformes(page, envDate, envMonth, envYear, cliente)

  let indexWhile = 0
  if (envStartRut && envStartRut != 1) {
    indexWhile = datosClientes.findIndex(({ rut }) => {
      return rut === envStartRut
    })
  }

  if (indexWhile == -1) {
    console.log('////////////////////////////////////////////')
    console.log('Rut cliente no encontrado. Revisa bien -.-')
    console.log('////////////////////////////////////////////')
    return
  }

  const length = envQtyFromStart ?? datosClientes.length
  const maxErrors = 3
  let errorCount = 0

  while (indexWhile < length && errorCount < maxErrors) {
    try {
      // LOGIN
      const { browser, page } = await login()
      const cliente = datosClientes[indexWhile]
      console.log('===============')
      console.log(`RUT: ${cliente.rut}`)
      await generarInformes(page, envDate, envMonth, envYear, cliente)
      indexWhile += 1
      errorCount = 0
      //close browser
      await browser.close()
    } catch (error) {
      console.log('Error')
      console.log(error)
      errorCount += 1
      await browser.close()
    }
  }
})()
