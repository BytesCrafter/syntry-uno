import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { UtilService } from './util.service';
import { Token } from '../model/token.model';
import { Permission } from '../model/permission.model';
import { MessagingService } from './messaging.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public static tokenKey: any = 'businext-token';
  public currentUser: any = null;

  private subject: BehaviorSubject<Token>;
  private observable: Observable<Token>;

  private permitSubject: BehaviorSubject<Permission>;
  private permitObservable: Observable<Permission>;

  constructor(
    private router: Router,
    private api: ApiService,
    private util: UtilService,
    private messaging: MessagingService
  ) {
    const jwtHash = localStorage.getItem(AuthService.tokenKey);
    let token = new Token();
    if(jwtHash !== null && jwtHash !== '') {
      token = this.util.jwtDecode(jwtHash);
      //const isExpired = jwt.isTokenExpired(token);
    }

    this.subject = new BehaviorSubject<Token>(token);
    this.observable = this.subject.asObservable();

    this.permitSubject = new BehaviorSubject<Permission>(null);
    this.permitObservable = this.permitSubject.asObservable();
  }

  public get userPermits(): Permission {
    if(this.isAuthenticated && typeof this.permitSubject.value !== 'undefined') {
      return this.permitSubject.value;
    }

    return null;
  }

  public get isAuthenticated(): boolean {
    const jwtHash = localStorage.getItem(AuthService.tokenKey);
    if(jwtHash == null || jwtHash === '') {
      return false;
    }

    return true;
  }

  public get userToken(): Token {
    if(this.isAuthenticated) {
      const jwtHash = localStorage.getItem(AuthService.tokenKey);
      if(jwtHash != null && jwtHash !== '') {
        const token = this.util.jwtDecode(jwtHash);
        this.subject.next(token);
        return this.subject.value;
      }
    } //TODO: Verify if okay to notfound return anything when nulled.

    return null;
  }

  public set setToken(jwtHash: string) {
    localStorage.setItem(AuthService.tokenKey, jwtHash);
    const token = this.util.jwtDecode(jwtHash);
    this.subject.next(token);
  }

  getInfo() {
    this.api.posts('users/get_user_info', {}).then((res: any) => {
      if(res && res.success === true && res.data) {
        this.currentUser = res.data;

        this.messaging.requestPermission(this.currentUser.id, this.userPermits.permissions.can_use_biometric);
        this.messaging.receiveMessage();
        //this.message = this.messaging.currentMessage;
      }
    }).catch(error => {
      console.log('error', error);
    });
  }

  login(username: string, password: string, callback) {
    this.api.posts('users/signin', {
      email: username,
      pword: password
    }).then((res: any) => {
      if(res && res.success === true && res.data) {
        localStorage.setItem(AuthService.tokenKey, res.data);
        const decoded: Token = this.util.jwtDecode(res.data);
        this.subject.next(decoded);
        callback({ success: res.success, data: decoded });
      } else {
        callback({ success: res.success, message: res.message });
      }

    }).catch(error => {
      console.log('error', error);
      callback({ success: false, message: 'Something went wrong!' });
    });
  }

  loadPermission() {
    if(!this.isAuthenticated) {
      return;
    }

    //If user have manage timecard then add
    this.api.posts('users/permissions', null)
    .then( (response: any) => {
      if(response && response.success && response.data) {
        this.permitSubject.next(response.data);
      } else {
        this.router.navigate([`/error`], {
          skipLocationChange: true
        });
      }
    }).catch(error => {
      console.log('error', error);
    });
  }

  logout() {
      // remove user from local storage to log user out
      localStorage.removeItem(AuthService.tokenKey);
      this.subject.next(null);
      this.router.navigate(['/login']);
  }
}
