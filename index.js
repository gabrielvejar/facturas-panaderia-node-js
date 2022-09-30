const fs = require('fs')

fs.writeFile(`./Data/prueba.csv`, 'hola;123\nThi;223', (err) => {
  if (err) {
    console.log(err)
  } else {
    console.log(`archivo guardado`)
  }
})
