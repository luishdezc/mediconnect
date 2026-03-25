import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const baseTemplate = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a6b5c 0%, #0d4f3c 100%); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; }
    .body { padding: 36px 32px; color: #2d3748; line-height: 1.6; }
    .card { background: #f8fafc; border-left: 4px solid #1a6b5c; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background: #1a6b5c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; color: #718096; font-size: 13px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 MediConnect</h1>
      <p>Plataforma de Gestión de Citas Médicas</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MediConnect. Todos los derechos reservados.</p>
      <p>Este correo fue enviado automáticamente, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  const content = `
    <h2>¡Bienvenido a MediConnect, ${name}! 👋</h2>
    <p>Nos alegra que te hayas unido a nuestra plataforma. Ahora puedes:</p>
    <div class="card">
      <ul>
        <li>Buscar doctores por especialidad y ubicación</li>
        <li>Agendar citas médicas en línea</li>
        <li>Consultar tu historial médico</li>
        <li>Comunicarte con tu médico por chat</li>
      </ul>
    </div>
    <a href="${process.env.CLIENT_URL}/login" class="btn">Iniciar sesión</a>
  `;
  await transporter.sendMail({
    from: `"MediConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject: '¡Bienvenido a MediConnect!',
    html: baseTemplate(content),
  });
};

export const sendAppointmentConfirmation = async (
  to: string,
  patientName: string,
  details: { doctorName: string; date: Date; type: string }
): Promise<void> => {
  const dateStr = details.date.toLocaleString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const content = `
    <h2>Cita Confirmada ✅</h2>
    <p>Hola <strong>${patientName}</strong>, tu cita ha sido agendada exitosamente.</p>
    <div class="card">
      <p><strong>👨‍⚕️ Doctor:</strong> ${details.doctorName}</p>
      <p><strong>📅 Fecha y hora:</strong> ${dateStr}</p>
      <p><strong>📍 Modalidad:</strong> ${details.type === 'video' ? 'Videollamada' : 'Presencial'}</p>
    </div>
    <p>Por favor, llega 10 minutos antes de tu cita. Si necesitas cancelar, hazlo con al menos 2 horas de anticipación.</p>
    <a href="${process.env.CLIENT_URL}/patient/appointments" class="btn">Ver mis citas</a>
  `;
  await transporter.sendMail({
    from: `"MediConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Confirmación de cita médica',
    html: baseTemplate(content),
  });
};

export const sendAppointmentReminder = async (
  to: string,
  patientName: string,
  details: { doctorName: string; date: Date }
): Promise<void> => {
  const dateStr = details.date.toLocaleString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });
  const content = `
    <h2>Recordatorio de Cita 🔔</h2>
    <p>Hola <strong>${patientName}</strong>, te recordamos que mañana tienes una cita médica.</p>
    <div class="card">
      <p><strong>👨‍⚕️ Doctor:</strong> ${details.doctorName}</p>
      <p><strong>⏰ Hora:</strong> ${dateStr}</p>
    </div>
    <p>¡No olvides asistir a tu consulta!</p>
    <a href="${process.env.CLIENT_URL}/patient/appointments" class="btn">Ver detalles</a>
  `;
  await transporter.sendMail({
    from: `"MediConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject: '⏰ Recordatorio: Cita médica mañana',
    html: baseTemplate(content),
  });
};
