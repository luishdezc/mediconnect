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
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #f4f7fb;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .header {
      background: linear-gradient(135deg, #1a6b5c 0%, #0d4f3c 100%);
      padding: 32px;
      text-align: center;
    }

    .logo {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .logo span {
      color: rgba(255,255,255,0.75);
    }

    .logo::after {
      content: '';
      display: block;
      width: 40px;
      height: 3px;
      margin: 8px auto 0;
      background: rgba(255,255,255,0.6);
      border-radius: 2px;
    }

    .header p {
      color: rgba(255,255,255,0.8);
      margin: 8px 0 0;
      font-size: 14px;
    }

    .body {
      padding: 36px 32px;
      color: #2d3748;
      line-height: 1.6;
    }

    .card {
      background: #f8fafc;
      border-left: 4px solid #1a6b5c;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .btn {
      display: inline-block;
      background: #1a6b5c;
      color: white;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }

    .footer {
      background: #f8fafc;
      padding: 20px 32px;
      text-align: center;
      color: #718096;
      font-size: 13px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">Medi<span>Connect</span></h1>
      <p>Plataforma de Gestión de Citas Médicas</p>
    </div>

    <div class="body">
      ${content}
    </div>

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
    <h2 style="margin-top: 0; font-size: 22px; color: #1a202c;">
      Bienvenido a MediConnect, ${name}
    </h2>

    <p style="margin: 12px 0;">
      Nos alegra tenerte con nosotros. A partir de ahora puedes gestionar tu salud de forma más rápida, segura y organizada desde un solo lugar.
    </p>

    <div class="card">
      <strong style="display:block; margin-bottom: 10px; color:#1a6b5c;">
        ¿Qué puedes hacer ahora?
      </strong>

      <ul style="padding-left: 18px; margin: 0; line-height: 1.8;">
        <li>Buscar especialistas por nombre, ubicación o especialidad</li>
        <li>Agendar citas médicas en pocos pasos</li>
        <li>Acceder a tu historial clínico digital</li>
        <li>Comunicarte directamente con tu médico</li>
      </ul>
    </div>

    <p style="margin-top: 20px;">
      Para comenzar, accede a tu cuenta desde el siguiente enlace:
    </p>

    <a href="${process.env.CLIENT_URL}/login" class="btn">
      Acceder a mi cuenta
    </a>

    <p style="margin-top: 28px; font-size: 14px; color: #718096;">
      Si tienes alguna duda, puedes responder a este correo o contactar a nuestro equipo de soporte.
    </p>

    <p style="margin-top: 20px; font-size: 14px;">
      — Equipo de MediConnect
    </p>
  `;

  await transporter.sendMail({
    from: `"MediConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Bienvenido a MediConnect',
    html: baseTemplate(content),
  });
};

export const sendAppointmentConfirmation = async (
  to: string,
  patientName: string,
  details: {
    doctorName: string;
    date: Date;
    type: string;
    address: string;
  }
): Promise<void> => {

  const dateStr = details.date.toLocaleString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isVideo = details.type === 'video';

  const content = `
    <h2 style="margin-top:0; font-size:22px; color:#1a202c;">
      Cita confirmada
    </h2>

    <p>
      Hola <strong>${patientName}</strong>, tu cita ha sido agendada correctamente.
    </p>

    <div class="card">
      <p><strong>Doctor:</strong><br/> ${details.doctorName}</p>

      <p style="margin-top:10px;">
        <strong>Fecha y hora:</strong><br/> ${dateStr}
      </p>

      <p style="margin-top:10px;">
        <strong>Modalidad:</strong><br/>
        ${isVideo ? 'Videollamada' : 'Consulta presencial'}
      </p>

      ${
        !isVideo && details.address
          ? `
        <p style="margin-top:10px;">
          <strong>Dirección:</strong><br/>
          ${details.address}
        </p>
      `
          : ''
      }
    </div>

    ${
      isVideo
        ? `
      <p style="margin-top:20px;">
        Recibirás un enlace para unirte a la videollamada antes de tu cita.
      </p>
    `
        : `
      <p style="margin-top:20px;">
        Te recomendamos llegar al menos 10 minutos antes de tu cita.
      </p>
    `
    }

    <p style="margin-top:10px; color:#718096; font-size:14px;">
      Si necesitas reprogramar o cancelar, puedes hacerlo desde tu panel.
    </p>

    <a href="${process.env.CLIENT_URL}/patient/appointments" class="btn">
      Ver mis citas
    </a>

    <p style="margin-top:28px; font-size:14px;">
      — Equipo de MediConnect
    </p>
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
