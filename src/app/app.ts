import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
  PLATFORM_ID,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  completada: boolean;
  fechaCreacion: string;
}

type Filtro = 'todas' | 'pendientes' | 'completadas';
type Vista = 'tareas' | 'ajustes';

interface Perfil {
  nombre: string;
  apellidos: string;
  avatarUrl: string;
}

// ─── Componente ──────────────────────────────────────────────────────────────

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-fondo flex flex-col transition-colors duration-300">

      <!-- ─── Cabecera (Header ZenTasks) ─────────────────────────── -->
      <header class="sticky top-0 z-40 bg-cabecera backdrop-blur-md shadow-sm border-b border-borde transition-colors duration-300">
        <div class="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <!-- Logo -->
          <div class="flex items-center gap-2 cursor-pointer" (click)="vistaActual.set('tareas')">
            <svg class="w-6 h-6 text-acento" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h1 class="text-[1.3rem] font-bold text-texto-primary tracking-tight">ZenTasks</h1>
          </div>

          <!-- Navegación y Controles -->
          <div class="flex items-center gap-6">
            <!-- Menú Links -->
            <button
              (click)="vistaActual.set('tareas')"
              class="text-sm font-semibold transition-colors duration-200"
              [class]="vistaActual() === 'tareas' ? 'text-acento' : 'text-texto-secondary hover:text-texto-primary'">
              Tareas
            </button>
            <button
              (click)="vistaActual.set('ajustes')"
              class="text-sm font-semibold transition-colors duration-200"
              [class]="vistaActual() === 'ajustes' ? 'text-acento' : 'text-texto-secondary hover:text-texto-primary'">
              Ajustes
            </button>

            <!-- Toggle Modo Oscuro Personalizado -->
            <label class="relative inline-flex items-center cursor-pointer ml-2" title="Alternar modo oscuro">
              <input type="checkbox" class="sr-only peer" [checked]="modoOscuro()" (change)="toggleTema()">
              <div class="w-12 h-6 bg-borde-check rounded-full peer peer-checked:bg-error transition-colors flex items-center relative shadow-inner">
                <div class="absolute left-[2px] w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6 flex items-center justify-center shadow-sm">
                  @if (modoOscuro()) {
                     <svg class="w-3 h-3 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  } @else {
                     <svg class="w-3 h-3 text-texto-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  }
                </div>
              </div>
            </label>

            <!-- Avatar Header -->
            <button (click)="vistaActual.set('ajustes')" class="relative">
              <img [src]="avatarValido()" alt="Avatar" class="w-9 h-9 rounded-full border-2 border-transparent hover:border-acento object-cover bg-acento-suave transition-all">
            </button>
          </div>
        </div>
      </header>

      <!-- ─── VISTA: TAREAS ────────────────────────────────────────── -->
      @if (vistaActual() === 'tareas') {
        <main class="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 animate-fade-in relative">
          
          <div class="text-center mb-10">
            <h2 class="text-3xl font-bold text-texto-primary tracking-tight">Mi Enfoque de Hoy</h2>
            <p class="text-texto-secondary mt-2 text-base">Mantente enfocado. Una tarea a la vez.</p>
          </div>

          <!-- Filtros Estilo Píldora -->
          <div class="flex justify-center gap-2 mb-8 bg-tarjeta p-1.5 rounded-full border border-borde drop-shadow-sm w-fit mx-auto transition-colors">
            @for (f of filtros; track f.valor) {
              <button
                (click)="filtroActivo.set(f.valor)"
                class="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                [class]="filtroActivo() === f.valor
                  ? 'bg-acento text-white shadow-sm'
                  : 'text-texto-secondary hover:text-texto-primary hover:bg-hover'">
                
                @if (f.valor === 'todas') {
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                }
                @if (f.valor === 'pendientes') {
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                }
                @if (f.valor === 'completadas') {
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                }
                {{ f.etiqueta }}
              </button>
            }
          </div>

          <!-- Estado vacío -->
          @if (tareasFiltradas().length === 0) {
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <p class="text-texto-muted text-lg">{{ mensajeVacio() }}</p>
            </div>
          }

          <!-- Lista de tareas -->
          <ul class="flex flex-col gap-4 mb-24 cursor-default">
            @for (tarea of tareasFiltradas(); track tarea.id) {
              <li class="grupo-tarea group flex items-center bg-tarjeta p-4 sm:px-6 rounded-2xl border border-borde shadow-sm hover:shadow-md transition-all duration-200">
                
                <!-- Checkbox -->
                <button
                  (click)="toggleCompletada(tarea)"
                  class="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center transition-colors border-2"
                  [class]="tarea.completada ? 'bg-error border-error' : 'border-borde-check hover:border-error'">
                   @if (tarea.completada) {
                     <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                   }
                </button>

                <!-- Contenido -->
                <div class="ml-4 flex-1 min-w-0 flex items-center justify-between">
                  <span class="font-semibold text-sm truncate max-w-[70%]"
                     [class.line-through]="tarea.completada"
                     [class.text-texto-muted]="tarea.completada"
                     [class.text-texto-primary]="!tarea.completada"
                     [title]="tarea.titulo">
                    {{ tarea.titulo }}
                  </span>
                  
                  <div class="flex items-center gap-4">
                    <span class="text-texto-muted text-xs font-medium whitespace-nowrap">{{ formatearFechaCorta(tarea.fechaCreacion) }}</span>
                    
                    <!-- Acciones hover -->
                    <div class="hidden group-hover:flex gap-1">
                      <button (click)="abrirModalEditar(tarea)" class="text-texto-muted hover:text-acento p-1 transition-colors" title="Editar">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button (click)="abrirModalEliminar(tarea)" class="text-texto-muted hover:text-error p-1 transition-colors" title="Eliminar">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a1 1 0 011-1h2a1 1 0 011 1v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>

              </li>
            }
          </ul>

          <!-- FAB Agregar Tarea -->
          <button (click)="abrirModalCrear()" class="fixed bottom-10 right-10 w-14 h-14 bg-error hover:bg-error-hover text-white rounded-full shadow-lg hover:scale-105 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center focus-ring z-30" title="Añadir nueva tarea">
             <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>

        </main>
      }

      <!-- ─── VISTA: AJUSTES ───────────────────────────────────────── -->
      @if (vistaActual() === 'ajustes') {
        <main class="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 animate-fade-in relative text-center">
            
            <div class="mb-10">
              <h2 class="text-3xl font-bold text-texto-primary tracking-tight">Ajustes de Perfil</h2>
              <p class="text-texto-secondary mt-2 text-base">Gestiona tu información personal</p>
            </div>
            
            <div class="bg-tarjeta rounded-3xl p-8 border border-borde shadow-sm text-left relative overflow-hidden transition-colors">
               
               <!-- Avatar Preview -->
               <div class="flex flex-col items-center mb-10">
                 <div class="w-24 h-24 rounded-full border-4 border-acento-suave shadow-sm bg-acento-suave/50 mb-4 overflow-hidden flex items-center justify-center">
                   <img [src]="avatarValido()" class="w-full h-full object-cover">
                 </div>
                 <p class="text-texto-muted text-sm font-medium">Vista previa del avatar</p>
               </div>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                 <div>
                   <label class="block text-sm font-semibold text-texto-primary mb-2">Nombre</label>
                   <input [(ngModel)]="formPerfil.nombre" type="text" class="w-full bg-fondo border border-borde text-texto-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-acento focus:border-acento outline-none transition-all placeholder:text-texto-muted">
                 </div>
                 <div>
                   <label class="block text-sm font-semibold text-texto-primary mb-2">Apellidos</label>
                   <input [(ngModel)]="formPerfil.apellidos" type="text" class="w-full bg-fondo border border-borde text-texto-primary px-4 py-3 rounded-xl focus:ring-2 focus:ring-acento focus:border-acento outline-none transition-all placeholder:text-texto-muted">
                 </div>
               </div>
               
               <div class="mb-8 relative">
                 <label class="block text-sm font-semibold text-texto-primary mb-2">URL del Avatar</label>
                 <div class="relative flex items-center">
                   <svg class="absolute left-4 w-5 h-5 text-texto-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                   <input [(ngModel)]="formPerfil.avatarUrl" type="url" class="w-full bg-fondo border border-borde text-texto-primary pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-acento focus:border-acento outline-none transition-all">
                 </div>
                 <p class="text-xs text-texto-muted mt-2">Pega aquí el enlace directo a tu imagen de perfil.</p>
               </div>

               <div class="flex justify-end pt-4 border-t border-borde">
                 <button (click)="guardarPerfil()" class="bg-error hover:bg-error-hover text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Guardar Cambios
                 </button>
               </div>
               
               <!-- Toast Perfil Guardado -->
               <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-acento text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md transition-opacity duration-300 pointer-events-none flex items-center gap-2" [class.opacity-0]="!mostrarToastPerfil" [class.opacity-100]="mostrarToastPerfil">
                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                 Perfil actualizado
               </div>
            </div>
        </main>
      }

      <!-- ═══════════════════════════════════════════════════════════
           MODAL CREAR / EDITAR TAREA
      ═══════════════════════════════════════════════════════════ -->
      @if (mostrarModalForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-[2px]" (click)="cerrarModales()">
          <div class="bg-tarjeta rounded-2xl shadow-modal w-full max-w-md overflow-hidden border border-borde animate-modal" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-borde">
              <h2 class="text-lg font-bold text-texto-primary">
                {{ modoEdicion() ? 'Editar tarea' : 'Nueva tarea' }}
              </h2>
              <button (click)="cerrarModales()" class="w-8 h-8 rounded-lg text-texto-muted hover:bg-hover flex items-center justify-center transition-colors">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <!-- Body -->
            <div class="p-6 flex flex-col gap-5">
              <div>
                <label class="block text-sm font-semibold text-texto-secondary mb-1">Título</label>
                <input [(ngModel)]="formTitulo" (keydown.enter)="guardarTarea()" type="text" class="w-full px-4 py-3 rounded-xl border border-borde bg-fondo text-texto-primary focus:ring-2 focus:ring-error focus:border-error outline-none">
              </div>
              <div>
                <label class="block text-sm font-semibold text-texto-secondary mb-1">Descripción</label>
                <textarea [(ngModel)]="formDescripcion" rows="3" class="w-full px-4 py-3 rounded-xl border border-borde bg-fondo text-texto-primary focus:ring-2 focus:ring-error focus:border-error outline-none resize-none"></textarea>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-6 py-4 bg-fondo border-t border-borde flex justify-end gap-3">
              <button (click)="cerrarModales()" class="px-5 py-2.5 rounded-xl text-sm font-bold text-texto-secondary hover:bg-tarjeta transition-colors">Cancelar</button>
              <button (click)="guardarTarea()" [disabled]="!formTitulo.trim()" class="px-5 py-2.5 rounded-xl text-sm font-bold bg-error hover:bg-error-hover text-white shadow-sm transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                {{ modoEdicion() ? 'Guardar' : 'Añadir tarea' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════════
           MODAL CONFIRMAR ELIMINACIÓN
      ═══════════════════════════════════════════════════════════ -->
      @if (mostrarModalEliminar()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-[2px]" (click)="cerrarModales()">
          <div class="bg-tarjeta rounded-2xl shadow-modal w-full max-w-sm overflow-hidden border border-borde animate-modal text-center p-6" (click)="$event.stopPropagation()">
            <div class="w-12 h-12 rounded-full bg-error-suave flex items-center justify-center mx-auto mb-4">
               <svg class="w-6 h-6 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a1 1 0 011-1h2a1 1 0 011 1v2"/></svg>
            </div>
            <h2 class="text-lg font-bold text-texto-primary mb-2">Eliminar tarea</h2>
            <p class="text-sm text-texto-secondary mb-6">¿Borrar "{{ tareaAEliminar()?.titulo }}"? Esta acción no se puede deshacer.</p>
            <div class="flex gap-3">
              <button (click)="cerrarModales()" class="flex-1 py-2.5 bg-fondo hover:bg-hover text-texto-primary font-bold rounded-xl transition-colors">Cancelar</button>
              <button (click)="confirmarEliminar()" class="flex-1 py-2.5 bg-error hover:bg-error-hover text-white font-bold rounded-xl shadow transition-colors active:scale-95">Eliminar</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-modal { animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  `]
})
export class App implements OnInit {
  private readonly STORAGE_KEY = 'tareas-pendientes-v2';
  private readonly THEME_KEY   = 'tareas-tema-v1';
  private readonly PROFILE_KEY = 'tareas-perfil-v1';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ─── Estado ──────────────────────────────────────────────────────────────
  vistaActual  = signal<Vista>('tareas');
  tareas       = signal<Tarea[]>(this.cargarTareas());
  filtroActivo = signal<Filtro>('todas');
  modoOscuro   = signal<boolean>(false);
  
  // Perfil
  perfil = signal<Perfil>(this.cargarPerfil());
  formPerfil: Perfil = { ...this.perfil() };
  mostrarToastPerfil = false;

  // Estado modales Tareas
  mostrarModalForm    = signal(false);
  mostrarModalEliminar = signal(false);
  modoEdicion         = signal(false);
  tareaEditando       = signal<Tarea | null>(null);
  tareaAEliminar      = signal<Tarea | null>(null);
  formTitulo      = '';
  formDescripcion = '';

  // ─── Inicialización ─────────────────────────────────────────────────────
  constructor() {
    effect(() => {
      this.guardarTareasStorage(this.tareas());
    });
    effect(() => {
      this.guardarPerfilStorage(this.perfil());
    });
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    const guardado = localStorage.getItem(this.THEME_KEY);
    const prefiereModo = guardado ? guardado === 'oscuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.aplicarTema(prefiereModo);
  }

  // ─── Control de Tema ────────────────────────────────────────────────────
  toggleTema() {
    this.aplicarTema(!this.modoOscuro());
  }

  private aplicarTema(oscuro: boolean) {
    this.modoOscuro.set(oscuro);
    if (document && document.documentElement) {
      if (oscuro) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    if (this.isBrowser) {
      localStorage.setItem(this.THEME_KEY, oscuro ? 'oscuro' : 'claro');
    }
  }

  // ─── Control de Perfil ──────────────────────────────────────────────────
  private cargarPerfil(): Perfil {
    if (!this.isBrowser) return this.defaultPerfil();
    try {
      const raw = localStorage.getItem(this.PROFILE_KEY);
      return raw ? JSON.parse(raw) : this.defaultPerfil();
    } catch {
      return this.defaultPerfil();
    }
  }

  private guardarPerfilStorage(p: Perfil) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(p));
    } catch (e) {}
  }

  private defaultPerfil(): Perfil {
    return {
      nombre: 'Usuario',
      apellidos: 'Zen',
      avatarUrl: ''
    };
  }

  avatarValido() {
    const p = this.perfil();
    if (p.avatarUrl && p.avatarUrl.trim().startsWith('http')) {
      return p.avatarUrl;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.nombre || 'Zen'}`;
  }

  guardarPerfil() {
    this.perfil.set({ ...this.formPerfil });
    this.mostrarToastPerfil = true;
    setTimeout(() => this.mostrarToastPerfil = false, 3000);
  }

  // ─── Filtros & Tareas ──────────────────────────────────────────────────
  readonly filtros = [
    { valor: 'todas'       as Filtro, etiqueta: 'Todas' },
    { valor: 'pendientes'  as Filtro, etiqueta: 'Pendientes' },
    { valor: 'completadas' as Filtro, etiqueta: 'Completadas' },
  ];

  tareasFiltradas = computed(() => {
    const f = this.filtroActivo();
    const ts = this.tareas();
    if (f === 'pendientes')  return ts.filter(t => !t.completada);
    if (f === 'completadas') return ts.filter(t => t.completada);
    return ts;
  });

  mensajeVacio = computed(() => {
    const f = this.filtroActivo();
    if (f === 'pendientes')  return 'No hay tareas pendientes. ¡Todo al día!';
    if (f === 'completadas') return 'Aún no has completado ninguna tarea.';
    return 'No tienes tareas todavía. Presiona el botón + para empezar.';
  });

  private cargarTareas(): Tarea[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private guardarTareasStorage(tareas: Tarea[]) {
    if (!this.isBrowser) return;
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tareas)); } catch (e) {}
  }

  toggleCompletada(tarea: Tarea) {
    this.tareas.update(ts => ts.map(t => t.id === tarea.id ? { ...t, completada: !t.completada } : t));
  }

  guardarTarea() {
    const titulo = this.formTitulo.trim();
    if (!titulo) return;

    if (this.modoEdicion() && this.tareaEditando()) {
      this.tareas.update(ts => ts.map(t => t.id === this.tareaEditando()!.id ? { ...t, titulo, descripcion: this.formDescripcion.trim() } : t));
    } else {
      const nueva: Tarea = {
        id: crypto.randomUUID(),
        titulo,
        descripcion: this.formDescripcion.trim(),
        completada: false,
        fechaCreacion: new Date().toISOString(),
      };
      this.tareas.update(ts => [nueva, ...ts]);
    }
    this.cerrarModales();
  }

  confirmarEliminar() {
    const t = this.tareaAEliminar();
    if (!t) return;
    this.tareas.update(ts => ts.filter(x => x.id !== t.id));
    this.cerrarModales();
  }

  abrirModalCrear() {
    this.formTitulo = '';
    this.formDescripcion = '';
    this.modoEdicion.set(false);
    this.tareaEditando.set(null);
    this.mostrarModalForm.set(true);
  }

  abrirModalEditar(tarea: Tarea) {
    this.formTitulo = tarea.titulo;
    this.formDescripcion = tarea.descripcion;
    this.modoEdicion.set(true);
    this.tareaEditando.set(tarea);
    this.mostrarModalForm.set(true);
  }

  abrirModalEliminar(tarea: Tarea) {
    this.tareaAEliminar.set(tarea);
    this.mostrarModalEliminar.set(true);
  }

  cerrarModales() {
    this.mostrarModalForm.set(false);
    this.mostrarModalEliminar.set(false);
    this.tareaAEliminar.set(null);
    this.tareaEditando.set(null);
  }

  formatearFechaCorta(iso: string): string {
    try {
      const str = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(iso));
      return str.replace('.', ''); // Fix for 'ene.' vs 'ene'
    } catch { return iso.split('T')[0]; }
  }
}
