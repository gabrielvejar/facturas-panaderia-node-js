const readline = require('readline')
const { spawn } = require('child_process')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const preguntar = (texto) =>
  new Promise((resolve) => {
    rl.question(texto, (respuesta) => resolve(respuesta.trim()))
  })

const completarDosDigitos = (valor) => String(Number(valor)).padStart(2, '0')

const validarNumero = (valor, nombre, min, max) => {
  const numero = Number(valor)

  if (!Number.isInteger(numero) || numero < min || numero > max) {
    throw new Error(`${nombre} debe ser un numero entre ${min} y ${max}.`)
  }

  return numero
}

const ejecutarGuias = (args) =>
  new Promise((resolve, reject) => {
    const proceso = spawn('node', ['guias.js', ...args], {
      stdio: 'inherit',
    })

    proceso.on('error', reject)
    proceso.on('close', (codigo) => {
      if (codigo === 0) {
        resolve()
      } else {
        reject(new Error(`guias.js termino con codigo ${codigo}.`))
      }
    })
  })

;(async () => {
  try {
    const hoy = new Date()
    const anioActual = String(hoy.getFullYear())
    const mesActual = completarDosDigitos(hoy.getMonth() + 1)

    console.log('Asistente para generar guias de despacho')
    console.log('Deja vacio año o mes para usar el valor actual.')
    console.log('')

    const anio = (await preguntar(`Año [${anioActual}]: `)) || anioActual
    const mesRespuesta = (await preguntar(`Mes [${mesActual}]: `)) || mesActual
    const diaInicioRespuesta = await preguntar('Dia inicio: ')
    const diaFinRespuesta =
      (await preguntar('Dia fin [mismo dia inicio]: ')) || diaInicioRespuesta
    const rutInicio = await preguntar('RUT inicial (opcional): ')
    const cantidadClientes = await preguntar('Cantidad clientes (opcional): ')

    validarNumero(anio, 'Año', 2000, 2100)
    const mes = completarDosDigitos(validarNumero(mesRespuesta, 'Mes', 1, 12))
    const diaInicio = completarDosDigitos(
      validarNumero(diaInicioRespuesta, 'Dia inicio', 1, 31)
    )
    const diaFin = completarDosDigitos(
      validarNumero(diaFinRespuesta, 'Dia fin', 1, 31)
    )

    if (Number(diaFin) < Number(diaInicio)) {
      throw new Error('Dia fin no puede ser menor que dia inicio.')
    }

    if (cantidadClientes) {
      validarNumero(cantidadClientes, 'Cantidad clientes', 1, 999)
    }

    const args = [String(anio), mes, diaInicio, diaFin]

    if (rutInicio) {
      args.push(rutInicio)
    }

    if (cantidadClientes) {
      if (!rutInicio) {
        throw new Error(
          'Para indicar cantidad de clientes tambien debes indicar RUT inicial.'
        )
      }

      args.push(cantidadClientes)
    }

    console.log('')
    console.log(`Comando: node guias.js ${args.join(' ')}`)
    const confirmar = await preguntar('Ejecutar? [s/N]: ')
    rl.close()

    if (confirmar.toLocaleLowerCase() !== 's') {
      console.log('Cancelado.')
      return
    }

    await ejecutarGuias(args)
  } catch (error) {
    rl.close()
    console.log('')
    console.log('No se pudo iniciar el asistente.')
    console.log(error.message)
    process.exitCode = 1
  }
})()
