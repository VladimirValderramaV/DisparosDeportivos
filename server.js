// Cargar las variables de entorno
require('dotenv').config();

// Requerir las dependencias
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { WebpayPlus } = require('transbank-sdk');

// Crear la aplicación de Express
const app = express();

// Configurar Express para manejar datos JSON
app.use(express.json());

// Conectar a MongoDB usando la URI desde el archivo .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Configurar Multer para el almacenamiento de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Establecer la carpeta para guardar los archivos cargados
  },
  filename: (req, file, cb) => {
    // Asignar un nombre único basado en la fecha y la extensión del archivo
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Ruta para cargar una imagen
app.post('/upload', upload.single('image'), (req, res) => {
  if (req.file) {
    res.status(200).send('Archivo cargado exitosamente.');
  } else {
    res.status(400).send('Error en la carga de archivo.');
  }
});

// Ruta para procesar pagos con WebpayPlus (Transbank)
app.post('/pagar', async (req, res) => {
  try {
    // Crear una nueva transacción de Webpay
    const tx = new WebpayPlus.Transaction();
    
    // Datos de la transacción
    const response = await tx.create(
      'orden123',      // Orden de compra
      'sesion123',     // Sesión del cliente
      10000,           // Monto de la transacción (en CLP)
      'http://tu-sitio.com/resultado'  // URL a la que se redirige luego del pago
    );
    
    // Redirigir al cliente a la URL de Webpay con el token de la transacción
    res.redirect(response.url + '?token_ws=' + response.token);
  } catch (error) {
    console.error('Error al crear la transacción:', error);
    res.status(500).send('Error al procesar el pago.');
  }
});

// Configurar el puerto y arrancar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
