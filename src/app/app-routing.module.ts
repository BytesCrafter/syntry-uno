import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';
import { BiometGuard } from './guard/biomet.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule),
      },
      {
        path: 'attendance',
        loadChildren: () => import('./pages/attendance/attendance.module').then( m => m.AttendancePageModule)
      },
      {
        path: 'schedule',
        loadChildren: () => import('./pages/schedule/schedule.module').then( m => m.SchedulePageModule)
      },
      {
        path: 'overtime',
        loadChildren: () => import('./pages/overtime/overtime.module').then( m => m.OvertimePageModule)
      },
      {
        path: 'teams',
        loadChildren: () => import('./pages/teams/teams.module').then( m => m.TeamsPageModule)
      },
      {
        path: 'todo',
        loadChildren: () => import('./pages/todo/todo.module').then( m => m.TodoPageModule)
      },
      {
        path: 'notes',
        loadChildren: () => import('./pages/notes/notes.module').then( m => m.NotesPageModule)
      },
      {
        path: 'messages',
        loadChildren: () => import('./pages/messages/messages.module').then( m => m.MessagesPageModule)
      },
      {
        path: 'camera',
        loadChildren: () => import('./reserved/camera/camera.module').then( m => m.CameraPageModule),
      },
      {
        path: 'gallery',
        loadChildren: () => import('./reserved/gallery/gallery.module').then( m => m.GalleryPageModule),
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.module').then( m => m.SettingsPageModule)
      },
      {
        path: 'qrscan',
        loadChildren: () => import('./pages/qrscan/qrscan.module').then( m => m.QrscanPageModule),
        canActivate: [BiometGuard]
      },
      {
        path: 'rfid',
        loadChildren: () => import('./pages/rfid/rfid.module').then( m => m.RfidPageModule)
      }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'notfound',
    loadChildren: () => import('./pages/static/notfound/notfound.module').then( m => m.NotfoundPageModule)
  },
  {
    path: 'error',
    loadChildren: () => import('./pages/static/error/error.module').then( m => m.ErrorPageModule)
  },
  {
    path: '**',
    redirectTo: 'notfound'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
