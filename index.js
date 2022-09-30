require("dotenv").config();
const puppeteer = require("puppeteer");
const datosClientes = require("./datosClientes.json");
const diasSinGuias = require("./diasSinGuias.json");

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const calcDaysQty = (startDate, endDate) => {
  startDate = Number(startDate);
  endDate = Number(endDate);
  return endDate - startDate + 1;
};

(async () => {
  const login = async () => {
    console.log("Iniciando sesión en SII ...");
    const browser = await puppeteer.launch({
      headless: process.env.HEADLESS.toLocaleLowerCase() === "true",
      args: ["--start-maximized"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    page.setDefaultNavigationTimeout(Number(process.env.DEFAULT_TIMEOUT));

    page.on("dialog", async (dialog) => {
      //get alert message
      console.log(dialog.message());
      //accept alert
      await dialog.accept();
    });
    
    try {    
      await page.goto(
        "https://zeusr.sii.cl//AUT2000/InicioAutenticacion/IngresoRutClave.html?https://misiir.sii.cl/cgi_misii/siihome.cgi"
      );

      //INGRESAR CREDENCIALES
      await page.type('input[name="rutcntr"]', "9.488.274-5");
      await page.type('input[name="clave"]', "perez1962");

      //CLICK INICIAR SESION
      const submitButton = await page.$("#bt_ingresar");
      await submitButton.evaluate((submitButton) => submitButton.click());

      await page.waitForTimeout(3000);

      // REDIRECCION FACTURACION
      await page.goto(
        "https://www1.sii.cl/cgi-bin/Portal001/mipeLaunchPage.cgi?OPCION=2&TIPO=4"
      );
      await page.waitForSelector('select[name="RUT_EMP"]');
      await page.select('select[name="RUT_EMP"]', "77134361-9");
      //CLICK BOTON SELECCION EMPRESA
      const submitEmpresa = await page.$(
        "#fPrmEmpPOP > div > div.col-sm-12.text-center > button"
      );
      await submitEmpresa.evaluate((submitEmpresa) => submitEmpresa.click());

      await page.waitForSelector("#tablaDatos_wrapper");

      console.log("Sesión iniciada con éxito.");
      return { browser, page };
    } catch (error) {
      browser.close();
      throw new Error("Error al iniciar sesión.");
    }
  };

  const generarGuiasDia = async (page, dia, mes, anio, cliente) => {
    const { rut, dv, kilos, kilos_variables, precio, nombre } = cliente;
    if (
      diasSinGuias.todos.includes(dia) ||
      (diasSinGuias[rut] && diasSinGuias[rut].includes(dia))
    ) {
      console.log(`${nombre} - guía NO generada para el día ${dia}`);
      return;
    }

    const ciudad = "SANTIAGO";
    const selectorRut = 'input[name="EFXP_RUT_RECEP"]';
    const selectorDv = 'input[name="EFXP_DV_RECEP"]';

    const selectorCiudad = 'input[name="EFXP_CIUDAD_RECEP"]';
    const selectorDia = 'select[name="cbo_dia_boleta"]';
    const selectorMes = 'select[name="cbo_mes_boleta"]';
    const selectorAnio = 'select[name="cbo_anio_boleta"]';

    const selectorKilos = 'input[name="EFXP_QTY_01"]';
    const selectorPrecioUn = 'input[name="EFXP_PRC_01"]';

    await page.goto(
      "https://www1.sii.cl/cgi-bin/Portal001/mipeGenFacEx.cgi?IGUAL=CODIGO&VALOR=1663100846&PTDC_CODIGO=52"
    );

    await page.waitForSelector(selectorRut);
    await page.evaluate(
      () => (document.querySelector('input[name="EFXP_RUT_RECEP"]').value = "")
    );
    await page.evaluate(
      () => (document.querySelector('input[name="EFXP_DV_RECEP"]').value = "")
    );

    await page.type(selectorRut, rut);
    await page.type(selectorDv, dv);
    await page.waitForTimeout(1000);
    await page.$eval(selectorDv, (e) => e.blur());
    await page.waitForTimeout(3000);

    await page.evaluate(
      () =>
        (document.querySelector('input[name="EFXP_CIUDAD_RECEP"]').value = "")
    );
    await page.type(selectorCiudad, ciudad);
    await page.select(selectorDia, dia);
    await page.select(selectorMes, mes);
    await page.select(selectorAnio, anio);

    await page.evaluate(
      () => (document.querySelector('input[name="EFXP_QTY_01"]').value = "")
    );
    await page.evaluate(
      () => (document.querySelector('input[name="EFXP_PRC_01"]').value = "")
    );
    //kilos fijos o variables
    let variacion = kilos > 10 ? Math.floor(kilos / 10) : 1;
    variacion = variacion > 3 ? 3 : variacion;
    const kilosFijosVariables = kilos_variables
      ? getRandomIntInclusive(kilos - variacion, kilos + variacion)
      : kilos;
    // console.log("kilos", kilos)
    // console.log("variacion", variacion)
    await page.type(selectorKilos, String(kilosFijosVariables));
    //precio unitario neto
    await page.type(
      selectorPrecioUn,
      String((precio / 1.19).toFixed(2)).replace(".", ",")
    );

    await page.$eval(selectorPrecioUn, (e) => e.blur());

    await page.evaluate(() =>
      document.querySelector('button[name="Button_Update"]').click()
    );

    const selectorConfirm = 'input[name="btnSign"]';
    await page.waitForSelector(selectorConfirm);
    //
    await page.evaluate(() =>
      document.querySelector('input[name="btnSign"]').click()
    );

    const selectorPassword = "#myPass";
    await page.waitForSelector(selectorPassword);
    await page.waitForTimeout(2000);
    await page.evaluate(() => (document.querySelector("#myPass").value = ""));
    await page.type(selectorPassword, "perez1962");
    await page.waitForTimeout(500);

    // disable for dry run
    const dryRunMode = process.env.DRY_RUN.toLocaleLowerCase() === "true";
    if (!dryRunMode) {
      await page.evaluate(() =>
        document.querySelector('button[id="btnFirma"]').click()
      );
      const selectorBotonVer =
        "#my-wrapper > div.web-sii.cuerpo > div > p.text-center > a";
      await page.waitForSelector(selectorBotonVer);
      console.log(`${nombre} - guía generada para el día ${dia}`);
    } else {
      console.log(
        `${nombre} - guía NO generada para el día ${dia} (MODO PRUEBAS)`
      );
    }

    console.log("Kilos:", kilosFijosVariables);
    console.log("Total Guía: $", kilosFijosVariables * precio);
  };

  const myArgs = process.argv.slice(2);
  const envYear = myArgs[0];
  const envMonth = myArgs[1];
  const envStartDate = myArgs[2];
  const envEndDate = myArgs[3] || myArgs[2];
  const envStartRut = myArgs[4];
  const envQtyFromStart = myArgs[5];
  let currentDate = Number(envStartDate);

  console.log("HEADLESS:", process.env.HEADLESS.toLocaleLowerCase() === "true");
  const dryRunMode = process.env.DRY_RUN.toLocaleLowerCase() === "true";
  if (dryRunMode) {
    console.log(
      "MODO DE PRUEBAS (proceso completo pero sin firmar documento al final)"
    );
  }

  let indexWhile = envStartRut
    ? datosClientes.findIndex(({ rut }) => {
        return rut === envStartRut;
      })
    : 0;

  if (indexWhile == -1) {
    console.log("////////////////////////////////////////////");
    console.log("Rut cliente no encontrado. Revisa bien -.-");
    console.log("////////////////////////////////////////////");
    return;
  }

  for (let index = 0; index < calcDaysQty(envStartDate, envEndDate); index++) {
    const length = envQtyFromStart ?? datosClientes.length;
    const maxErrors = 3;
    let errorCount = 0;
    currentDate =
      String(currentDate).length === 1
        ? "0".concat(String(currentDate))
        : String(currentDate);
    // LOGIN
    const { browser, page } = await login();
    console.log(
      `Generando guías de despacho para el día ${envYear}/${envMonth}/${currentDate} ...`
    );
    while (indexWhile < length && errorCount < maxErrors) {
      try {
        const cliente = datosClientes[indexWhile];
        console.log("===============");
        console.log(`RUT: ${cliente.rut}`);
        await generarGuiasDia(page, currentDate, envMonth, envYear, cliente);
        indexWhile += 1;
        errorCount = 0;
      } catch (error) {
        console.log("Error");
        console.log(error);
        errorCount += 1;
      }
    }

    // await page.goto(
    //   "https://www1.sii.cl/cgi-bin/Portal001/mipeAdminDocsEmi.cgi?RUT_RECP=&FOLIO=&RZN_SOC=&FEC_DESDE=&FEC_HASTA=&TPO_DOC=&ESTADO=&ORDEN=&NUM_PAG=1"
    // );

    console.log("===============");
    console.log(`GUIAS FINALIZADAS. ${envYear}/${envMonth}/${currentDate}`);
    console.log("===============");

    indexWhile = 0;
    currentDate = Number(currentDate) + 1;
    await browser.close();
  }
})();
