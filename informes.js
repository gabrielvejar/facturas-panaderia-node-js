require('dotenv').config()
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
  // LOGIN
  const { browser, page } = await login()
  const cliente = datosClientes.find(({ rut }) => rut == envStartRut)
  console.log('cliente', cliente)
  generarInformes(page, envDate, envMonth, envYear, cliente)

  // await browser.close()
})()
