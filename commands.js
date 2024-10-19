const puppeteer = require('puppeteer')
const actions = require('./actions')

module.exports = {
  login: async () => {
    console.log('Iniciando sesión en SII ...')
    const browser = await puppeteer.launch({
      headless: process.env.HEADLESS.toLocaleLowerCase() === 'true',
      args: ['--start-maximized'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1366, height: 768 })
    page.setDefaultNavigationTimeout(Number(process.env.DEFAULT_TIMEOUT))

    page.on('dialog', async (dialog) => {
      //get alert message
      console.log(dialog.message())
      //accept alert
      await dialog.accept()
    })

    try {
      await page.goto(
        'https://zeusr.sii.cl//AUT2000/InicioAutenticacion/IngresoRutClave.html?https://misiir.sii.cl/cgi_misii/siihome.cgi'
      )

      //INGRESAR CREDENCIALES
      await actions.typeOnInput(
        page,
        'input[name="rutcntr"]',
        process.env.SII_USER
      )
      await actions.typeOnInput(
        page,
        'input[name="clave"]',
        process.env.SII_PASSWORD
      )

      //CLICK INICIAR SESION
      const submitButton = await page.$('#bt_ingresar')
      await submitButton.evaluate((submitButton) => submitButton.click())

      await page.waitForTimeout(3000)

      // REDIRECCION FACTURACION
      await page.goto(
        'https://www1.sii.cl/cgi-bin/Portal001/mipeLaunchPage.cgi?OPCION=2&TIPO=4'
      )
      await page.waitForSelector('select[name="RUT_EMP"]')
      await page.select('select[name="RUT_EMP"]', '77134361-9')
      //CLICK BOTON SELECCION EMPRESA
      const submitEmpresa = await page.$(
        '#fPrmEmpPOP > div > div.col-sm-12.text-center > button'
      )
      await submitEmpresa.evaluate((submitEmpresa) => submitEmpresa.click())

      await page.waitForSelector('#tablaDatos_wrapper')

      console.log('Sesión iniciada con éxito.')
      return { browser, page }
    } catch (error) {
      browser.close()
      console.log(error)
      throw new Error('Error al iniciar sesión.')
    }
  },
}
