// Función para enviar notificaciones push
exports.handler = async (event, context) => {
  // Este es un ejemplo básico
  // Para notificaciones push reales, necesitarías:
  // 1. Registrar tokens de dispositivos
  // 2. Usar un servicio como Firebase Cloud Messaging
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { technicianId, message, requestNumber } = JSON.parse(event.body);
    
    // Aquí conectarías con FCM o tu servicio de push
    console.log(`Notificación para técnico ${technicianId}: ${message}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Notificación enviada'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};