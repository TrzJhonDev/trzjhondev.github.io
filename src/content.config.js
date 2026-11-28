// Colecciones de contenido de Astro. Proyectos: un archivo Markdown por proyecto en src/content/proyectos/.
// El nombre del archivo es su dirección (proyecto-1.md → /proyectos/proyecto-1/). Ver la plantilla en esos archivos.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
  schema: z.object({
    title: z.string(), // nombre del proyecto
    summary: z.string(), // una o dos frases: qué problema resuelve y qué hiciste
    order: z.number(), // orden en la portada (1 = primero)
    role: z.string().default('[TU ROL]'), // p. ej. "Desarrollo completo" o "Backend y base de datos"
    year: z.string().default('[AÑO]'),
    tags: z.array(z.string()).default([]), // tecnologías
    image: z.string().nullable().default(null), // captura en /public, p. ej. "/proyectos/tienda.png" (16:10)
    code: z.string().default('#'), // enlace al repositorio
    demo: z.string().default('#'), // enlace a la versión publicada
  }),
});

export const collections = { proyectos };
