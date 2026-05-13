
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { formatDate, capitalize, initials, isValidEmail } from '../utils/index';
import { resolveAvatar } from '../utils/avatar';
import Button from '../components/ui/Button';

describe('Prueba 1 – formatDate', () => {
  it('formatea una fecha ISO al formato "d de MMMM yyyy" en español', () => {
    const result = formatDate('2024-03-15T12:00:00');
    expect(result).toMatch(/15/);
    expect(result.toLowerCase()).toMatch(/marzo/);
    expect(result).toMatch(/2024/);
  });
});


describe('Prueba 2 – isValidEmail', () => {
  it('retorna true para correos válidos y false para inválidos', () => {
    expect(isValidEmail('paciente@gmail.com')).toBe(true);
    expect(isValidEmail('doctor.apellido@hospital.mx')).toBe(true);
    expect(isValidEmail('no-es-un-correo')).toBe(false);
    expect(isValidEmail('@sinusuario.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});


describe('Prueba 3 – resolveAvatar', () => {
  it('devuelve undefined si no se pasa URL', () => {
    expect(resolveAvatar(undefined)).toBeUndefined();
    expect(resolveAvatar(null)).toBeUndefined();
    expect(resolveAvatar('')).toBeUndefined();
  });

  it('devuelve la URL tal cual si ya es absoluta (http/https)', () => {
    const googleUrl = 'https://lh3.googleusercontent.com/foto.jpg';
    expect(resolveAvatar(googleUrl)).toBe(googleUrl);
  });

  it('antepone la base del API a rutas relativas', () => {
    const relativa = '/uploads/avatars/foto.jpg';
    const resultado = resolveAvatar(relativa);
    expect(resultado).toMatch(/^http/);
    expect(resultado).toContain('/uploads/avatars/foto.jpg');
    expect(resultado).not.toContain('/api/uploads');
  });
});


describe('Prueba 4 – capitalize e initials', () => {
  it('capitalize pone en mayúscula solo la primera letra', () => {
    expect(capitalize('DOCTOR')).toBe('Doctor');
    expect(capitalize('juan pérez')).toBe('Juan pérez');
  });

  it('initials extrae hasta 2 iniciales del nombre completo', () => {
    expect(initials('Luis Hernández')).toBe('LH');
    expect(initials('Ana')).toBe('A');
    expect(initials('María José García')).toBe('MJ');
  });
});


describe('Prueba 5 – Componente Button', () => {
  it('muestra el texto pasado como children', () => {
    render(<Button>Agendar cita</Button>);
    expect(screen.getByRole('button', { name: /agendar cita/i })).toBeInTheDocument();
  });

  it('llama al onClick cuando se hace click', async () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Confirmar</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('queda deshabilitado cuando loading=true', () => {
    render(<Button loading>Guardando…</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('queda deshabilitado cuando disabled=true', () => {
    render(<Button disabled>Sin slots</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
